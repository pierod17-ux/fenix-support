import { createClient, createServiceClient } from '@/lib/supabase/server'

// Pinged periodically by logged-in users to track online presence.
export async function POST() {
  const sso = await createClient()
  const { data: { user } } = await sso.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createServiceClient()
  await svc
    .from('technician_profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id)

  return Response.json({ ok: true })
}
