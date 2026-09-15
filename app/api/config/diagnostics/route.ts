import { createClient } from '@/lib/supabase/server'
import { isDiagnosticsConfigured } from '@/lib/diagnostics'
import { NextRequest } from 'next/server'

// Controlla se il referto della diagnostica remota viene comunicato apertamente
// al cliente (true, default) oppure usato solo internamente per guidare le
// domande e i suggerimenti (false). Il tool stesso NON si disattiva mai da qui:
// è sempre attivo quando STATUS_API_KEY è configurata (vedi lib/diagnostics.ts).
// Lettura: chiunque sia loggato. Scrittura: solo admin.
export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('ai_config').select('value').eq('key', 'diagnostics_enabled').maybeSingle()
  return Response.json({ discloseToCustomer: data?.value !== 'false', configured: isDiagnosticsConfigured() })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase
    .from('technician_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return Response.json({ error: 'Solo gli amministratori' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  if (typeof body.discloseToCustomer !== 'boolean') {
    return Response.json({ error: 'discloseToCustomer (boolean) richiesto' }, { status: 400 })
  }

  const { error } = await supabase.from('ai_config').upsert(
    { key: 'diagnostics_enabled', value: String(body.discloseToCustomer), updated_by: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, discloseToCustomer: body.discloseToCustomer, configured: isDiagnosticsConfigured() })
}
