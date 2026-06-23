import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import ScheduleEditor from '@/components/admin/ScheduleEditor'

export default async function SchedulePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('technician_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = me?.role === 'admin'

  // Admin: tutti i tecnici e tutti i turni. Tecnico: solo se stesso e i propri turni.
  const techQuery = supabase
    .from('technician_profiles')
    .select('id, display_name, email, phone, whatsapp, role, account_status, last_seen')
    .order('display_name')

  const schedQuery = supabase
    .from('technician_schedules')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  const [{ data: technicians }, { data: schedules }] = await Promise.all([
    isAdmin ? techQuery : techQuery.eq('id', user.id),
    isAdmin ? schedQuery : schedQuery.eq('technician_id', user.id),
  ])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>

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
          {isAdmin ? 'Reperibilità' : 'I miei turni'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          {isAdmin
            ? 'Gestisci i tecnici e i turni settimanali di reperibilità'
            : 'Visualizza i tuoi turni di reperibilità settimanali'}
        </p>
      </div>

      <div style={{ padding: '0 24px' }}>
        <ScheduleEditor
          technicians={technicians ?? []}
          schedules={schedules ?? []}
          isAdmin={isAdmin}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
