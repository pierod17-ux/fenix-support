import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { SupportTicket } from '@/types'

const statusLabel: Record<string, string> = {
  open: 'Aperto', in_progress: 'In gestione', resolved: 'Risolto', closed: 'Chiuso',
}
const statusColor: Record<string, string> = {
  open: 'var(--danger)', in_progress: 'var(--warning)', resolved: 'var(--success)', closed: 'var(--text-secondary)',
}
const priorityColor: Record<string, string> = {
  urgent: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-secondary)',
}

export default async function AdminTickets() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, assignee:assigned_to(display_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const open = tickets?.filter(t => t.status === 'open').length ?? 0
  const inProgress = tickets?.filter(t => t.status === 'in_progress').length ?? 0
  const today = tickets?.filter(t =>
    new Date(t.created_at).toDateString() === new Date().toDateString()
  ).length ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Ticket Assistenza</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: it })}
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aperti', value: open, color: 'var(--danger)' },
          { label: 'In gestione', value: inProgress, color: 'var(--warning)' },
          { label: 'Oggi', value: today, color: 'var(--accent)' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabella ticket */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Tutti i ticket</h2>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {!tickets?.length && (
            <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nessun ticket
            </p>
          )}
          {tickets?.map(ticket => (
            <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:opacity-80 transition-opacity">
              {/* Priorità dot */}
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: priorityColor[ticket.priority] ?? 'var(--border)' }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {ticket.subject}
                  </p>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {ticket.customer_name}
                  {ticket.center_name && ` · ${ticket.center_name}`}
                  {ticket.machine_model && ` · ${ticket.machine_model}`}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{
                    background: `${statusColor[ticket.status]}20`,
                    color: statusColor[ticket.status],
                  }}>
                  {statusLabel[ticket.status]}
                </span>
                <p className="text-xs hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                  {format(new Date(ticket.created_at), 'dd/MM HH:mm')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
