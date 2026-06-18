import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

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
  if (!res.ok) throw new Error('Embedding API error')
  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticketIds } = await req.json()
  if (!Array.isArray(ticketIds) || !ticketIds.length) {
    return Response.json({ error: 'ticketIds required' }, { status: 400 })
  }

  // Carica ticket con messaggi
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, ai_summary, machine_model, ticket_messages(role, content)')
    .in('id', ticketIds)

  if (!tickets?.length) return Response.json({ error: 'Tickets not found' }, { status: 404 })

  for (const ticket of tickets) {
    // Costruisce testo del ticket
    const messages = (ticket.ticket_messages as { role: string; content: string }[] | null) ?? []
    const conversation = messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'Cliente' : m.role === 'assistant' ? 'AI' : 'Tecnico'}: ${m.content}`)
      .join('\n\n')

    const fullText = `CASO RISOLTO: ${ticket.subject}
Macchina: ${ticket.machine_model ?? 'N/D'}
${ticket.ai_summary ? `\nRiepilogo: ${ticket.ai_summary}` : ''}

CONVERSAZIONE:
${conversation}`

    // Crea documento KB
    const { data: doc } = await supabase
      .from('knowledge_documents')
      .insert({
        title: `[Ticket] ${ticket.subject}`,
        description: `Caso risolto - ${ticket.machine_model ?? 'Endosphere'}`,
        file_type: 'ticket',
        status: 'processing',
        chunk_count: 0,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (!doc) continue

    // Chunking + embedding
    const chunks = chunkText(fullText)
    if (!chunks.length) continue

    const embeddings = await embedTexts(chunks)
    const rows = chunks.map((content, i) => ({
      document_id: doc.id,
      title: `${ticket.subject} (parte ${i + 1})`,
      content,
      embedding: embeddings[i],
    }))

    await supabase.from('knowledge_chunks').insert(rows)
    await supabase
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: chunks.length })
      .eq('id', doc.id)

    // Segna il ticket come aggiunto alla KB
    await supabase
      .from('support_tickets')
      .update({ added_to_kb: true })
      .eq('id', ticket.id)
  }

  return Response.json({ ok: true })
}
