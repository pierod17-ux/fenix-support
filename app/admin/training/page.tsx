import { createClient } from '@/lib/supabase/server'
import SystemContextsEditor from '@/components/admin/SystemContextsEditor'
import TicketToKnowledge from '@/components/admin/TicketToKnowledge'
import AIRulesEditor from '@/components/admin/AIRulesEditor'
import AICostTracker from '@/components/admin/AICostTracker'
import DocumentUpload from '@/components/admin/DocumentUpload'

export default async function TrainingPage() {
  const supabase = await createClient()

  const [
    { data: contextsConfig },
    { data: rulesConfig },
    { data: costLimitConfig },
    { data: closedTickets },
    { data: usageThisMonth },
  ] = await Promise.all([
    supabase.from('ai_config').select('value').eq('key', 'system_contexts').single(),
    supabase.from('ai_config').select('value').eq('key', 'behavior_rules').single(),
    supabase.from('ai_config').select('value').eq('key', 'cost_limit_usd').single(),
    supabase
      .from('support_tickets')
      .select('id, subject, ai_summary, resolved_at, machine_model')
      .in('status', ['resolved', 'closed'])
      .eq('added_to_kb', false)
      .order('resolved_at', { ascending: false })
      .limit(20),
    supabase
      .from('ai_usage_log')
      .select('input_tokens, output_tokens, cost_usd')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  const contexts = (() => {
    try { return contextsConfig?.value ? JSON.parse(contextsConfig.value) : [] }
    catch { return [] }
  })()

  const rules = (() => {
    try { return rulesConfig?.value ? JSON.parse(rulesConfig.value) : [] }
    catch { return [] }
  })()

  const costLimit = parseFloat(costLimitConfig?.value ?? '10')

  const usage = usageThisMonth ?? []
  const currentMonthCost = usage.reduce((s, r) => s + Number(r.cost_usd), 0)
  const inputTokens = usage.reduce((s, r) => s + r.input_tokens, 0)
  const outputTokens = usage.reduce((s, r) => s + r.output_tokens, 0)

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
          Training AI
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Personalizza il comportamento dell&apos;assistente, carica documenti, monitora i costi
        </p>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Cost tracker */}
        <AICostTracker data={{
          currentMonthCost,
          totalTokens: inputTokens + outputTokens,
          inputTokens,
          outputTokens,
          callCount: usage.length,
          limit: costLimit,
        }} />

        {/* Behavior rules */}
        <AIRulesEditor initialRules={rules} />

        {/* System contexts — multiple sections merged for AI */}
        <SystemContextsEditor initialContexts={contexts} />

        {/* Document upload */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Carica documenti di addestramento
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              PDF, DOCX, TXT — vengono indicizzati e resi disponibili all&apos;AI come contesto
            </p>
          </div>
          <div style={{ padding: 20 }}>
            <DocumentUpload />
          </div>
        </div>

        {/* Ticket → KB */}
        <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Ticket risolti → Knowledge Base
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              Converti le soluzioni dei ticket chiusi in documenti per addestrare l&apos;AI
            </p>
          </div>
          <div style={{ padding: 20 }}>
            <TicketToKnowledge tickets={closedTickets ?? []} />
          </div>
        </div>

      </div>
    </div>
  )
}
