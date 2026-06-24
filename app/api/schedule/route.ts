import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

async function getAdminClient() {
  const sso = await createClient()
  const { data: { user } } = await sso.auth.getUser()
  if (!user) return null
  const { data: profile } = await sso
    .from('technician_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return await createServiceClient()
}

export async function POST(req: NextRequest) {
  const supabase = await getAdminClient()
  if (!supabase) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { day_of_week, start_time, end_time } = body

  // Accetta più tecnici (technician_ids[]) o uno singolo (technician_id) per compatibilità
  const ids: string[] = Array.isArray(body.technician_ids)
    ? body.technician_ids
    : body.technician_id ? [body.technician_id] : []

  if (ids.length === 0) {
    return Response.json({ error: 'Nessun tecnico selezionato' }, { status: 400 })
  }

  const rows = ids.map(technician_id => ({
    technician_id, day_of_week, start_time, end_time, is_active: true,
  }))

  const { data, error } = await supabase
    .from('technician_schedules')
    .insert(rows)
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  // Ritorna sempre un array di turni creati
  return Response.json(data ?? [])
}
