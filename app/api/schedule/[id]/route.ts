import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await createClient()           // SSR — legge la sessione admin
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()

  await supabase.from('technician_schedules').update({ is_active: false }).eq('id', id)
  return Response.json({ ok: true })
}
