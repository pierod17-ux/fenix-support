import { createClient } from '@/lib/supabase/server'
import ConversationsList from '@/components/admin/ConversationsList'

export const dynamic = 'force-dynamic'

export type Conversation = {
  id: string
  customer_name: string | null
  center_name: string | null
  machine_model: string | null
  subject: string | null
  status: string
  problem_category: string | null
  escalated_at: string | null
  created_at: string
  message_count: number
}

export default async function ConversationsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('support_tickets')
    .select('id, customer_name, center_name, machine_model, subject, status, problem_category, escalated_at, created_at, messages:ticket_messages(count)')
    .order('created_at', { ascending: false })
    .limit(300)

  const conversations: Conversation[] = (data ?? []).map(t => ({
    id: t.id,
    customer_name: t.customer_name,
    center_name: t.center_name,
    machine_model: t.machine_model,
    subject: t.subject,
    status: t.status,
    problem_category: t.problem_category ?? null,
    escalated_at: t.escalated_at,
    created_at: t.created_at,
    // PostgREST restituisce l'aggregato come [{ count: N }]
    message_count: Array.isArray(t.messages) ? (t.messages[0]?.count ?? 0) : 0,
  }))

  return <ConversationsList initial={conversations} />
}
