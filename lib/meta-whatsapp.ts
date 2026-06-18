const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID!
const ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN!
const API_VERSION = 'v21.0'

interface WhatsAppTextMessage {
  to: string      // international format, no +, e.g. "393331234567"
  body: string
}

export async function sendWhatsAppText({ to, body }: WhatsAppTextMessage) {
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error ${res.status}: ${err}`)
  }

  return res.json()
}

export async function sendEscalationNotification(params: {
  to: string
  technicianName: string
  ticketId: string
  customerName: string
  machineName: string
  subject: string
  priority: string
  portalUrl: string
}) {
  const { to, technicianName, ticketId, customerName, machineName, subject, priority, portalUrl } = params

  const priorityEmoji = priority === 'urgent' ? '🔴' : priority === 'high' ? '🟠' : '🟡'

  const body = `${priorityEmoji} *ASSISTENZA FENIX — Nuovo Ticket*

Ciao ${technicianName},

È arrivata una richiesta che l'assistente AI non ha saputo risolvere.

*Ticket:* #${ticketId.slice(0, 8).toUpperCase()}
*Cliente:* ${customerName}
*Macchina:* ${machineName}
*Problema:* ${subject}
*Priorità:* ${priority.toUpperCase()}

Accedi al portale per gestire il ticket:
${portalUrl}/admin/tickets/${ticketId}

— Sistema Assistenza Fenix`

  return sendWhatsAppText({ to, body })
}
