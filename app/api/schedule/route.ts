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

  const { technician_id, day_of_week, start_time, end_time } = await req.json()

  const { data, error } = await supabase
    .from('technician_schedules')
    .insert({ technician_id, day_of_week, start_time, end_time, is_active: true })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
