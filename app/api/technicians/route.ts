import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendTechnicianInviteEmail } from '@/lib/email'
import { NextRequest } from 'next/server'

async function getAdminClient() {
  const sso = await createClient()
  const { data: { user } } = await sso.auth.getUser()
  if (!user) return null
  // Use SSR client (has valid session/auth.uid) for role check
  const { data: profile } = await sso
    .from('technician_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return await createServiceClient()
}

export async function GET() {
  const svc = await createServiceClient()
  const { data, error } = await svc
    .from('technician_profiles')
    .select('id, display_name, email, phone, whatsapp, role, account_status, created_at')
    .order('display_name')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await getAdminClient()
  if (!supabase) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { display_name, email, phone, whatsapp } = await req.json()
  if (!email || !display_name) return Response.json({ error: 'Nome ed email obbligatori' }, { status: 400 })

  // Create auth user and get invite link without sending Supabase's email
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { display_name, role: 'technician' } },
  })
  if (linkError) return Response.json({ error: linkError.message }, { status: 500 })

  const userId = linkData.user.id
  const inviteLink = linkData.properties?.action_link ?? null

  // Create technician profile
  const { error: profileError } = await supabase
    .from('technician_profiles')
    .upsert({
      id: userId,
      display_name,
      email,
      phone: phone ?? null,
      whatsapp: whatsapp ?? null,
      role: 'technician',
      account_status: 'invited',
    })
  if (profileError) return Response.json({ error: profileError.message }, { status: 500 })

  // Send branded invite email via Resend
  if (inviteLink) {
    try {
      await sendTechnicianInviteEmail({ to: email, name: display_name, inviteLink })
    } catch (err) {
      console.error('Failed to send invite email:', err)
    }
  }

  return Response.json({ ok: true, userId })
}
