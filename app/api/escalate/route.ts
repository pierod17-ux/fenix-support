import { createServiceClient } from '@/lib/supabase/server'
import { sendEscalationNotification } from '@/lib/meta-whatsapp'
import { sendEscalationEmail } from '@/lib/email'
import { getOnCallTechnicians, getAllActiveTechnicians, type OnCallTech } from '@/lib/direct-chat'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { ticketId, customerInfo, subject, aiSummary, priority, category } = await req.json()

  const supabase = await createServiceClient()

  // Aggiorna il ticket con l'escalation
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .update({
      status: 'open',
      priority,
      subject,
      ai_summary: aiSummary,
      problem_category: category ?? null,
      escalated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .select('*, assignee:assigned_to(display_name, whatsapp, email)')
    .single()

  let target = ticket
  if (ticketErr || !ticket) {
    // Crea nuovo ticket se non esiste
    const { data: newTicket } = await supabase
      .from('support_tickets')
      .insert({
        status: 'open',
        priority,
        subject,
        ai_summary: aiSummary,
        problem_category: category ?? null,
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
    target = newTicket
  }

  const { onCall, onCallCount } = await notifyTechnicians(supabase, target)
  // onCall dice al client se ha senso offrire la chat diretta
  return Response.json({ ticketId: target.id, onCall, onCallCount })
}

// Chi avvisare:
//  - tecnici di turno adesso → notifica di escalation classica (potranno prendere
//    in carico la chat diretta, se il cliente la richiede);
//  - NESSUNO di turno → avviso "ticket aperto, nessun tecnico di turno" a TUTTI i
//    tecnici attivi (admin inclusi). Nessuna chat diretta verra' avviata.
// In entrambi i casi il ticket resta non assegnato finche' qualcuno lo prende in carico.
async function notifyTechnicians(
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
): Promise<{ onCall: boolean; onCallCount: number }> {
  const onCallTechs = await getOnCallTechnicians(supabase)
  const noOneOnCall = onCallTechs.length === 0
  const targets: OnCallTech[] = noOneOnCall ? await getAllActiveTechnicians(supabase) : onCallTechs
  if (targets.length === 0) return { onCall: false, onCallCount: 0 }

  const portalUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fenix-support.netlify.app'
  const machineName = [ticket.machine_model, ticket.machine_serial].filter(Boolean).join(' — ') || 'N/D'

  await Promise.all(targets.map(async tech => {
    const notifyParams = {
      technicianName: tech.display_name ?? 'Tecnico',
      ticketId: ticket.id,
      customerName: ticket.customer_name,
      machineName,
      subject: ticket.subject,
      priority: ticket.priority,
      portalUrl,
    }

    // WhatsApp solo ai tecnici di turno: un avviso "nessuno di turno" via email basta
    if (tech.whatsapp && !noOneOnCall) {
      try {
        await sendEscalationNotification({ to: tech.whatsapp, ...notifyParams })
      } catch (err) {
        console.error('WhatsApp notification failed:', err)
      }
    }

    if (tech.email) {
      try {
        await sendEscalationEmail({
          to: tech.email,
          customerEmail: ticket.customer_email,
          customerPhone: ticket.customer_phone,
          aiSummary: ticket.ai_summary ?? '',
          noOneOnCall,
          ...notifyParams,
        })
      } catch (err) {
        console.error('Email notification failed:', err)
      }
    }
  }))

  return { onCall: !noOneOnCall, onCallCount: onCallTechs.length }
}
