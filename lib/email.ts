import { Resend } from 'resend'

// damtec.it domain must be verified on resend.com/domains before using it as FROM
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY non configurata')
  return new Resend(key)
}

export async function sendTechnicianInviteEmail(params: {
  to: string
  name: string
  inviteLink: string
}) {
  const { to, name, inviteLink } = params
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f7;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0071e3 0%,#00a2ff 100%);padding:28px 32px;">
      <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
        <span style="color:white;font-size:22px;">⚙</span>
      </div>
      <p style="color:white;font-weight:700;font-size:20px;margin:0;">Fenix — Portale Tecnici</p>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:4px 0 0;">Invito ad accedere al sistema</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1d1d1f;font-size:15px;margin-bottom:8px;">Ciao <strong>${name}</strong>,</p>
      <p style="color:#515154;font-size:14px;line-height:1.6;margin-bottom:28px;">
        Sei stato aggiunto al sistema di assistenza tecnica Fenix come tecnico reperibile.<br>
        Clicca il pulsante qui sotto per scegliere la tua password e attivare il tuo account.
      </p>
      <a href="${inviteLink}" style="display:inline-block;background:#0071e3;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,113,227,0.3);">
        Attiva il mio account →
      </a>
      <p style="color:#aeaeb2;font-size:12px;margin-top:24px;">
        Il link è valido per 24 ore. Se non hai richiesto questo invito, ignora questa email.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f2f2f2;">
      <p style="color:#aeaeb2;font-size:11px;margin:0;">Sistema Assistenza Tecnica Fenix · Notifica automatica</p>
    </div>
  </div>
</body></html>`

  const result = await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Invito al portale tecnici Fenix — Attiva il tuo account',
    html,
  })
  if (result.error) throw new Error(`Resend: ${result.error.message}`)
  return result
}

export async function sendPasswordResetEmail(params: {
  to: string
  name: string
  resetLink: string
}) {
  const { to, name, resetLink } = params
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f7;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0071e3 0%,#00a2ff 100%);padding:28px 32px;">
      <p style="color:white;font-weight:700;font-size:20px;margin:0;">Fenix — Reset Password</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1d1d1f;font-size:15px;margin-bottom:8px;">Ciao <strong>${name}</strong>,</p>
      <p style="color:#515154;font-size:14px;line-height:1.6;margin-bottom:28px;">
        È stato richiesto il reset della tua password per il portale tecnici Fenix.<br>
        Clicca il pulsante qui sotto per impostare una nuova password.
      </p>
      <a href="${resetLink}" style="display:inline-block;background:#0071e3;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,113,227,0.3);">
        Reimposta password →
      </a>
      <p style="color:#aeaeb2;font-size:12px;margin-top:24px;">
        Il link è valido per 1 ora. Se non hai richiesto questo reset, ignora questa email.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f2f2f2;">
      <p style="color:#aeaeb2;font-size:11px;margin:0;">Sistema Assistenza Tecnica Fenix · Notifica automatica</p>
    </div>
  </div>
</body></html>`

  const result = await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Fenix — Reimposta la tua password',
    html,
  })
  if (result.error) throw new Error(`Resend: ${result.error.message}`)
  return result
}

export async function sendDirectChatEmail(params: {
  to: string
  technicianName: string
  chatUrl: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  machineName: string
  subject: string
  aiSummary: string
}) {
  const { to, technicianName, chatUrl, customerName, customerEmail, customerPhone, machineName, subject, aiSummary } = params
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f7;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#ff3b30 0%,#ff6b35 100%);padding:28px 32px;">
      <p style="color:white;font-weight:700;font-size:20px;margin:0;">🔴 Chat diretta richiesta</p>
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:4px 0 0;">Il cliente richiede assistenza immediata</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#1d1d1f;font-size:15px;margin-bottom:20px;">Ciao <strong>${technicianName}</strong>,</p>
      <div style="background:#f5f5f7;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6e6e73;font-size:12px;padding:4px 0;width:110px;">Cliente</td><td style="color:#1d1d1f;font-size:13px;font-weight:600;">${customerName}</td></tr>
          ${customerEmail ? `<tr><td style="color:#6e6e73;font-size:12px;padding:4px 0;">Email</td><td style="color:#1d1d1f;font-size:13px;"><a href="mailto:${customerEmail}" style="color:#0071e3;">${customerEmail}</a></td></tr>` : ''}
          ${customerPhone ? `<tr><td style="color:#6e6e73;font-size:12px;padding:4px 0;">Telefono</td><td style="color:#1d1d1f;font-size:13px;">${customerPhone}</td></tr>` : ''}
          <tr><td style="color:#6e6e73;font-size:12px;padding:4px 0;">Macchina</td><td style="color:#1d1d1f;font-size:13px;">${machineName}</td></tr>
          <tr><td style="color:#6e6e73;font-size:12px;padding:4px 0;">Problema</td><td style="color:#1d1d1f;font-size:13px;">${subject}</td></tr>
        </table>
      </div>
      ${aiSummary ? `
      <div style="background:#f0f7ff;border-radius:12px;padding:16px;margin-bottom:24px;border-left:3px solid #0071e3;">
        <p style="color:#0071e3;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Riepilogo AI</p>
        <p style="color:#1d1d1f;font-size:13px;line-height:1.6;margin:0;">${aiSummary}</p>
      </div>` : ''}
      <a href="${chatUrl}" style="display:inline-block;background:#0071e3;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 12px rgba(0,113,227,0.3);">
        Apri chat con il cliente →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f2f2f2;">
      <p style="color:#aeaeb2;font-size:11px;margin:0;">Sistema Assistenza Tecnica Fenix · Notifica automatica</p>
    </div>
  </div>
</body></html>`

  const result = await getResend().emails.send({
    from: FROM,
    to,
    subject: `[Chat diretta] ${customerName} — ${machineName}`,
    html,
  })
  if (result.error) throw new Error(`Resend: ${result.error.message}`)
  return result
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

  const result = await getResend().emails.send({
    from: FROM,
    to,
    subject: `[Ticket #${ticketId.slice(0, 8).toUpperCase()}] ${subject} — ${priority.toUpperCase()}`,
    html,
  })
  if (result.error) throw new Error(`Resend: ${result.error.message}`)
  return result
}
