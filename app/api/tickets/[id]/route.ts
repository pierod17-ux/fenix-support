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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient()
  if (!supabase) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // FK constraints cascade to ticket_messages, ai_feedback, direct_chats
  const { error } = await supabase.from('support_tickets').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
