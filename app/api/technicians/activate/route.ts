import { createClient, createServiceClient } from '@/lib/supabase/server'

// Called by a technician right after setting their password via the invite link.
// They have a valid session for their own account, so we activate their profile.
export async function POST() {
  const sso = await createClient()
  const { data: { user } } = await sso.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createServiceClient()
  const { error } = await svc
    .from('technician_profiles')
    .update({ account_status: 'active' })
    .eq('id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
