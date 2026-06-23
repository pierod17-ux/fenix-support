import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email'
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getAdminClient()
  if (!supabase) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: tech } = await supabase
    .from('technician_profiles')
    .select('email, display_name')
    .eq('id', id)
    .single()

  if (!tech?.email) return Response.json({ error: 'Technician not found' }, { status: 404 })

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fenix-support.netlify.app').replace(/\/$/, '')
  const { data: linkData, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: tech.email,
    options: { redirectTo: `${siteUrl}/auth/set-password` },
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const rawResetLink = linkData.properties?.action_link ?? null
  if (rawResetLink) {
    try {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fenix-support.netlify.app').replace(/\/$/, '')
      const url = new URL(rawResetLink)
      const redirectTo = url.searchParams.get('redirect_to')
      if (redirectTo) url.searchParams.set('redirect_to', redirectTo.replace(/^https?:\/\/localhost:\d+/, siteUrl))
      const resetLink = url.toString()
      await sendPasswordResetEmail({ to: tech.email, name: tech.display_name ?? 'Tecnico', resetLink })
    } catch (err) {
      console.error('Failed to send reset email:', err)
    }
  }

  return Response.json({ ok: true })
}
