import type { SupabaseClient } from '@supabase/supabase-js'
import { sendChatClaimedEmail } from '@/lib/email'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>

export interface OnCallTech {
  id: string
  display_name: string | null
  whatsapp: string | null
  email: string | null
}

// I turni sono inseriti dall'admin in ora italiana: vanno confrontati con l'ora
// di Roma, NON con quella del runtime (Netlify gira in UTC → prima il confronto
// era sbagliato di 1-2 ore a seconda dell'ora legale).
const ROME = 'Europe/Rome'
export function nowInRome(date = new Date()): { dayOfWeek: number; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ROME, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  const hour = get('hour') === '24' ? '00' : get('hour') // alcuni ICU rendono la mezzanotte come "24"
  return { dayOfWeek, time: `${hour}:${get('minute')}` }
}

// Tutti i tecnici di turno ADESSO (giorno + fascia oraria in ora di Roma), senza duplicati.
// Nessun fallback: se la lista è vuota, nessuno è di turno — la decisione su
// cosa fare in quel caso spetta a chi chiama (escalation: avvisa tutti;
// chat diretta: rifiuta).
export async function getOnCallTechnicians(supabase: Db): Promise<OnCallTech[]> {
  const { dayOfWeek, time } = nowInRome()
  const { data: schedules } = await supabase
    .from('technician_schedules')
    .select('technician:technician_id(id, display_name, whatsapp, email, account_status)')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .lte('start_time', time)
    .gte('end_time', time)

  const techs = (schedules ?? [])
    .map(s => (Array.isArray(s.technician) ? s.technician[0] : s.technician) as (OnCallTech & { account_status?: string }) | null)
    .filter((t): t is OnCallTech & { account_status?: string } => !!t && t.account_status !== 'disabled')
  return Array.from(new Map(techs.map(t => [t.id, t])).values())
}

// Tutti i tecnici attivi (per l'avviso "nessuno di turno").
export async function getAllActiveTechnicians(supabase: Db): Promise<OnCallTech[]> {
  const { data } = await supabase
    .from('technician_profiles')
    .select('id, display_name, whatsapp, email')
    .neq('account_status', 'disabled')
  return (data ?? []) as OnCallTech[]
}

export interface ResolvedChat {
  chat: { id: string; ticket_id: string; technician_id: string | null; status: string; claimed_at: string | null }
  // valorizzato solo se il token è un invito personale di un tecnico
  inviteTechId: string | null
}

// Un token può essere: l'invito personale di un tecnico (direct_chat_invites)
// oppure l'access_token della chat (usato dal cliente per il polling e dai
// vecchi link email). Solo gli inviti identificano un tecnico.
export async function resolveChatToken(supabase: Db, token: string): Promise<ResolvedChat | null> {
  const sel = 'id, ticket_id, technician_id, status, claimed_at'
  const { data: invite } = await supabase
    .from('direct_chat_invites')
    .select(`technician_id, chat:chat_id(${sel})`)
    .eq('token', token)
    .maybeSingle()
  if (invite?.chat) {
    const chat = (Array.isArray(invite.chat) ? invite.chat[0] : invite.chat) as ResolvedChat['chat']
    return { chat, inviteTechId: invite.technician_id as string }
  }
  const { data: chat } = await supabase.from('direct_chats').select(sel).eq('access_token', token).maybeSingle()
  return chat ? { chat: chat as ResolvedChat['chat'], inviteTechId: null } : null
}

export type ClaimResult =
  | { outcome: 'claimed' | 'mine'; techName: string }
  | { outcome: 'taken'; techName: string; claimedAt: string | null }

// Presa in carico "il primo che arriva": UPDATE condizionale su technician_id
// IS NULL → anche se due tecnici aprono il link nello stesso istante, ne vince
// esattamente uno. Al vincitore: ticket assegnato + avviso email agli altri
// invitati. Agli altri: chi l'ha presa.
export async function claimChat(supabase: Db, chat: ResolvedChat['chat'], techId: string): Promise<ClaimResult> {
  const nameOf = async (id: string) => {
    const { data } = await supabase.from('technician_profiles').select('display_name').eq('id', id).maybeSingle()
    return (data?.display_name as string | null) ?? 'Tecnico'
  }

  if (chat.technician_id === techId) return { outcome: 'mine', techName: await nameOf(techId) }
  if (chat.technician_id) return { outcome: 'taken', techName: await nameOf(chat.technician_id), claimedAt: chat.claimed_at }

  const claimedAt = new Date().toISOString()
  const { data: won } = await supabase
    .from('direct_chats')
    .update({ technician_id: techId, claimed_at: claimedAt })
    .eq('id', chat.id)
    .is('technician_id', null)
    .select('id')
    .maybeSingle()

  if (!won) {
    // qualcun altro ha vinto la corsa un istante prima
    const { data: fresh } = await supabase.from('direct_chats').select('technician_id, claimed_at').eq('id', chat.id).single()
    const other = fresh?.technician_id as string | null
    return { outcome: 'taken', techName: other ? await nameOf(other) : 'un altro tecnico', claimedAt: fresh?.claimed_at ?? null }
  }

  const techName = await nameOf(techId)
  await supabase.from('support_tickets').update({ assigned_to: techId, status: 'in_progress' }).eq('id', chat.ticket_id)
  void notifyOthersClaimed(supabase, chat, techId, techName)
  return { outcome: 'claimed', techName }
}

async function notifyOthersClaimed(supabase: Db, chat: ResolvedChat['chat'], claimerId: string, claimerName: string) {
  try {
    const [{ data: invites }, { data: ticket }] = await Promise.all([
      supabase
        .from('direct_chat_invites')
        .select('technician:technician_id(id, display_name, email)')
        .eq('chat_id', chat.id)
        .neq('technician_id', claimerId),
      supabase
        .from('support_tickets')
        .select('id, customer_name, machine_model, machine_serial, subject')
        .eq('id', chat.ticket_id)
        .single(),
    ])
    if (!ticket) return
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fenix-support.netlify.app'
    const machineName = [ticket.machine_model, ticket.machine_serial].filter(Boolean).join(' — ') || 'N/D'
    await Promise.all((invites ?? []).map(async row => {
      const t = (Array.isArray(row.technician) ? row.technician[0] : row.technician) as { display_name: string | null; email: string | null } | null
      if (!t?.email) return
      try {
        await sendChatClaimedEmail({
          to: t.email,
          technicianName: t.display_name ?? 'Tecnico',
          claimerName,
          customerName: ticket.customer_name,
          machineName,
          subject: ticket.subject,
          ticketUrl: `${portalUrl}/admin/tickets/${ticket.id}`,
        })
      } catch (err) { console.error('[CLAIM] email avviso fallita:', err) }
    }))
  } catch (err) { console.error('[CLAIM] notifyOthersClaimed:', err) }
}
