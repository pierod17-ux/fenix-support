import { createClient } from '@/lib/supabase/server'
import { NextRequest, after } from 'next/server'

export const maxDuration = 30

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + 800, text.length)
    chunks.push(text.slice(start, end).trim())
    start = end - 100
  }
  return chunks.filter(c => c.length > 50)
}

export async function POST(req: NextRequest) {
  console.log('[KB-UPLOAD] start')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('[KB-UPLOAD] unauthorized')
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  console.log('[KB-UPLOAD] user ok:', user.id)

  const formData = await req.formData()
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const file = formData.get('file') as File

  if (!title || !file) {
    return Response.json({ error: 'title e file obbligatori' }, { status: 400 })
  }

  const fileType = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
  console.log('[KB-UPLOAD] fileType:', fileType, 'size:', file.size)

  if (!['pdf', 'txt'].includes(fileType)) {
    return Response.json({ error: 'Formato non supportato (PDF, TXT)' }, { status: 400 })
  }

  const fileBuffer = await file.arrayBuffer()
  const fileName = `${Date.now()}_${file.name}`
  console.log('[KB-UPLOAD] fileName:', fileName)

  const { error: uploadErr } = await supabase.storage
    .from('knowledge-documents')
    .upload(fileName, fileBuffer, { contentType: file.type })

  if (uploadErr) {
    console.log('[KB-UPLOAD] storage upload error:', uploadErr.message)
    return Response.json({ error: `Upload fallito: ${uploadErr.message}` }, { status: 500 })
  }
  console.log('[KB-UPLOAD] storage upload ok')

  const { data: { publicUrl } } = supabase.storage
    .from('knowledge-documents')
    .getPublicUrl(fileName)

  // TXT: process inline (fast, no timeout risk)
  if (fileType === 'txt') {
    console.log('[KB-UPLOAD] TXT inline processing start')
    const text = new TextDecoder('utf-8').decode(fileBuffer)
    console.log('[KB-UPLOAD] text length:', text.length)
    const chunks = chunkText(text)
    console.log('[KB-UPLOAD] chunks:', chunks.length)

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
      console.log('[KB-UPLOAD] doc insert error:', docErr?.message)
      return Response.json({ error: `Errore DB: ${docErr?.message}` }, { status: 500 })
    }
    console.log('[KB-UPLOAD] doc inserted:', doc.id)

    try {
      const rows = chunks.map((content, i) => ({
        document_id: doc.id,
        title: `${title} (parte ${i + 1})`,
        content,
      }))
      for (let i = 0; i < rows.length; i += 50) {
        const { error } = await supabase.from('knowledge_chunks').insert(rows.slice(i, i + 50))
        if (error) throw error
        console.log('[KB-UPLOAD] inserted chunks batch', i, '-', Math.min(i + 50, rows.length))
      }

      const { error: updErr } = await supabase.from('knowledge_documents')
        .update({ status: 'ready', chunk_count: rows.length })
        .eq('id', doc.id)
      console.log('[KB-UPLOAD] status update:', updErr ? updErr.message : 'ok', 'chunks:', rows.length)

      return Response.json({ id: doc.id, status: 'ready', chunks: rows.length })
    } catch (e) {
      console.log('[KB-UPLOAD] chunk insert error:', String(e))
      await supabase.from('knowledge_documents')
        .update({ status: 'error', description: String(e).slice(0, 300) })
        .eq('id', doc.id)
      return Response.json({ error: 'Indicizzazione fallita', detail: String(e) }, { status: 500 })
    }
  }

  // PDF: insert record then fire-and-forget to edge function
  console.log('[KB-UPLOAD] PDF path - inserting doc')
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
    console.log('[KB-UPLOAD] PDF doc insert error:', docErr?.message)
    return Response.json({ error: `Errore DB: ${docErr?.message}` }, { status: 500 })
  }

  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-kb-document`
  const docId = doc.id
  console.log('[KB-UPLOAD] PDF fire-and-forget to edge:', edgeUrl, 'docId:', docId)
  after(async () => {
    await fetch(edgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId }),
    })
  })

  return Response.json({ id: doc.id, status: 'processing', chunks: 0 })
}
