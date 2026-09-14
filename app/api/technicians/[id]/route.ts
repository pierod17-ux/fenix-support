import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isOwnerEmail } from '@/lib/owner'
import { NextRequest } from 'next/server'

// Restituisce il service client + l'id di chi sta chiamando (serve per impedire
// che un admin declassi o elimini se stesso, chiudendosi fuori).
async function getAdminContext() {
  const sso = await createClient()
  const { data: { user } } = await sso.auth.getUser()
  if (!user) return null
  const { data: profile } = await sso
    .from('technician_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { supabase: await createServiceClient(), callerId: user.id }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminContext()
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { supabase, callerId } = ctx

  const { id } = await params
  const body = await req.json()

  const { data: target } = await supabase
    .from('technician_profiles').select('email, role').eq('id', id).single()
  if (!target) return Response.json({ error: 'Tecnico non trovato' }, { status: 404 })

  const targetIsOwner = isOwnerEmail(target.email)
  const targetIsSelf = id === callerId

  // Only allow updating safe fields
  const allowed: Record<string, unknown> = {}
  if (body.display_name !== undefined) allowed.display_name = body.display_name
  if (body.phone !== undefined) allowed.phone = body.phone
  if (body.whatsapp !== undefined) allowed.whatsapp = body.whatsapp

  // Ruolo: promuove a admin o riporta a tecnico.
  if (body.role !== undefined) {
    if (body.role !== 'admin' && body.role !== 'technician') {
      return Response.json({ error: 'Ruolo non valido' }, { status: 400 })
    }
    if (targetIsOwner && body.role !== 'admin') {
      return Response.json(
        { error: 'L\'account proprietario non può essere declassato' }, { status: 403 })
    }
    if (targetIsSelf && body.role !== 'admin') {
      return Response.json(
        { error: 'Non puoi togliere a te stesso i permessi di amministratore' }, { status: 403 })
    }
    allowed.role = body.role
  }

  if (body.account_status !== undefined) {
    if (targetIsOwner && body.account_status === 'disabled') {
      return Response.json(
        { error: 'L\'account proprietario non può essere disabilitato' }, { status: 403 })
    }
    if (targetIsSelf && body.account_status === 'disabled') {
      return Response.json(
        { error: 'Non puoi disabilitare il tuo stesso account' }, { status: 403 })
    }
    allowed.account_status = body.account_status
  }

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
  const ctx = await getAdminContext()
  if (!ctx) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { supabase, callerId } = ctx

  const { id } = await params

  const { data: target } = await supabase
    .from('technician_profiles').select('email').eq('id', id).single()
  if (!target) return Response.json({ error: 'Tecnico non trovato' }, { status: 404 })

  if (isOwnerEmail(target.email)) {
    return Response.json(
      { error: 'L\'account proprietario non può essere eliminato' }, { status: 403 })
  }
  if (id === callerId) {
    return Response.json(
      { error: 'Non puoi eliminare il tuo stesso account' }, { status: 403 })
  }

  const { error: profileErr } = await supabase
    .from('technician_profiles')
    .delete()
    .eq('id', id)
  if (profileErr) return Response.json({ error: profileErr.message }, { status: 500 })

  await supabase.auth.admin.deleteUser(id)

  return Response.json({ ok: true })
}
