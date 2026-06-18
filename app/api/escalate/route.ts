import { createServiceClient } from '@/lib/supabase/server'
import { sendEscalationNotification } from '@/lib/meta-whatsapp'
import { sendEscalationEmail } from '@/lib/email'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { ticketId, customerInfo, subject, aiSummary, priority } = await req.json()

  const supabase = await createServiceClient()

  // Aggiorna il ticket con l'escalation
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .update({
      status: 'open',
      priority,
      subject,
      ai_summary: aiSummary,
      escalated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .select('*, assignee:assigned_to(display_name, whatsapp, email)')
    .single()

  if (ticketErr || !ticket) {
    // Crea nuovo ticket se non esiste
    const { data: newTicket } = await supabase
      .from('support_tickets')
      .insert({
        status: 'open',
        priority,
        subject,
        ai_summary: aiSummary,
        escalated_at: new Date().toISOString(),
        customer_name: customerInfo?.name ?? 'Cliente',
        customer_email: customerInfo?.email ?? null,
        customer_phone: customerInfo?.phone ?? null,
        machine_serial: customerInfo?.machineSerial ?? null,
        machine_model: customerInfo?.machineModel ?? null,
        center_name: customerInfo?.centerName ?? null,
      })
      .select()
      .single()

    if (!newTicket) {
      return Response.json({ error: 'Cannot create ticket' }, { status: 500 })
    }

    // Trova il tecnico di turno
    await notifyOnCallTechnician(supabase, newTicket)
    return Response.json({ ticketId: newTicket.id })
  }

  await notifyOnCallTechnician(supabase, ticket)
  return Response.json({ ticketId: ticket.id })
}

async function notifyOnCallTechnician(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticket: {
    id: string
    subject: string
    priority: string
    ai_summary: string | null
    customer_name: string
    customer_email: string | null
    customer_phone: string | null
    machine_model: string | null
    machine_serial: string | null
    center_name: string | null
  }
) {
  // Trova il tecnico di turno per l'orario attuale
  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const { data: schedule } = await supabase
    .from('technician_schedules')
    .select('*, technician:technician_id(id, display_name, whatsapp, email)')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', currentTime)
    .gte('end_time', currentTime)
    .limit(1)
    .single()

  // Se non c'è turno attivo, prendi il primo tecnico disponibile
  const { data: fallbackTech } = !schedule
    ? await supabase
        .from('technician_profiles')
        .select('id, display_name, whatsapp, email')
        .eq('role', 'technician')
        .limit(1)
        .single()
    : { data: null }

  const tech = (schedule?.technician as { id: string; display_name: string | null; whatsapp: string | null; email: string | null } | null) ?? fallbackTech
  if (!tech) return

  // Assegna il tecnico al ticket
  await supabase
    .from('support_tickets')
    .update({ assigned_to: tech.id })
    .eq('id', ticket.id)

  const portalUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://assistenza.fenixsrl.it'
  const machineName = [ticket.machine_model, ticket.machine_serial].filter(Boolean).join(' — ') || 'N/D'

  const notifyParams = {
    technicianName: tech.display_name ?? 'Tecnico',
    ticketId: ticket.id,
    customerName: ticket.customer_name,
    machineName,
    subject: ticket.subject,
    priority: ticket.priority,
    portalUrl,
  }

  // WhatsApp
  if (tech.whatsapp) {
    try {
      await sendEscalationNotification({ to: tech.whatsapp, ...notifyParams })
    } catch (err) {
      console.error('WhatsApp notification failed:', err)
    }
  }

  // Email
  if (tech.email) {
    try {
      await sendEscalationEmail({
        to: tech.email,
        customerEmail: ticket.customer_email,
        customerPhone: ticket.customer_phone,
        aiSummary: ticket.ai_summary ?? '',
        ...notifyParams,
      })
    } catch (err) {
      console.error('Email notification failed:', err)
    }
  }
}
