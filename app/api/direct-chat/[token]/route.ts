import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params
  const supabase = await createServiceClient()

  const { data: chat } = await supabase
    .from('direct_chats')
    .select('id, ticket_id, technician_id, status')
    .eq('access_token', token)
    .single()

  if (!chat) return Response.json({ error: 'Chat not found' }, { status: 404 })

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

  return Response.json({ chat, ticket, messages: messages ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params
  const supabase = await createServiceClient()

  const { data: chat } = await supabase
    .from('direct_chats')
    .select('id, ticket_id, status')
    .eq('access_token', token)
    .single()

  if (!chat) return Response.json({ error: 'Chat not found' }, { status: 404 })
  if (chat.status !== 'active') return Response.json({ error: 'Chat is closed' }, { status: 400 })

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
