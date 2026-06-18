import { createClient } from '@/lib/supabase/server'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalTickets },
    { count: resolvedTickets },
    { count: escalatedTickets },
    { data: ticketsByPriority },
    { data: ticketsByModel },
    { data: recentTickets },
  ] = await Promise.all([
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['resolved', 'closed']),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).not('escalated_at', 'is', null),
    supabase.from('support_tickets').select('priority').gte('created_at', thirtyDaysAgo),
    supabase.from('support_tickets').select('machine_model').gte('created_at', thirtyDaysAgo).not('machine_model', 'is', null),
    supabase.from('support_tickets').select('id, subject, status, priority, created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const resolutionRate = totalTickets ? Math.round(((resolvedTickets ?? 0) / totalTickets) * 100) : 0
  const escalationRate = totalTickets ? Math.round(((escalatedTickets ?? 0) / totalTickets) * 100) : 0
  const aiResolutionRate = 100 - escalationRate

  // Conta per priorità
  const priorityCounts = (ticketsByPriority ?? []).reduce((acc: Record<string, number>, t) => {
    acc[t.priority] = (acc[t.priority] ?? 0) + 1
    return acc
  }, {})

  // Conta per modello
  const modelCounts = (ticketsByModel ?? []).reduce((acc: Record<string, number>, t) => {
    if (t.machine_model) acc[t.machine_model] = (acc[t.machine_model] ?? 0) + 1
    return acc
  }, {})
  const topModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Ultimi 30 giorni</p>
      </div>

      {/* KPI principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ticket totali', value: totalTickets ?? 0, color: 'var(--text-primary)' },
          { label: 'Tasso risoluzione', value: `${resolutionRate}%`, color: 'var(--success)' },
          { label: 'Risolti da AI', value: `${aiResolutionRate}%`, color: 'var(--accent)' },
          { label: 'Escalation', value: `${escalationRate}%`, color: 'var(--warning)' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Per priorità */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Ticket per priorità</h3>
          <div className="space-y-3">
            {[
              { key: 'urgent', label: 'Urgente', color: 'var(--danger)' },
              { key: 'high', label: 'Alta', color: 'var(--warning)' },
              { key: 'medium', label: 'Media', color: 'var(--info)' },
              { key: 'low', label: 'Bassa', color: 'var(--text-secondary)' },
            ].map(p => {
              const count = priorityCounts[p.key] ?? 0
              const pct = totalTickets ? Math.round((count / totalTickets) * 100) : 0
              return (
                <div key={p.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{p.label}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Per modello macchina */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Ticket per modello</h3>
          <div className="space-y-3">
            {topModels.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nessun dato</p>
            )}
            {topModels.map(([model, count]) => {
              const pct = totalTickets ? Math.round((count / totalTickets) * 100) : 0
              return (
                <div key={model}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{model}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ultimi ticket */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Ultimi 5 ticket</h3>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {recentTickets?.map(t => (
            <div key={t.id} className="px-5 py-3.5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{t.subject}</p>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {new Date(t.created_at).toLocaleDateString('it-IT')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
