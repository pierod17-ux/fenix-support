import { createClient } from '@/lib/supabase/server'
import PromptEditor from '@/components/admin/PromptEditor'
import TicketToKnowledge from '@/components/admin/TicketToKnowledge'

export default async function TrainingPage() {
  const supabase = await createClient()

  // Carica il prompt di sistema corrente
  const { data: promptConfig } = await supabase
    .from('ai_config')
    .select('*')
    .eq('key', 'system_context')
    .single()

  // Ticket chiusi e risolti che non sono ancora in KB
  const { data: closedTickets } = await supabase
    .from('support_tickets')
    .select('id, subject, ai_summary, resolved_at, machine_model')
    .in('status', ['resolved', 'closed'])
    .eq('added_to_kb', false)
    .order('resolved_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Training AI</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Personalizza il comportamento dell&apos;assistente e impara dai ticket risolti
        </p>
      </div>

      {/* Prompt di sistema */}
      <PromptEditor currentValue={promptConfig?.value ?? ''} />

      {/* Ticket → Knowledge Base */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Ticket risolti → Knowledge Base
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Aggiungi le soluzioni dei ticket chiusi alla knowledge base per addestrare l&apos;AI
          </p>
        </div>
        <div className="p-5">
          <TicketToKnowledge tickets={closedTickets ?? []} />
        </div>
      </div>
    </div>
  )
}
