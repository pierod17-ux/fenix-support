// Link "imposta password" a prova di scanner email.
//
// Il classico action_link di Supabase (…/auth/v1/verify?token=…) è monouso e
// viene consumato al primo GET: i filtri antispam/anteprima dei client di posta
// "pre-aprono" i link e lo bruciano prima del clic dell'utente.
// Qui invece il link porta alla nostra pagina con il token_hash in query:
// il token viene consumato solo quando l'utente preme il pulsante nel form
// (supabase.auth.verifyOtp), quindi un GET automatico è innocuo.
export function buildSetPasswordLink(
  siteUrl: string,
  properties: { hashed_token?: string | null; action_link?: string | null } | null | undefined,
  type: 'recovery' | 'invite'
): string | null {
  const hashedToken = properties?.hashed_token
  if (hashedToken) {
    return `${siteUrl}/auth/set-password?token_hash=${encodeURIComponent(hashedToken)}&type=${type}`
  }
  // Fallback: vecchio action_link (con redirect_to corretto se GoTrue ha messo localhost)
  const rawLink = properties?.action_link
  if (!rawLink) return null
  const url = new URL(rawLink)
  const redirectTo = url.searchParams.get('redirect_to')
  if (redirectTo) {
    url.searchParams.set('redirect_to', redirectTo.replace(/^https?:\/\/localhost:\d+/, siteUrl))
  }
  return url.toString()
}
