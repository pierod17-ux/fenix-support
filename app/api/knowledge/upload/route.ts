import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

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
  const base64 = Buffer.from(buffer).toString('base64')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: 'Estrai tutto il testo di questo documento tecnico. Restituisci SOLO il testo grezzo, senza commenti né formattazione aggiuntiva.',
          },
        ],
      }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic PDF extract error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return (data.content?.[0]?.text as string) ?? ''
}

async function processDocument(docId: string, fileBuffer: ArrayBuffer, fileType: string, title: string) {
  const supabase = await createServiceClient()

  let text = ''
  try {
    if (fileType === 'pdf') {
      text = await extractPdfText(fileBuffer)
    } else {
      text = new TextDecoder('utf-8', { fatal: false }).decode(fileBuffer)
    }
  } catch (err) {
    console.error('[KB] Text extraction failed:', err)
    await supabase.from('knowledge_documents').update({ status: 'error' }).eq('id', docId)
    return
  }

  if (!text.trim()) {
    await supabase.from('knowledge_documents').update({ status: 'error' }).eq('id', docId)
    return
  }

  try {
    const chunks = chunkText(text)
    const rows = chunks.map((content, i) => ({
      document_id: docId,
      title: `${title} (parte ${i + 1})`,
      content,
    }))

    for (let i = 0; i < rows.length; i += 50) {
      const { error } = await supabase.from('knowledge_chunks').insert(rows.slice(i, i + 50))
      if (error) throw new Error(`Chunk insert error: ${error.message}`)
    }

    const { error: updErr } = await supabase
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: rows.length })
      .eq('id', docId)
    if (updErr) console.error('[KB] Status update error:', updErr)

    console.log(`[KB] Document ${docId} ready: ${rows.length} chunks`)
  } catch (err) {
    console.error('[KB] Processing failed:', err)
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

  await processDocument(doc.id, fileBuffer, fileType, title)

  const { data: updated } = await (await createServiceClient())
    .from('knowledge_documents')
    .select('status, chunk_count')
    .eq('id', doc.id)
    .single()

  return Response.json({ id: doc.id, status: updated?.status ?? 'processing', chunks: updated?.chunk_count ?? 0 })
}
