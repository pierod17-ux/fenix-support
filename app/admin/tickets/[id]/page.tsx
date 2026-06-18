import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import TicketActions from '@/components/admin/TicketActions'

const statusLabel: Record<string, string> = {
  open: 'Aperto', in_progress: 'In gestione', resolved: 'Risolto', closed: 'Chiuso',
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
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
              #{id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-medium"
              style={{
                background: `${priorityColor[ticket.priority]}20`,
                color: priorityColor[ticket.priority],
              }}>
              {priorityLabel[ticket.priority]}
            </span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{ticket.subject}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Aperto il {format(new Date(ticket.created_at), 'dd MMMM yyyy alle HH:mm', { locale: it })}
          </p>
        </div>
        <TicketActions ticketId={id} currentStatus={ticket.status} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Info cliente */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cliente</h3>
          <InfoRow label="Nome" value={ticket.customer_name} />
          <InfoRow label="Centro" value={ticket.center_name} />
          <InfoRow label="Email" value={ticket.customer_email} link={`mailto:${ticket.customer_email}`} />
          <InfoRow label="Telefono" value={ticket.customer_phone} link={`tel:${ticket.customer_phone}`} />
          <InfoRow label="Macchina" value={ticket.machine_model} />
          <InfoRow label="S/N" value={ticket.machine_serial} />
        </div>

        {/* Stato */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Stato ticket</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full"
              style={{ background: ticket.status === 'open' ? 'var(--danger)' : ticket.status === 'in_progress' ? 'var(--warning)' : 'var(--success)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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

        {/* Riepilogo AI */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Riepilogo AI</h3>
          <p className="text-sm leading-relaxed"
            style={{ color: ticket.ai_summary ? 'var(--text-secondary)' : 'var(--border)' }}>
            {ticket.ai_summary ?? 'Nessun riepilogo disponibile'}
          </p>
        </div>
      </div>

      {/* Conversazione */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Conversazione ({messages?.length ?? 0} messaggi)
          </h3>
        </div>
        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {!messages?.length && (
            <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>Nessun messaggio</p>
          )}
          {messages?.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs"
                  style={{
                    background: msg.role === 'assistant' ? 'var(--accent)' : 'var(--warning)',
                    color: 'white',
                  }}>
                  {msg.role === 'assistant' ? 'AI' : 'T'}
                </div>
              )}
              <div className="max-w-[75%] px-3 py-2 rounded-xl text-sm"
                style={{
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface-2)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                }}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs mt-1 opacity-60">
                  {format(new Date(msg.created_at), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, link }: { label: string; value: string | null; link?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs w-20 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      {link ? (
        <a href={link} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>{value}</a>
      ) : (
        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
      )}
    </div>
  )
}
