import { createServiceClient } from '@/lib/supabase/server'
import TechChatClient from './TechChatClient'

export default async function TechChatPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServiceClient()

  const { data: chat } = await supabase
    .from('direct_chats')
    .select('id, ticket_id, technician_id, status')
    .eq('access_token', token)
    .single()

  if (!chat) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f7', fontFamily: '-apple-system, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'rgba(255,59,48,0.1)', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', marginBottom: 8 }}>Link non valido</h1>
          <p style={{ fontSize: 14, color: '#6e6e73' }}>Questo link chat non è valido o è scaduto.</p>
        </div>
      </div>
    )
  }

  const [{ data: ticket }, { data: tech }, { data: messages }] = await Promise.all([
    supabase
      .from('support_tickets')
      .select('id, customer_name, customer_email, customer_phone, machine_model, machine_serial, center_name, subject, ai_summary, priority')
      .eq('id', chat.ticket_id)
      .single(),
    supabase
      .from('technician_profiles')
      .select('display_name')
      .eq('id', chat.technician_id)
      .single(),
    supabase
      .from('ticket_messages')
      .select('id, role, content, media_url, media_type, created_at')
      .eq('ticket_id', chat.ticket_id)
      .order('created_at'),
  ])

  return (
    <TechChatClient
      token={token}
      chat={chat}
      ticket={ticket}
      technicianName={tech?.display_name ?? 'Tecnico'}
      initialMessages={messages ?? []}
    />
  )
}
