// Account "proprietario" del portale.
//
// A differenza degli altri amministratori NON può essere eliminato, disabilitato
// né declassato a tecnico. Serve a due cose:
//  1. garantire che esista sempre almeno un amministratore (niente lockout);
//  2. proteggere l'account del titolare da un errore di un altro admin.
//
// Configurabile con la env `OWNER_EMAIL`; il default è l'admin storico.
// `NEXT_PUBLIC_OWNER_EMAIL` (derivata in next.config.ts) rende il valore
// leggibile anche dai componenti client, che lo usano solo per nascondere i
// pulsanti: la verità è comunque applicata lato server nelle API routes.
export const OWNER_EMAIL = (
  process.env.NEXT_PUBLIC_OWNER_EMAIL ??
  process.env.OWNER_EMAIL ??
  'pierod17@gmail.com'
).trim().toLowerCase()

export function isOwnerEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === OWNER_EMAIL
}
