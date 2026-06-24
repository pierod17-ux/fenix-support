import { createClient } from '@/lib/supabase/server'
import TicketsBoard, { type AdminTicket } from '@/components/admin/TicketsBoard'

export const dynamic = 'force-dynamic'

export default async function AdminTickets() {
  const supabase = await createClient()

  // Solo le conversazioni andate in escalation a un tecnico sono "ticket".
  // Tutte le chat (anche non escalate) sono nella sezione Conversazioni.
  const { data } = await supabase
    .from('support_tickets')
    .select('id, subject, customer_name, center_name, machine_model, status, priority, problem_category, created_at, assignee:assigned_to(display_name)')
    .not('escalated_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  const tickets = (data ?? []) as unknown as AdminTicket[]

  const open = tickets.filter(t => t.status === 'open').length
  const inProgress = tickets.filter(t => t.status === 'in_progress').length
  const today = tickets.filter(t =>
    new Date(t.created_at).toDateString() === new Date().toDateString()
  ).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>

      {/* Page header */}
      <div style={{
        padding: '24px 24px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,245,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Ticket Assistenza
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Conversazioni passate a un tecnico
        </p>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Aperti', value: open, color: '#ff3b30' },
            { label: 'In gestione', value: inProgress, color: '#ff9500' },
            { label: 'Oggi', value: today, color: 'var(--accent)' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'var(--surface)', borderRadius: 16, padding: '16px 20px', boxShadow: 'var(--shadow-md)',
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

        <TicketsBoard tickets={tickets} />
      </div>
    </div>
  )
}
