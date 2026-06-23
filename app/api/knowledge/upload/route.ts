import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const maxDuration = 30

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + 800, text.length)
    chunks.push(text.slice(start, end).trim())
    if (end >= text.length) break
    start += 700
  }
  return chunks.filter(c => c.length > 50)
}

async function insertChunks(docId: string, title: string, chunks: string[]) {
  const svc = await createServiceClient()
  const rows = chunks.map((content, i) => ({
    document_id: docId,
    title: `${title} (parte ${i + 1})`,
    content,
  }))
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await svc.from('knowledge_chunks').insert(rows.slice(i, i + 50))
    if (error) throw new Error(`Chunk insert: ${error.message}`)
  }
  await svc.from('knowledge_documents')
    .update({ status: 'ready', chunk_count: rows.length })
    .eq('id', docId)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const file = formData.get('file') as File

  if (!title || !file) {
    return Response.json({ error: 'title e file obbligatori' }, { status: 400 })
  }

  const fileType = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
  if (!['pdf', 'txt'].includes(fileType)) {
    return Response.json({ error: 'Formato non supportato (PDF, TXT)' }, { status: 400 })
  }

  const fileBuffer = await file.arrayBuffer()
  const fileName = `${Date.now()}_${file.name}`

  const { error: uploadErr } = await supabase.storage
    .from('knowledge-documents')
    .upload(fileName, fileBuffer, { contentType: file.type })

  if (uploadErr) {
    return Response.json({ error: `Upload fallito: ${uploadErr.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('knowledge-documents')
    .getPublicUrl(fileName)

  // Extract text
  let text: string
  try {
    if (fileType === 'txt') {
      text = new TextDecoder('utf-8').decode(fileBuffer)
    } else {
      // pdf-parse: dynamic import avoids webpack issues with test file paths
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
      const data = await pdfParse(Buffer.from(fileBuffer))
      text = data.text
    }
  } catch (e) {
    return Response.json({ error: `Estrazione testo fallita: ${String(e).slice(0, 200)}` }, { status: 500 })
  }

  if (!text.trim()) {
    return Response.json({ error: 'Nessun testo estratto dal documento' }, { status: 400 })
  }

  const chunks = chunkText(text)

  const { data: doc, error: docErr } = await supabase
    .from('knowledge_documents')
    .insert({
      title,
      description: description || null,
      file_url: publicUrl,
      file_type: fileType,
      status: 'processing',
      chunk_count: 0,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (docErr || !doc) {
    return Response.json({ error: `Errore DB: ${docErr?.message}` }, { status: 500 })
  }

  try {
    await insertChunks(doc.id, title, chunks)
    return Response.json({ id: doc.id, status: 'ready', chunks: chunks.length })
  } catch (e) {
    await supabase.from('knowledge_documents')
      .update({ status: 'error', description: String(e).slice(0, 300) })
      .eq('id', doc.id)
    return Response.json({ error: 'Indicizzazione fallita', detail: String(e) }, { status: 500 })
  }
}
