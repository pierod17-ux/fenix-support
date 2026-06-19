import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const auth = await createClient()           // SSR — legge la sessione admin
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()

  const body = await req.json()
  const { technician_id, day_of_week, start_time, end_time } = body

  const { data, error } = await supabase
    .from('technician_schedules')
    .insert({ technician_id, day_of_week, start_time, end_time, is_active: true })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
