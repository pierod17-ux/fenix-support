import { createServiceClient } from '@/lib/supabase/server'
import { resolveChatToken, claimChat } from '@/lib/direct-chat'
import { NextRequest } from 'next/server'

type Params = { params: Promise<{ token: string }> }

// GET: usato dal cliente (access_token della chat, per il polling) e dal tecnico
// (token d'invito personale). Restituisce anche chi ha preso in carico la chat.
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params
  const supabase = await createServiceClient()

  const resolved = await resolveChatToken(supabase, token)
  if (!resolved) return Response.json({ error: 'Chat not found' }, { status: 404 })
  const { chat, inviteTechId } = resolved

  const [{ data: ticket }, { data: messages }, { data: tech }] = await Promise.all([
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
    chat.technician_id
      ? supabase.from('technician_profiles').select('display_name').eq('id', chat.technician_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return Response.json({
    chat,
    technician: chat.technician_id ? { display_name: tech?.display_name ?? 'Tecnico' } : null,
    claimedByMe: !!inviteTechId && chat.technician_id === inviteTechId,
    ticket,
    messages: messages ?? [],
  })
}

// POST: solo i tecnici (token d'invito). Il primo messaggio vale anche come
// presa in carico se la chat e' ancora libera; se l'ha presa un collega, 403.
export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params
  const supabase = await createServiceClient()

  const resolved = await resolveChatToken(supabase, token)
  if (!resolved) return Response.json({ error: 'Chat not found' }, { status: 404 })
  const { chat, inviteTechId } = resolved

  if (!inviteTechId) {
    return Response.json({ error: 'Solo i tecnici invitati possono scrivere in questa chat' }, { status: 403 })
  }
  if (chat.status !== 'active') return Response.json({ error: 'Chat is closed' }, { status: 400 })

  const claim = await claimChat(supabase, chat, inviteTechId)
  if (claim.outcome === 'taken') {
    return Response.json(
      { error: `Questa richiesta è stata presa in carico da ${claim.techName}`, takenBy: claim.techName },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { content, media_url, media_type } = body

  if (!content && !media_url) return Response.json({ error: 'Missing content or media' }, { status: 400 })

  const { data: msg, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: chat.ticket_id,
      role: 'technician',
      content: content ?? null,
      media_url: media_url ?? null,
      media_type: media_type ?? null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(msg)
}
