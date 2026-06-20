import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { SupportTicket } from '@/types'

const statusLabel: Record<string, string> = {
  open: 'Aperto', in_progress: 'In gestione', resolved: 'Risolto', closed: 'Chiuso',
}
const statusColor: Record<string, { bg: string; text: string }> = {
  open:        { bg: 'rgba(255,59,48,0.10)',   text: '#ff3b30' },
  in_progress: { bg: 'rgba(255,159,10,0.12)',  text: '#ff9500' },
  resolved:    { bg: 'rgba(52,199,89,0.12)',   text: '#34c759' },
  closed:      { bg: 'rgba(110,110,115,0.12)', text: '#6e6e73' },
}
const priorityColor: Record<string, string> = {
  urgent: '#ff3b30', high: '#ff9500', medium: '#3b82f6', low: '#aeaeb2',
}
const priorityLabel: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Bassa',
}

export default async function AdminTickets() {
  // Sessione autenticata (l'admin è già loggato via layout): la RLS di
  // support_tickets richiede auth.uid() valorizzato. NON usare createServiceClient
  // qui: se manca SUPABASE_SERVICE_ROLE_KEY ripiega su anon e la lista risulta vuota.
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>

      {/* Page header */}
      <div style={{
        padding: '24px 24px 0',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,245,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
        paddingBottom: 16,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Ticket Assistenza
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
        </p>
      </div>

      <div style={{ padding: '0 24px' }}>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Aperti', value: open,       icon: '🔴', color: '#ff3b30', bg: 'rgba(255,59,48,0.07)' },
            { label: 'In gestione', value: inProgress, icon: '🟡', color: '#ff9500', bg: 'rgba(255,149,0,0.07)' },
            { label: 'Oggi', value: today,         icon: '📋', color: 'var(--accent)', bg: 'rgba(0,113,227,0.07)' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: '16px 20px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Ticket list */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Tutti i ticket
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {tickets?.length ?? 0} totali
            </span>
          </div>

          {!tickets?.length ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="5" width="18" height="16" rx="3"/>
                  <path d="M8 5V4a2 2 0 014 0v1M3 11h18"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Nessun ticket
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                I ticket appariranno qui quando i clienti richiedono assistenza
              </p>
            </div>
          ) : (
            <div>
              {tickets.map((ticket, i) => {
                const sc = statusColor[ticket.status] ?? { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
                return (
                  <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="admin-ticket-row" style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.12s',
                  }}>
                    {/* Priority dot */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: priorityColor[ticket.priority] ?? 'var(--border)',
                    }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.subject}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.customer_name}
                        {ticket.center_name && ` · ${ticket.center_name}`}
                        {ticket.machine_model && ` · ${ticket.machine_model}`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: sc.bg, color: sc.text,
                        letterSpacing: '0.2px',
                      }}>
                        {statusLabel[ticket.status]}
                      </span>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {format(new Date(ticket.created_at), 'dd/MM HH:mm')}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-ticket-row:hover { background: var(--surface-2); }
      `}</style>
    </div>
  )
}
