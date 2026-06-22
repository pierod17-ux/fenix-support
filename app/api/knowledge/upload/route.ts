import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Timeout per-route: PDF parsing può richiedere >10s su file grandi
export const maxDuration = 60

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    chunks.push(text.slice(start, end).trim())
    start = end - CHUNK_OVERLAP
  }
  return chunks.filter(c => c.length > 50)
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  // pdf-parse è in serverExternalPackages: non viene bundled da webpack
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
  const data = await pdfParse(Buffer.from(buffer))
  return data.text
}

async function processDocument(docId: string, fileBuffer: ArrayBuffer, fileType: string, title: string) {
  const supabase = await createServiceClient()

  let text = ''
  try {
    if (fileType === 'pdf') {
      text = await extractPdfText(fileBuffer)
    } else {
      text = new TextDecoder().decode(fileBuffer)
    }
  } catch (err) {
    console.error('[KB] Text extraction failed:', err)
    await supabase.from('knowledge_documents').update({ status: 'error' }).eq('id', docId)
    return
  }

  if (!text.trim()) {
    console.error('[KB] No text extracted from document')
    await supabase.from('knowledge_documents').update({ status: 'error' }).eq('id', docId)
    return
  }

  try {
    const chunks = chunkText(text)
    const rows = chunks.map((content, i) => ({
      document_id: docId,
      title: `${title} (parte ${i + 1})`,
      content,
      // embedding NULL: usiamo ricerca full-text (tsvector), non vettori OpenAI
    }))

    const batchSize = 50
    for (let i = 0; i < rows.length; i += batchSize) {
      await supabase.from('knowledge_chunks').insert(rows.slice(i, i + batchSize))
    }

    await supabase
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: rows.length })
      .eq('id', docId)

    console.log(`[KB] Document ${docId} ready: ${rows.length} chunks`)
  } catch (err) {
    console.error('[KB] Chunking/insert failed:', err)
    await supabase.from('knowledge_documents').update({ status: 'error' }).eq('id', docId)
  }
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
  if (!['pdf', 'docx', 'txt'].includes(fileType)) {
    return Response.json({ error: 'Formato non supportato (PDF, DOCX, TXT)' }, { status: 400 })
  }

  const fileBuffer = await file.arrayBuffer()

  const fileName = `${Date.now()}_${file.name}`
  const { error: uploadErr } = await supabase.storage
    .from('knowledge-documents')
    .upload(fileName, fileBuffer, { contentType: file.type })

  if (uploadErr) {
    console.error('[KB] Storage upload error:', uploadErr)
    return Response.json({ error: `Upload fallito: ${uploadErr.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('knowledge-documents')
    .getPublicUrl(fileName)

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
    console.error('[KB] DB insert error:', docErr)
    return Response.json({ error: `Errore DB: ${docErr?.message}` }, { status: 500 })
  }

  await processDocument(doc.id, fileBuffer, fileType, title)

  const { data: updated } = await (await createServiceClient())
    .from('knowledge_documents').select('status, chunk_count').eq('id', doc.id).single()

  return Response.json({ id: doc.id, status: updated?.status, chunks: updated?.chunk_count })
}
