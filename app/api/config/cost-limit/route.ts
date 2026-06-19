import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('ai_config').select('value').eq('key', 'cost_limit_usd').single()
  return Response.json({ limit: data?.value ? parseFloat(data.value) : 10 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { limit } = await req.json()
  const { error } = await supabase.from('ai_config').upsert(
    { key: 'cost_limit_usd', value: String(limit), updated_by: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
