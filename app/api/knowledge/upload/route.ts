import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, after } from 'next/server'

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

async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: texts, model: 'text-embedding-3-small' }),
  })
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`)
  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
  const data = await pdfParse(Buffer.from(buffer))
  return data.text
}

async function processDocument(docId: string, fileBuffer: ArrayBuffer, fileType: string, title: string) {
  // Usa service client: fuori dal contesto request, la sessione SSR non è disponibile
  const supabase = await createServiceClient()

  let text = ''
  try {
    if (fileType === 'txt') {
      text = new TextDecoder().decode(fileBuffer)
    } else if (fileType === 'pdf') {
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
    const batchSize = 20
    let totalChunks = 0

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddings = await embedTexts(batch)
      const rows = batch.map((content, j) => ({
        document_id: docId,
        title: `${title} (parte ${i + j + 1})`,
        content,
        embedding: embeddings[j],
      }))
      await supabase.from('knowledge_chunks').insert(rows)
      totalChunks += batch.length
    }

    await supabase
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: totalChunks })
      .eq('id', docId)

    console.log(`[KB] Document ${docId} ready: ${totalChunks} chunks`)
  } catch (err) {
    console.error('[KB] Embedding failed:', err)
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

  // Upload storage
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

  // Crea record con status processing
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

  // Lancia processing DOPO la risposta — nessun timeout di request
  after(async () => {
    await processDocument(doc.id, fileBuffer, fileType, title)
  })

  return Response.json({ id: doc.id, status: 'processing' })
}
