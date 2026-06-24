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

// Elimina una o più conversazioni (support_tickets). I vincoli FK eliminano in
// cascata i ticket_messages, ai_feedback e direct_chats collegati.
export async function POST(req: NextRequest) {
  const supabase = await getAdminClient()
  if (!supabase) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: 'Nessuna conversazione selezionata' }, { status: 400 })
  }

  const { error } = await supabase.from('support_tickets').delete().in('id', ids)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, deleted: ids.length })
}
