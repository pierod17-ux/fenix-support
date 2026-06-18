import { createClient } from '@/lib/supabase/server'
import ScheduleEditor from '@/components/admin/ScheduleEditor'

export default async function SchedulePage() {
  const supabase = await createClient()

  const { data: technicians } = await supabase
    .from('technician_profiles')
    .select('id, display_name, whatsapp, email, role')
    .order('display_name')

  const { data: schedules } = await supabase
    .from('technician_schedules')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

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
          Reperibilità Tecnici
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Configura i turni: il tecnico di turno verrà notificato ad ogni escalation
        </p>
      </div>

      <div style={{ padding: '0 24px' }}>
        <ScheduleEditor
          technicians={technicians ?? []}
          schedules={schedules ?? []}
        />
      </div>
    </div>
  )
}
