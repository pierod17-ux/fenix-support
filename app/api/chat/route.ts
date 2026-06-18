import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })
}

const SYSTEM_PROMPT = `Sei l'assistente tecnico virtuale di Fenix, specializzato nelle macchine Endosphere per pressoterapia estetica.

Il tuo obiettivo è aiutare l'operatore del centro estetico a risolvere problemi tecnici in modo guidato e chiaro.

## Cosa sai fare
- Diagnosticare problemi comuni: pressione anomala, errori motore, sensori, display, connettività
- Guidare step-by-step nelle procedure di reset, calibrazione e manutenzione ordinaria
- Spiegare i codici di errore e i warning del display
- Suggerire verifiche preliminari (alimentazione, cavi, filtri)

## Come rispondere
- Usa un tono professionale ma cordiale, in italiano
- Fai UNA domanda alla volta per fare diagnosi progressiva
- Dai istruzioni numerata e chiare quando guidi una procedura
- Se chiedi di fare qualcosa di fisico, avvisa di spegnere la macchina se necessario per la sicurezza

## Escalation al tecnico umano
Usa il tool \`escalate_to_technician\` SOLO quando:
1. Il problema non rientra in nessuna delle soluzioni note
2. Hai già provato almeno 2-3 soluzioni senza successo
3. Il problema potrebbe richiedere intervento fisico specializzato (sostituzione componenti, riparazione circuiti)
4. C'è un rischio di sicurezza per l'operatore o il paziente

Quando esegui l'escalation, fornisci un riepilogo chiaro di tutto ciò che è stato tentato.

## Conoscenza di base
${process.env.FENIX_SYSTEM_CONTEXT ?? 'Macchine Endosphere per pressoterapia. Modelli: Endosphere Body (trattamenti corpo), Endosphere Face (viso). Componenti principali: motore brushless, pompa pressione, sensori pressione/temperatura, display LVGL, ESP32-S3.'}
`

// RAG: cerca chunks rilevanti nella knowledge base
async function retrieveContext(query: string): Promise<string> {
  try {
    const supabase = await createServiceClient()

    // Genera embedding della query
    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: query, model: 'text-embedding-3-small' }),
    })

    if (!embRes.ok) return ''

    const embData = await embRes.json()
    const embedding = embData.data[0].embedding

    const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
    })

    if (!chunks?.length) return ''

    return '\n\n## Documentazione tecnica rilevante\n' +
      chunks.map((c: { content: string; title: string }) =>
        `### ${c.title}\n${c.content}`).join('\n\n')
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { messages, ticketId, customerInfo } = await req.json()

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: 'messages required' }, { status: 400 })
  }

  // Recupera contesto RAG dall'ultimo messaggio utente
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const ragContext = lastUserMsg ? await retrieveContext(lastUserMsg.content) : ''

  const systemWithRag = SYSTEM_PROMPT + ragContext

  const stream = await getAnthropic().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemWithRag,
    messages,
    tools: [
      {
        name: 'escalate_to_technician',
        description: 'Esegui l\'escalation al tecnico umano quando il problema non può essere risolto dall\'AI. Crea un ticket di supporto e notifica il tecnico di turno.',
        input_schema: {
          type: 'object' as const,
          properties: {
            subject: {
              type: 'string',
              description: 'Titolo breve del problema (max 80 caratteri)',
            },
            summary: {
              type: 'string',
              description: 'Riepilogo dettagliato: problema, cosa è stato tentato, stato attuale',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Urgenza: urgent=macchina ferma bloccando clienti, high=problema grave, medium=standard, low=informativa',
            },
          },
          required: ['subject', 'summary', 'priority'],
        },
      },
    ],
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      let toolUseBlock: { id: string; name: string; input: Record<string, unknown> } | null = null
      let fullText = ''

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            fullText += event.delta.text
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
            ))
          }
        }

        if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
          toolUseBlock = {
            id: event.content_block.id,
            name: event.content_block.name,
            input: {},
          }
        }

        if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta' && toolUseBlock) {
          // accumulate — Anthropic streams tool input as JSON fragments
        }

        if (event.type === 'message_stop') {
          const finalMsg = await stream.finalMessage()

          // Controlla se c'è un tool use nell'output finale
          const toolUse = finalMsg.content.find(b => b.type === 'tool_use')
          if (toolUse && toolUse.type === 'tool_use' && toolUse.name === 'escalate_to_technician') {
            const input = toolUse.input as { subject: string; summary: string; priority: string }

            // Crea il ticket e invia notifiche
            try {
              const escRes = await fetch(
                `${process.env.NEXT_PUBLIC_APP_URL}/api/escalate`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ticketId,
                    customerInfo,
                    subject: input.subject,
                    aiSummary: input.summary,
                    priority: input.priority,
                  }),
                }
              )
              const escData = await escRes.json()

              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'escalation', ticketId: escData.ticketId })}\n\n`
              ))
            } catch (err) {
              console.error('Escalation failed:', err)
            }
          }
        }
      }

      // Salva messaggio AI nel DB se c'è un ticketId
      if (ticketId && fullText) {
        try {
          const supabase = await createServiceClient()
          await supabase.from('ticket_messages').insert({
            ticket_id: ticketId,
            role: 'assistant',
            content: fullText,
          })
        } catch { /* non bloccare lo stream */ }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
