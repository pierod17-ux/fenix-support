import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data } = await supabase.from('ai_config').select('value').eq('key', 'cost_limit_usd').single()
  return Response.json({ limit: data?.value ? parseFloat(data.value) : 10 })
}

export async function POST(req: NextRequest) {
  const { limit } = await req.json()
  const supabase = await createServiceClient()
  await supabase.from('ai_config').upsert(
    { key: 'cost_limit_usd', value: String(limit), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return Response.json({ ok: true })
}
