import { createServiceClient } from '@/lib/supabase/server'
import { resolveChatToken, claimChat } from '@/lib/direct-chat'
import TechChatClient from './TechChatClient'

// Pagina del tecnico. Il token puo' essere:
//  - un invito personale (link email): aprirlo = prendere in carico la chat,
//    se e' ancora libera. Se un collega l'ha gia' presa, lo si vede qui.
//  - il vecchio access_token della chat (link inviati prima degli inviti personali).
export default async function TechChatPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServiceClient()

  const resolved = await resolveChatToken(supabase, token)
  if (!resolved) {
    return (
      <StatusPage
        tone="error"
        title="Link non valido"
        text="Questo link chat non è valido o è scaduto."
      />
    )
  }
  const { chat, inviteTechId } = resolved

  let technicianName = 'Tecnico'
  if (inviteTechId) {
    const claim = await claimChat(supabase, chat, inviteTechId)
    if (claim.outcome === 'taken') {
      const when = claim.claimedAt
        ? new Date(claim.claimedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
        : null
      return (
        <StatusPage
          tone="info"
          title={`Presa in carico da ${claim.techName}`}
          text={`Questa richiesta è già gestita da ${claim.techName}${when ? ` dalle ${when}` : ''}. Non serve che intervenga tu: puoi chiudere questa pagina.`}
        />
      )
    }
    technicianName = claim.techName
  } else if (chat.technician_id) {
    const { data: tech } = await supabase
      .from('technician_profiles').select('display_name').eq('id', chat.technician_id).maybeSingle()
    technicianName = tech?.display_name ?? 'Tecnico'
  }

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase
      .from('support_tickets')
      .select('id, customer_name, customer_email, customer_phone, machine_model, machine_serial, center_name, subject, ai_summary, priority')
      .eq('id', chat.ticket_id)
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
      chat={{ id: chat.id, ticket_id: chat.ticket_id, status: chat.status }}
      ticket={ticket}
      technicianName={technicianName}
      initialMessages={messages ?? []}
    />
  )
}

function StatusPage({ tone, title, text }: { tone: 'error' | 'info'; title: string; text: string }) {
  const color = tone === 'error' ? '#ff3b30' : '#0071e3'
  const bg = tone === 'error' ? 'rgba(255,59,48,0.1)' : 'rgba(0,113,227,0.1)'
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f5f7', fontFamily: '-apple-system, sans-serif',
    }}>
      <div style={{ textAlign: 'center', padding: 40, maxWidth: 420 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: bg, margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {tone === 'error' ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.55 }}>{text}</p>
      </div>
    </div>
  )
}
