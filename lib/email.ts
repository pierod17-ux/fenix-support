import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'assistenza@fenixsrl.it'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}

export async function sendEscalationEmail(params: {
  to: string
  technicianName: string
  ticketId: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  machineName: string
  subject: string
  priority: string
  aiSummary: string
  portalUrl: string
}) {
  const {
    to, technicianName, ticketId, customerName, customerEmail,
    customerPhone, machineName, subject, priority, aiSummary, portalUrl
  } = params

  const priorityColor = priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#6c63ff'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; background: #f4f4f8; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #0a0a0f; padding: 24px 32px; display: flex; align-items: center; gap: 12px;">
      <div style="width: 36px; height: 36px; background: #6c63ff; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 18px;">⚙</span>
      </div>
      <div>
        <p style="color: #f0f0f5; font-weight: 700; margin: 0; font-size: 16px;">Fenix — Assistenza Tecnica</p>
        <p style="color: #8888aa; margin: 0; font-size: 12px;">Notifica di escalation</p>
      </div>
    </div>

    <div style="padding: 32px;">
      <p style="color: #333; margin-bottom: 8px;">Ciao <strong>${technicianName}</strong>,</p>
      <p style="color: #555; margin-bottom: 24px;">Un cliente ha bisogno di assistenza tecnica che l'AI non ha potuto risolvere autonomamente.</p>

      <div style="background: #f8f8fc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${priorityColor};">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #888; font-size: 12px; padding: 4px 0; width: 120px;">Ticket</td><td style="color: #333; font-weight: 600; font-size: 13px;">#${ticketId.slice(0, 8).toUpperCase()}</td></tr>
          <tr><td style="color: #888; font-size: 12px; padding: 4px 0;">Priorità</td><td><span style="background: ${priorityColor}; color: white; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${priority.toUpperCase()}</span></td></tr>
          <tr><td style="color: #888; font-size: 12px; padding: 4px 0;">Cliente</td><td style="color: #333; font-size: 13px;">${customerName}</td></tr>
          ${customerEmail ? `<tr><td style="color: #888; font-size: 12px; padding: 4px 0;">Email</td><td style="color: #333; font-size: 13px;"><a href="mailto:${customerEmail}" style="color: #6c63ff;">${customerEmail}</a></td></tr>` : ''}
          ${customerPhone ? `<tr><td style="color: #888; font-size: 12px; padding: 4px 0;">Telefono</td><td style="color: #333; font-size: 13px;">${customerPhone}</td></tr>` : ''}
          <tr><td style="color: #888; font-size: 12px; padding: 4px 0;">Macchina</td><td style="color: #333; font-size: 13px;">${machineName}</td></tr>
          <tr><td style="color: #888; font-size: 12px; padding: 4px 0;">Problema</td><td style="color: #333; font-size: 13px;">${subject}</td></tr>
        </table>
      </div>

      ${aiSummary ? `
      <div style="background: #f0f0f8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #6c63ff; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Riepilogo AI</p>
        <p style="color: #444; font-size: 13px; line-height: 1.6; margin: 0;">${aiSummary}</p>
      </div>` : ''}

      <a href="${portalUrl}/admin/tickets/${ticketId}"
        style="display: inline-block; background: #6c63ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Apri ticket nel portale →
      </a>
    </div>

    <div style="padding: 16px 32px; border-top: 1px solid #eee;">
      <p style="color: #aaa; font-size: 11px; margin: 0;">Sistema Assistenza Tecnica Fenix · Notifica automatica</p>
    </div>
  </div>
</body>
</html>`

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `[Ticket #${ticketId.slice(0, 8).toUpperCase()}] ${subject} — ${priority.toUpperCase()}`,
    html,
  })
}
