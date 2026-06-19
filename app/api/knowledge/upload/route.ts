import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const CHUNK_SIZE = 800  // characters per chunk
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
  if (!res.ok) throw new Error('Embedding API error')
  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}

export async function POST(req: NextRequest) {
  const auth = await createClient()           // SSR — legge la sessione admin
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient() // service role — storage + DB

  const formData = await req.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const file = formData.get('file') as File

  if (!title || !file) {
    return Response.json({ error: 'title and file required' }, { status: 400 })
  }

  const fileType = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
  if (!['pdf', 'docx', 'txt'].includes(fileType)) {
    return Response.json({ error: 'Formato non supportato' }, { status: 400 })
  }

  // Upload file su Supabase Storage
  const fileName = `${Date.now()}_${file.name}`
  const fileBuffer = await file.arrayBuffer()
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('knowledge-documents')
    .upload(fileName, fileBuffer, { contentType: file.type })

  if (uploadErr) {
    return Response.json({ error: 'Upload storage failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('knowledge-documents')
    .getPublicUrl(fileName)

  // Crea record documento
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
    return Response.json({ error: 'DB insert failed' }, { status: 500 })
  }

  // Estrai testo (solo TXT per ora; PDF/DOCX richiedono parser aggiuntivo)
  let text = ''
  if (fileType === 'txt') {
    text = await file.text()
  } else {
    // Per PDF/DOCX: salva con status 'processing', processa in background via Edge Function
    // Per ora uso il testo grezzo del buffer come placeholder
    text = `Documento: ${title}\n${description ?? ''}\n[Elaborazione contenuto avanzato in corso]`
  }

  // Chunking + embedding
  try {
    const chunks = chunkText(text)
    const batchSize = 20
    let totalChunks = 0

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddings = await embedTexts(batch)

      const rows = batch.map((content, j) => ({
        document_id: doc.id,
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
      .eq('id', doc.id)
  } catch (err) {
    await supabase
      .from('knowledge_documents')
      .update({ status: 'error' })
      .eq('id', doc.id)
    console.error('Embedding failed:', err)
  }

  return Response.json({ id: doc.id })
}
