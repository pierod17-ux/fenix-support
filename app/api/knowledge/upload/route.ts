import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
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
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const base64 = Buffer.from(buffer).toString('base64')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (client.messages.create as unknown as (p: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text?: string }> }>)({
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
  })

  return response.content[0]?.text ?? ''
}

async function processDocument(
  docId: string,
  fileBuffer: ArrayBuffer,
  fileType: string,
  title: string,
  supabase: SupabaseClient,
) {
  let text = ''
  try {
    if (fileType === 'pdf') {
      text = await extractPdfText(fileBuffer)
    } else {
      text = new TextDecoder('utf-8', { fatal: false }).decode(fileBuffer)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[KB] Text extraction failed:', msg)
    await supabase.from('knowledge_documents')
      .update({ status: 'error', description: `Estrazione testo fallita: ${msg.slice(0, 200)}` })
      .eq('id', docId)
    return
  }

  if (!text.trim()) {
    await supabase.from('knowledge_documents')
      .update({ status: 'error', description: 'Testo estratto vuoto' })
      .eq('id', docId)
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
      if (error) throw new Error(`Chunk insert: ${error.message}`)
    }

    const { error: updErr } = await supabase
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: rows.length })
      .eq('id', docId)
    if (updErr) throw new Error(`Status update: ${updErr.message}`)

    console.log(`[KB] Document ${docId} ready: ${rows.length} chunks`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[KB] Processing failed:', msg)
    await supabase.from('knowledge_documents')
      .update({ status: 'error', description: `Indicizzazione fallita: ${msg.slice(0, 200)}` })
      .eq('id', docId)
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

  await processDocument(doc.id, fileBuffer, fileType, title, supabase)

  const { data: updated } = await supabase
    .from('knowledge_documents')
    .select('status, chunk_count, description')
    .eq('id', doc.id)
    .single()

  return Response.json({
    id: doc.id,
    status: updated?.status ?? 'processing',
    chunks: updated?.chunk_count ?? 0,
    error_detail: updated?.status === 'error' ? updated?.description : undefined,
  })
}
