import { createServiceClient } from '@/lib/supabase/server'
import { sendDirectChatEmail } from '@/lib/email'
import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { ticketId } = await req.json()
  if (!ticketId) return Response.json({ error: 'Missing ticketId' }, { status: 400 })

  const supabase = await createServiceClient()

  // Get ticket info
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, customer_name, customer_email, customer_phone, machine_model, machine_serial, subject, ai_summary, assigned_to')
    .eq('id', ticketId)
    .single()

  if (!ticket) return Response.json({ error: 'Ticket not found' }, { status: 404 })

  // Check if direct chat already exists
  const { data: existing } = await supabase
    .from('direct_chats')
    .select('id, access_token')
    .eq('ticket_id', ticketId)
    .eq('status', 'active')
    .single()

  if (existing) {
    return Response.json({ chatId: existing.id, accessToken: existing.access_token })
  }

  // Find on-call technician
  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  let techId: string | null = ticket.assigned_to ?? null

  if (!techId) {
    const { data: schedule } = await supabase
      .from('technician_schedules')
      .select('technician_id')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .lte('start_time', currentTime)
      .gte('end_time', currentTime)
      .limit(1)
      .single()

    techId = schedule?.technician_id ?? null
  }

  if (!techId) {
    const { data: fallback } = await supabase
      .from('technician_profiles')
      .select('id')
      .eq('role', 'technician')
      .eq('account_status', 'active')
      .limit(1)
      .single()
    techId = fallback?.id ?? null
  }

  if (!techId) return Response.json({ error: 'No technician available' }, { status: 503 })

  // Get technician info
  const { data: tech } = await supabase
    .from('technician_profiles')
    .select('display_name, email')
    .eq('id', techId)
    .single()

  // Create direct chat with URL-safe UUID token
  const accessToken = randomUUID()
  const { data: chat, error } = await supabase
    .from('direct_chats')
    .insert({
      ticket_id: ticketId,
      technician_id: techId,
      status: 'active',
      access_token: accessToken,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Send email to technician
  if (tech?.email) {
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fenix-support.netlify.app'
    const chatUrl = `${portalUrl}/tech/${accessToken}`
    const machineName = [ticket.machine_model, ticket.machine_serial].filter(Boolean).join(' — ') || 'N/D'

    try {
      await sendDirectChatEmail({
        to: tech.email,
        technicianName: tech.display_name ?? 'Tecnico',
        chatUrl,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        customerPhone: ticket.customer_phone,
        machineName,
        subject: ticket.subject,
        aiSummary: ticket.ai_summary ?? '',
      })
    } catch (err) {
      console.error('Failed to send direct chat email:', err)
    }
  }

  // Update ticket assigned_to if not already set
  if (!ticket.assigned_to) {
    await supabase.from('support_tickets').update({ assigned_to: techId }).eq('id', ticketId)
  }

  return Response.json({ chatId: chat.id, accessToken })
}
