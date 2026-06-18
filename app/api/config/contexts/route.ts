import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('ai_config').select('value').eq('key', 'system_contexts').single()
  try {
    return Response.json(data?.value ? JSON.parse(data.value) : [])
  } catch {
    return Response.json([])
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const contexts = await req.json()
  await supabase.from('ai_config').upsert(
    { key: 'system_contexts', value: JSON.stringify(contexts), updated_by: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return Response.json({ ok: true })
}
