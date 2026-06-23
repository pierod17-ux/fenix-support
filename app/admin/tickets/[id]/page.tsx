import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import TicketActions from '@/components/admin/TicketActions'

const statusLabel: Record<string, string> = {
  open: 'Aperto', in_progress: 'In gestione', resolved: 'Risolto', closed: 'Chiuso',
}
const statusColor: Record<string, string> = {
  open: 'var(--danger)', in_progress: 'var(--warning)', resolved: 'var(--success)', closed: 'var(--text-tertiary)',
}
const priorityLabel: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Bassa',
}
const priorityColor: Record<string, string> = {
  urgent: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-secondary)',
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: me } = user
    ? await supabase.from('technician_profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const isAdmin = me?.role === 'admin'

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*, assignee:assigned_to(display_name, email, whatsapp)')
    .eq('id', id)
    .single()

  if (!ticket) notFound()

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at')

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 48px' }}>
      <style>{`.info-link { font-size: 13px; font-weight: 500; color: var(--accent); line-height: 1.5; text-decoration: none; } .info-link:hover { text-decoration: underline; }`}</style>

      {/* Header */}
      <div style={{
        padding: '24px 24px 20px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,245,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontFamily: 'ui-monospace, monospace', fontWeight: 600,
                padding: '3px 8px', borderRadius: 6,
                background: 'var(--surface-3)', color: 'var(--text-secondary)',
                letterSpacing: '0.05em',
              }}>
                #{id.slice(0, 8).toUpperCase()}
              </span>
              <span style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                background: `${priorityColor[ticket.priority]}18`,
                color: priorityColor[ticket.priority],
              }}>
                {priorityLabel[ticket.priority]}
              </span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>
              {ticket.subject}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Aperto il {format(new Date(ticket.created_at), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
            </p>
          </div>
          <TicketActions ticketId={id} currentStatus={ticket.status} isAdmin={isAdmin} />
        </div>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Info cards — 3 colonne */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

          {/* Cliente */}
          <div style={{
            background: 'var(--surface)', borderRadius: 18,
            border: '1px solid var(--border)', padding: '20px 22px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Cliente
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow label="Nome" value={ticket.customer_name} />
              <InfoRow label="Centro" value={ticket.center_name} />
              <InfoRow label="Email" value={ticket.customer_email} link={`mailto:${ticket.customer_email}`} />
              <InfoRow label="Telefono" value={ticket.customer_phone} link={`tel:${ticket.customer_phone}`} />
              <InfoRow label="Macchina" value={ticket.machine_model} />
              <InfoRow label="S/N" value={ticket.machine_serial} />
            </div>
          </div>

          {/* Stato */}
          <div style={{
            background: 'var(--surface)', borderRadius: 18,
            border: '1px solid var(--border)', padding: '20px 22px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Stato ticket
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Status badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 12px', borderRadius: 20, alignSelf: 'flex-start',
                background: `${statusColor[ticket.status]}15`,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: statusColor[ticket.status],
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: statusColor[ticket.status] }}>
                  {statusLabel[ticket.status]}
                </span>
              </div>
              {ticket.escalated_at && (
                <InfoRow label="Escalation" value={format(new Date(ticket.escalated_at), 'dd/MM HH:mm')} />
              )}
              {ticket.assignee && (
                <InfoRow label="Assegnato a" value={(ticket.assignee as { display_name: string }).display_name} />
              )}
              {ticket.resolved_at && (
                <InfoRow label="Risolto il" value={format(new Date(ticket.resolved_at), 'dd/MM HH:mm')} />
              )}
            </div>
          </div>

          {/* Riepilogo AI */}
          <div style={{
            background: 'var(--surface)', borderRadius: 18,
            border: '1px solid var(--border)', padding: '20px 22px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 }}>
              Riepilogo AI
            </p>
            {ticket.ai_summary ? (
              <p style={{ fontSize: 13, lineHeight: '1.65', color: 'var(--text-secondary)' }}>
                {ticket.ai_summary}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                Nessun riepilogo disponibile
              </p>
            )}
          </div>
        </div>

        {/* Conversazione */}
        <div style={{
          background: 'var(--surface)', borderRadius: 18,
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Conversazione
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { color: 'var(--accent)', label: 'Cliente' },
                  { color: '#7c3aed', label: 'AI' },
                  { color: '#16a34a', label: 'Tecnico' },
                ].map(({ color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
              background: 'var(--surface-3)', color: 'var(--text-tertiary)',
            }}>
              {messages?.length ?? 0}
            </span>
          </div>

          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 560, overflowY: 'auto' }}>
            {!messages?.length && (
              <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-tertiary)', padding: '16px 0' }}>
                Nessun messaggio
              </p>
            )}
            {messages?.map(msg => {
              const isUser = msg.role === 'user'
              const isAI = msg.role === 'assistant'
              const avatarColor = isAI ? '#7c3aed' : '#16a34a'
              const senderLabel = isAI ? 'AI FENIX' : 'TECNICO'
              return (
                <div key={msg.id} style={{
                  display: 'flex', gap: 6, alignItems: 'flex-end',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}>
                  {!isUser && (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 800, letterSpacing: '-0.2px',
                      background: avatarColor, color: 'white',
                    }}>
                      {isAI ? 'AI' : 'T'}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '74%', padding: '6px 10px', borderRadius: 11,
                    ...(isUser ? {
                      background: 'var(--accent)', color: 'white',
                      borderBottomRightRadius: 3,
                    } : isAI ? {
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.16)',
                      color: 'var(--text-primary)',
                      borderBottomLeftRadius: 3,
                    } : {
                      background: 'rgba(22,163,74,0.08)',
                      border: '1px solid rgba(22,163,74,0.18)',
                      color: 'var(--text-primary)',
                      borderBottomLeftRadius: 3,
                    }),
                  }}>
                    {!isUser && (
                      <p style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                        color: avatarColor, marginBottom: 2, opacity: 0.8,
                      }}>
                        {senderLabel}
                      </p>
                    )}
                    <p style={{ fontSize: 13, lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {msg.content}
                    </p>
                    <p style={{
                      fontSize: 10, marginTop: 2, opacity: 0.5, margin: '2px 0 0',
                      textAlign: isUser ? 'right' : 'left',
                    }}>
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

function InfoRow({ label, value, link }: { label: string; value: string | null; link?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0, width: 72, lineHeight: '1.5' }}>
        {label}
      </span>
      {link ? (
        <a href={link} className="info-link">
          {value}
        </a>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.5' }}>
          {value}
        </span>
      )}
    </div>
  )
}
