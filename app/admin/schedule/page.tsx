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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reperibilità Tecnici</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Configura i turni: quando un ticket viene escalato, verrà notificato il tecnico di turno
        </p>
      </div>

      <ScheduleEditor
        technicians={technicians ?? []}
        schedules={schedules ?? []}
      />
    </div>
  )
}
