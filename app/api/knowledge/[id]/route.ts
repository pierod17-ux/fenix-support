import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Get file_url before deleting
  const { data: doc } = await supabase
    .from('knowledge_documents')
    .select('file_url')
    .eq('id', id)
    .single()

  // Delete chunks first (FK)
  await supabase.from('knowledge_chunks').delete().eq('document_id', id)

  // Delete document record
  const { error } = await supabase.from('knowledge_documents').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Delete file from storage (best effort)
  if (doc?.file_url) {
    const fileName = doc.file_url.split('/').pop()
    if (fileName) {
      await supabase.storage.from('knowledge-documents').remove([fileName])
    }
  }

  return Response.json({ ok: true })
}
