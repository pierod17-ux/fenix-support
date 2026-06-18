import { createClient } from '@/lib/supabase/server'
import PromptEditor from '@/components/admin/PromptEditor'
import TicketToKnowledge from '@/components/admin/TicketToKnowledge'

export default async function TrainingPage() {
  const supabase = await createClient()

  const { data: promptConfig } = await supabase
    .from('ai_config')
    .select('*')
    .eq('key', 'system_context')
    .single()

  const { data: closedTickets } = await supabase
    .from('support_tickets')
    .select('id, subject, ai_summary, resolved_at, machine_model')
    .in('status', ['resolved', 'closed'])
    .eq('added_to_kb', false)
    .order('resolved_at', { ascending: false })
    .limit(20)

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
          Personalizza il comportamento dell&apos;assistente e impara dai ticket risolti
        </p>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PromptEditor currentValue={promptConfig?.value ?? ''} />

        <div style={{
          background: 'var(--surface)', borderRadius: 20,
          boxShadow: 'var(--shadow-md)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Ticket risolti → Knowledge Base
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Aggiungi le soluzioni dei ticket chiusi per addestrare l&apos;AI
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
