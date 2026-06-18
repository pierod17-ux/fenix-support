import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data } = await supabase.from('ai_config').select('value').eq('key', 'behavior_rules').single()
  try {
    return Response.json(data?.value ? JSON.parse(data.value) : [])
  } catch {
    return Response.json([])
  }
}

export async function POST(req: NextRequest) {
  const rules = await req.json()
  const supabase = await createServiceClient()
  await supabase.from('ai_config').upsert(
    { key: 'behavior_rules', value: JSON.stringify(rules), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return Response.json({ ok: true })
}
