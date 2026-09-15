import { createServiceClient } from '@/lib/supabase/server'
import { sendDirectChatEmail } from '@/lib/email'
import { getOnCallTechnicians } from '@/lib/direct-chat'
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

// Apre la chat diretta cliente↔tecnico.
//  - Nessun tecnico di turno → 409: la chat NON viene aperta (il cliente e' gia'
//    stato informato che verra' ricontattato; l'escalation ha avvisato tutti).
//  - Uno o piu' di turno → la chat nasce NON assegnata e ogni tecnico riceve un
//    link personale (direct_chat_invites): il primo che lo apre la prende in
//    carico, gli altri vengono avvisati. Se il ticket era gia' assegnato a un
//    tecnico di turno, l'invito va solo a lui.
export async function POST(req: NextRequest) {
  const { ticketId } = await req.json()
  if (!ticketId) return Response.json({ error: 'Missing ticketId' }, { status: 400 })

  const supabase = await createServiceClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, customer_name, customer_email, customer_phone, machine_model, machine_serial, subject, ai_summary, assigned_to')
    .eq('id', ticketId)
    .single()

  if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 })

  // Chat gia' aperta per questo ticket: restituisci quella
  const { data: existing } = await supabase
    .from('direct_chats')
    .select('id, access_token')
    .eq('ticket_id', ticketId)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    return Response.json({ chatId: existing.id, accessToken: existing.access_token, onCallCount: null })
  }

  const onCall = await getOnCallTechnicians(supabase)
  if (onCall.length === 0) {
    return Response.json(
      { error: 'Nessun tecnico è di turno in questo momento', noTechnicianOnCall: true },
      { status: 409 }
    )
  }

  const preassigned = onCall.find(t => t.id === ticket.assigned_to) ?? null
  const invitees = preassigned ? [preassigned] : onCall

  // Chat con token per il cliente (polling). technician_id resta NULL finche'
  // un tecnico non la prende in carico (salvo pre-assegnazione).
  const accessToken = randomUUID()
  const claimedAt = preassigned ? new Date().toISOString() : null
  const { data: chat, error } = await supabase
    .from('direct_chats')
    .insert({
      ticket_id: ticketId,
      technician_id: preassigned?.id ?? null,
      claimed_at: claimedAt,
      status: 'active',
      access_token: accessToken,
    })
    .select('id')
    .single()

  if (error || !chat) return Response.json({ error: error?.message ?? 'Cannot create chat' }, { status: 500 })

  // Un invito (token personale) per ogni tecnico invitato
  const invites = invitees.map(t => ({ chat_id: chat.id, technician_id: t.id, token: randomUUID() }))
  const { error: invErr } = await supabase.from('direct_chat_invites').insert(invites)
  if (invErr) {
    console.error('[DIRECT-CHAT] inviti non creati:', invErr.message)
    return Response.json({ error: 'Cannot create invites' }, { status: 500 })
  }

  const portalUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fenix-support.netlify.app'
  const machineName = [ticket.machine_model, ticket.machine_serial].filter(Boolean).join(' — ') || 'N/D'

  await Promise.all(invitees.map(async tech => {
    if (!tech.email) return
    const invite = invites.find(i => i.technician_id === tech.id)!
    try {
      await sendDirectChatEmail({
        to: tech.email,
        technicianName: tech.display_name ?? 'Tecnico',
        chatUrl: `${portalUrl}/tech/${invite.token}`,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        customerPhone: ticket.customer_phone,
        machineName,
        subject: ticket.subject,
        aiSummary: ticket.ai_summary ?? '',
        onCallCount: invitees.length,
      })
    } catch (err) {
      console.error('Failed to send direct chat email:', err)
    }
  }))

  return Response.json({ chatId: chat.id, accessToken, onCallCount: invitees.length })
}
