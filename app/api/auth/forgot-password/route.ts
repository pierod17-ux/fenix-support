import { createServiceClient } from '@/lib/supabase/server'
import { sendPasswordResetEmail } from '@/lib/email'
import { buildSetPasswordLink } from '@/lib/auth-links'
import { NextRequest } from 'next/server'

// Endpoint pubblico (utente non loggato): invia una mail di reset password.
// Per sicurezza non rivela mai se l'email esiste o meno → risposta sempre { ok: true }.
export async function POST(req: NextRequest) {
  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    return Response.json({ error: 'Richiesta non valida' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Inserisci un indirizzo email valido' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fenix-support.netlify.app').replace(/\/$/, '')

  try {
    // L'account deve esistere tra tecnici/admin. Se non esiste, usciamo in silenzio.
    const { data: profile } = await supabase
      .from('technician_profiles')
      .select('email, display_name')
      .ilike('email', email)
      .maybeSingle()

    if (profile?.email) {
      const { data: linkData, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: profile.email,
        options: { redirectTo: `${siteUrl}/auth/set-password` },
      })

      const resetLink = !error ? buildSetPasswordLink(siteUrl, linkData?.properties, 'recovery') : null
      if (resetLink) {
        await sendPasswordResetEmail({
          to: profile.email,
          name: profile.display_name ?? 'Tecnico',
          resetLink,
        })
      }
    }
  } catch (err) {
    // Non esporre dettagli interni: log lato server, risposta neutra al client.
    console.error('forgot-password error:', err)
  }

  // Risposta sempre uguale, a prescindere dall'esito → niente enumeration delle email.
  return Response.json({ ok: true })
}
