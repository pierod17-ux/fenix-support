import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { value } = await req.json()

  await supabase.from('ai_config').upsert({
    key: 'system_context',
    value,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' })

  return Response.json({ ok: true })
}
