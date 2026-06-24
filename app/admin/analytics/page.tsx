import { createClient } from "@/lib/supabase/server"
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const statusColor: Record<string, { bg: string; text: string }> = {
  open:        { bg: 'rgba(255,59,48,0.10)',   text: '#ff3b30' },
  in_progress: { bg: 'rgba(255,149,0,0.12)',   text: '#ff9500' },
  resolved:    { bg: 'rgba(52,199,89,0.12)',   text: '#34c759' },
  closed:      { bg: 'rgba(110,110,115,0.12)', text: '#6e6e73' },
}
const statusLabel: Record<string, string> = {
  open: 'Aperto', in_progress: 'In gestione', resolved: 'Risolto', closed: 'Chiuso',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: totalTickets },
    { count: resolvedTickets },
    { count: escalatedTickets },
    { data: ticketsByPriority },
    { data: ticketsByModel },
    { data: ticketsByCategory },
    { data: recentTickets },
    { data: usageThisMonth },
    { data: costLimitData },
  ] = await Promise.all([
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['resolved', 'closed']),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).not('escalated_at', 'is', null),
    supabase.from('support_tickets').select('priority').gte('created_at', thirtyDaysAgo),
    supabase.from('support_tickets').select('machine_model').gte('created_at', thirtyDaysAgo).not('machine_model', 'is', null),
    supabase.from('support_tickets').select('problem_category').gte('created_at', thirtyDaysAgo).not('problem_category', 'is', null),
    supabase.from('support_tickets').select('id, subject, status, priority, created_at')
      .gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(8),
    supabase.from('ai_usage_log').select('input_tokens, output_tokens, cost_usd').gte('created_at', monthStart),
    supabase.from('ai_config').select('value').eq('key', 'cost_limit_usd').single(),
  ])

  const resolutionRate = totalTickets ? Math.round(((resolvedTickets ?? 0) / totalTickets) * 100) : 0
  const escalationRate = totalTickets ? Math.round(((escalatedTickets ?? 0) / totalTickets) * 100) : 0
  const aiResolutionRate = 100 - escalationRate

  const priorityCounts = (ticketsByPriority ?? []).reduce((acc: Record<string, number>, t) => {
    acc[t.priority] = (acc[t.priority] ?? 0) + 1; return acc
  }, {})

  const modelCounts = (ticketsByModel ?? []).reduce((acc: Record<string, number>, t) => {
    if (t.machine_model) acc[t.machine_model] = (acc[t.machine_model] ?? 0) + 1; return acc
  }, {})
  const topModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const categoryCounts = (ticketsByCategory ?? []).reduce((acc: Record<string, number>, t) => {
    if (t.problem_category) acc[t.problem_category] = (acc[t.problem_category] ?? 0) + 1; return acc
  }, {})
  const categorizedTotal = Object.values(categoryCounts).reduce((s, n) => s + n, 0)

  const usage = usageThisMonth ?? []
  const currentMonthCost = usage.reduce((s, r) => s + Number(r.cost_usd), 0)
  const costLimit = parseFloat(costLimitData?.value ?? '10')
  const costPct = costLimit > 0 ? Math.min((currentMonthCost / costLimit) * 100, 100) : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>

      {/* Page header */}
      <div style={{
        padding: '24px 24px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,245,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Analytics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Ultimi 30 giorni · {format(new Date(), "d MMMM yyyy", { locale: it })}
        </p>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI principali */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { label: 'Ticket totali',    value: totalTickets ?? 0,    color: 'var(--text-primary)', suffix: '' },
            { label: 'Tasso risoluzione', value: resolutionRate,      color: '#34c759', suffix: '%' },
            { label: 'Risolti da AI',    value: aiResolutionRate,     color: 'var(--accent)', suffix: '%' },
            { label: 'Escalation',       value: escalationRate,       color: '#ff9500', suffix: '%' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'var(--surface)', borderRadius: 16, padding: '16px 20px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                {kpi.value}{kpi.suffix}
              </p>
            </div>
          ))}
        </div>

        {/* Costi AI mese */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Costi AI — mese corrente</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>claude-sonnet-4-6</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>${currentMonthCost.toFixed(4)}</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>limite ${costLimit.toFixed(2)}</p>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              height: '100%', borderRadius: 4, width: `${costPct}%`,
              background: costPct > 95 ? '#ff3b30' : costPct > 80 ? '#ff9500' : '#34c759',
              transition: 'width 0.4s',
            }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {costPct.toFixed(1)}% del budget mensile · {usage.length} conversazioni
          </p>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Per priorità */}
          <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Per priorità
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'urgent', label: 'Urgente', color: '#ff3b30' },
                { key: 'high',   label: 'Alta',    color: '#ff9500' },
                { key: 'medium', label: 'Media',   color: '#3b82f6' },
                { key: 'low',    label: 'Bassa',   color: '#aeaeb2' },
              ].map(p => {
                const count = priorityCounts[p.key] ?? 0
                const pct = (totalTickets ?? 0) > 0 ? Math.round((count / (totalTickets ?? 1)) * 100) : 0
                return (
                  <div key={p.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: p.color, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per modello */}
          <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Per modello macchina
            </h3>
            {topModels.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Nessun dato disponibile</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topModels.map(([model, count]) => {
                  const pct = (totalTickets ?? 0) > 0 ? Math.round((count / (totalTickets ?? 1)) * 100) : 0
                  return (
                    <div key={model}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{model}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: 'var(--accent)', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Per categoria problema (assegnata dall'AI) */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Per categoria problema
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
              background: 'rgba(0,113,227,0.10)', color: 'var(--accent)',
            }}>
              AI
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Tipologia assegnata automaticamente dall&apos;AI all&apos;apertura del ticket
          </p>
          {categorizedTotal === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Nessun ticket categorizzato nel periodo</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'hardware',  label: 'Hardware',  color: '#ff3b30' },
                { key: 'PC',        label: 'PC',        color: '#0071e3' },
                { key: 'software',  label: 'Software',  color: '#34c759' },
                { key: 'firmware',  label: 'Firmware',  color: '#ff9500' },
                { key: 'meccanica', label: 'Meccanica', color: '#8e8e93' },
              ].map(cat => {
                const count = categoryCounts[cat.key] ?? 0
                const pct = categorizedTotal > 0 ? Math.round((count / categorizedTotal) * 100) : 0
                return (
                  <div key={cat.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cat.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-3)' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: cat.color, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ticket recenti */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Ticket recenti</h3>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ultimi 30 giorni</span>
          </div>
          {!recentTickets?.length ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Nessun ticket nel periodo</p>
            </div>
          ) : (
            recentTickets.map((t, i) => {
              const sc = statusColor[t.status] ?? { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 20px',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: sc.bg, color: sc.text, flexShrink: 0,
                  }}>
                    {statusLabel[t.status] ?? t.status}
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {format(new Date(t.created_at), 'dd/MM', { locale: it })}
                  </p>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
