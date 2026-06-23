import { createServiceClient } from '@/lib/supabase/server'
import { sendOnCallEmail } from '@/lib/email'
import { NextRequest } from 'next/server'

export const maxDuration = 30

// Chiamato ogni minuto da pg_cron (Supabase). Invia la mail di reperibilità
// 10 minuti prima e all'inizio del turno, con dedup per non inviare due volte.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Ora corrente nel fuso Europe/Rome
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', hour12: false,
    weekday: 'short', hour: '2-digit', minute: '2-digit',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  const dow = weekdayMap[get('weekday')] ?? 0
  const nowMinutes = parseInt(get('hour')) * 60 + parseInt(get('minute'))
  const forDate = `${get('year')}-${get('month')}-${get('day')}`

  const supabase = await createServiceClient()
  const { data: schedules } = await supabase
    .from('technician_schedules')
    .select('id, start_time, end_time, technician:technician_id(display_name, email, account_status)')
    .eq('is_active', true)
    .eq('day_of_week', dow)

  if (!schedules?.length) return Response.json({ ok: true, checked: 0, sent: 0 })

  const portalUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fenix-support.netlify.app').replace(/\/$/, '')
  let sent = 0

  for (const s of schedules) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tech = (Array.isArray(s.technician) ? s.technician[0] : s.technician) as any
    if (!tech?.email || tech.account_status === 'disabled') continue

    const startMinutes = parseInt(s.start_time.slice(0, 2)) * 60 + parseInt(s.start_time.slice(3, 5))
    const reminderMinutes = startMinutes - 10

    let kind: 'reminder' | 'start' | null = null
    if (nowMinutes === reminderMinutes) kind = 'reminder'
    else if (nowMinutes === startMinutes) kind = 'start'
    if (!kind) continue

    // Dedup: vincolo UNIQUE (schedule_id, kind, for_date)
    const { error: dupErr } = await supabase
      .from('on_call_notifications')
      .insert({ schedule_id: s.id, kind, for_date: forDate })
    if (dupErr) continue // già inviata (23505) o altro errore → non reinviare

    try {
      await sendOnCallEmail({
        to: tech.email,
        name: tech.display_name ?? 'Tecnico',
        startTime: s.start_time.slice(0, 5),
        endTime: s.end_time.slice(0, 5),
        isReminder: kind === 'reminder',
        portalUrl,
      })
      sent++
    } catch (e) {
      console.error('[ON-CALL] email error:', e)
    }
  }

  return Response.json({ ok: true, checked: schedules.length, sent })
}
