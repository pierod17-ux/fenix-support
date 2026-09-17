import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { chunkText, htmlToText, insertChunks, isSafeExternalUrl } from '@/lib/knowledge'

export const maxDuration = 30

// Aggiunge (o aggiorna, se documentId è passato) una pagina web come fonte
// extra per la Knowledge Base: stessa indicizzazione dei documenti caricati,
// così l'AI può usarla in RAG anche per supporto sull'uso della macchina
// (manuali online, FAQ, guide) oltre ai PDF/TXT caricati a mano.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, url, documentId } = await req.json()
  if (!title || !url) {
    return Response.json({ error: 'title e url obbligatori' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return Response.json({ error: 'URL non valido' }, { status: 400 })
  }
  if (!isSafeExternalUrl(parsed)) {
    return Response.json({ error: 'URL non consentito: solo indirizzi web pubblici http/https' }, { status: 400 })
  }

  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FenixSupportBot/1.0; +https://fenix-support.netlify.app)' },
    }).finally(() => clearTimeout(timeout))
    if (!res.ok) {
      return Response.json({ error: `La pagina ha risposto con errore ${res.status}` }, { status: 400 })
    }
    html = await res.text()
  } catch (e) {
    return Response.json({ error: `Impossibile scaricare la pagina: ${String(e).slice(0, 200)}` }, { status: 400 })
  }

  const text = htmlToText(html).slice(0, 300_000)
  if (!text.trim()) {
    return Response.json({ error: 'Nessun testo estraibile dalla pagina (potrebbe richiedere JavaScript per caricare il contenuto)' }, { status: 400 })
  }

  const chunks = chunkText(text)
  if (chunks.length === 0) {
    return Response.json({ error: 'Contenuto troppo breve da indicizzare' }, { status: 400 })
  }

  // "Aggiorna": sostituisce i chunk di un link già indicizzato invece di duplicarlo
  let docId: string | undefined = documentId || undefined
  if (docId) {
    const { data: existing, error: updErr } = await supabase
      .from('knowledge_documents')
      .update({ title, description: description || null, source_url: parsed.toString(), status: 'processing' })
      .eq('id', docId)
      .eq('source_type', 'link')
      .select()
      .single()
    if (updErr || !existing) {
      return Response.json({ error: 'Link da aggiornare non trovato' }, { status: 404 })
    }
    await supabase.from('knowledge_chunks').delete().eq('document_id', docId)
  } else {
    const { data: doc, error: docErr } = await supabase
      .from('knowledge_documents')
      .insert({
        title,
        description: description || null,
        source_type: 'link',
        source_url: parsed.toString(),
        file_type: 'link',
        status: 'processing',
        chunk_count: 0,
        uploaded_by: user.id,
      })
      .select()
      .single()
    if (docErr || !doc) {
      return Response.json({ error: `Errore DB: ${docErr?.message}` }, { status: 500 })
    }
    docId = doc.id
  }

  try {
    await insertChunks(supabase, docId!, title, chunks)
    return Response.json({ id: docId, status: 'ready', chunks: chunks.length })
  } catch (e) {
    await supabase.from('knowledge_documents')
      .update({ status: 'error', description: String(e).slice(0, 300) })
      .eq('id', docId!)
    return Response.json({ error: 'Indicizzazione fallita', detail: String(e) }, { status: 500 })
  }
}
