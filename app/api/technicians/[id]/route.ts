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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient()
  if (!supabase) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Only allow updating safe fields
  const allowed: Record<string, unknown> = {}
  if (body.display_name !== undefined) allowed.display_name = body.display_name
  if (body.phone !== undefined) allowed.phone = body.phone
  if (body.whatsapp !== undefined) allowed.whatsapp = body.whatsapp
  if (body.account_status !== undefined) allowed.account_status = body.account_status

  const { error } = await supabase
    .from('technician_profiles')
    .update(allowed)
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // If disabling/enabling, also update auth user
  if (body.account_status === 'disabled') {
    await supabase.auth.admin.updateUserById(id, { ban_duration: '876600h' })
  } else if (body.account_status === 'active') {
    await supabase.auth.admin.updateUserById(id, { ban_duration: 'none' })
  }

  return Response.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient()
  if (!supabase) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error: profileErr } = await supabase
    .from('technician_profiles')
    .delete()
    .eq('id', id)
  if (profileErr) return Response.json({ error: profileErr.message }, { status: 500 })

  await supabase.auth.admin.deleteUser(id)

  return Response.json({ ok: true })
}
