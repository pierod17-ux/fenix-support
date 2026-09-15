import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { STATO_MACCHINA_TOOL, diagnosticsPrompt, digitsOnly, fetchMachineStatus, isDiagnosticsEnabled } from '@/lib/diagnostics'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder' })
}

// Prezzi claude-sonnet-4-6 per milione di token
const PRICE_INPUT_PER_MTOK = 3.0
const PRICE_OUTPUT_PER_MTOK = 15.0

const BASE_SYSTEM_PROMPT = `Ti chiami **Aura** e sei l'assistente virtuale di Fenix, specializzato nelle macchine per pressoterapia estetica (modelli: Evolution, Essenza, Sensor Smart, Sensor Therapy).

Il tuo obiettivo è aiutare l'operatore del centro estetico a risolvere problemi tecnici in modo guidato e chiaro.

## Lingua (IMPORTANTE)
- Sei MULTILINGUA. Rileva automaticamente la lingua dell'ultimo messaggio dell'utente e rispondi SEMPRE in quella lingua (italiano, inglese, francese, spagnolo, tedesco, ecc.).
- Se l'utente cambia lingua durante la conversazione, adàttati e continua nella nuova lingua.
- Il tuo nome resta sempre "Aura" in ogni lingua.

## Cosa sai fare
- Diagnosticare problemi comuni: pressione anomala, errori motore, sensori, display, connettività
- Guidare step-by-step nelle procedure di reset, calibrazione e manutenzione ordinaria
- Spiegare i codici di errore e i warning del display
- Suggerire verifiche preliminari (alimentazione, cavi, filtri)

## Come rispondere
- Usa un tono professionale ma cordiale
- Fai UNA domanda alla volta per fare diagnosi progressiva
- Dai istruzioni numerate e chiare quando guidi una procedura
- Se chiedi di fare qualcosa di fisico, avvisa di spegnere la macchina se necessario per la sicurezza

## Escalation al tecnico umano
Usa il tool \`escalate_to_technician\` SOLO quando:
1. Il problema non rientra in nessuna delle soluzioni note
2. Hai già provato almeno 2-3 soluzioni senza successo
3. Il problema potrebbe richiedere intervento fisico specializzato (sostituzione componenti, riparazione circuiti)
4. C'è un rischio di sicurezza per l'operatore o il paziente

Quando esegui l'escalation, fornisci un riepilogo chiaro di tutto ciò che è stato tentato.`

interface BehaviorRule { id: string; category: string; text: string }
interface SystemContext { id: string; title: string; content: string }

async function buildSystemPrompt(): Promise<string> {
  try {
    const supabase = await createServiceClient()
    const [{ data: ctxsData }, { data: ctxData }, { data: rulesData }] = await Promise.all([
      supabase.from('ai_config').select('value').eq('key', 'system_contexts').single(),
      supabase.from('ai_config').select('value').eq('key', 'system_context').single(),
      supabase.from('ai_config').select('value').eq('key', 'behavior_rules').single(),
    ])

    // Prefer new multi-section format, fall back to legacy single-text, then built-in default
    let systemContext = 'Macchine Fenix per pressoterapia estetica. Modelli: Evolution, Essenza, Sensor Smart, Sensor Therapy. Componenti tipici: motore brushless, pompa pressione, sensori, display, scheda di controllo.'
    if (ctxsData?.value) {
      const contexts: SystemContext[] = JSON.parse(ctxsData.value)
      if (contexts.length > 0) {
        systemContext = contexts
          .map(c => (c.title ? `### ${c.title}\n${c.content}` : c.content))
          .join('\n\n')
      }
    } else if (ctxData?.value) {
      systemContext = ctxData.value
    }

    let rulesSection = ''
    if (rulesData?.value) {
      const rules: BehaviorRule[] = JSON.parse(rulesData.value)
      if (rules.length > 0) {
        const byCategory: Record<string, string[]> = {}
        for (const r of rules) {
          if (!byCategory[r.category]) byCategory[r.category] = []
          byCategory[r.category].push(r.text)
        }
        const categoryLabels: Record<string, string> = {
          fare: 'Da fare sempre',
          evitare: 'Da evitare',
          limiti: 'Limiti e restrizioni',
          stile: 'Stile di risposta',
        }
        rulesSection = '\n\n## Regole di comportamento\n' +
          Object.entries(byCategory).map(([cat, items]) =>
            `### ${categoryLabels[cat] ?? cat}\n${items.map(i => `- ${i}`).join('\n')}`
          ).join('\n\n')
      }
    }

    return BASE_SYSTEM_PROMPT + rulesSection + '\n\n## Conoscenza di base\n' + systemContext
  } catch {
    return BASE_SYSTEM_PROMPT + '\n\n## Conoscenza di base\n' +
      'Macchine Fenix per pressoterapia. Modelli: Evolution, Essenza, Sensor Smart, Sensor Therapy.'
  }
}

async function retrieveContext(query: string): Promise<string> {
  try {
    const supabase = await createServiceClient()
    const { data: chunks } = await supabase.rpc('match_knowledge_chunks_fts', {
      query_text: query,
      match_count: 5,
    })
    if (!chunks?.length) return ''
    return '\n\n## Documentazione tecnica rilevante\n' +
      chunks.map((c: { content: string; title: string }) => `### ${c.title}\n${c.content}`).join('\n\n')
  } catch {
    return ''
  }
}

async function logUsage(inputTokens: number, outputTokens: number, ticketId?: string) {
  try {
    const costUsd = (inputTokens * PRICE_INPUT_PER_MTOK + outputTokens * PRICE_OUTPUT_PER_MTOK) / 1_000_000
    const supabase = await createServiceClient()
    await supabase.from('ai_usage_log').insert({
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
      ticket_id: ticketId ?? null,
    })
  } catch { /* non bloccare */ }
}

export async function POST(req: NextRequest) {
  const { messages, ticketId, customerInfo } = await req.json()
  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: 'messages required' }, { status: 400 })
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const supabase = await createServiceClient()
  const [systemPrompt, ragContext, diagnosticsOn] = await Promise.all([
    buildSystemPrompt(),
    lastUserMsg ? retrieveContext(lastUserMsg.content) : Promise.resolve(''),
    isDiagnosticsEnabled(supabase),
  ])

  const serialHint = digitsOnly(customerInfo?.machineSerial)
  const system = systemPrompt + ragContext +
    (diagnosticsOn ? diagnosticsPrompt(serialHint, customerInfo?.machineModel ?? null) : '')

  const escalateTool = {
    name: 'escalate_to_technician',
    description: 'Esegui l\'escalation al tecnico umano quando il problema non può essere risolto dall\'AI.',
    input_schema: {
      type: 'object' as const,
      properties: {
        subject: { type: 'string', description: 'Titolo breve del problema (max 80 caratteri)' },
        summary: { type: 'string', description: 'Riepilogo: problema, cosa tentato, stato attuale' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Urgenza' },
        category: {
          type: 'string',
          enum: ['hardware', 'PC', 'software', 'firmware', 'meccanica'],
          description: 'Classifica la tipologia del problema: ' +
            '"hardware" = malfunzionamento delle schede elettroniche (escluso il PC); ' +
            '"PC" = malfunzionamento del computer a bordo della macchina; ' +
            '"software" = problema del sistema operativo o del software del PC; ' +
            '"firmware" = malfunzionamento del firmware delle schede elettroniche; ' +
            '"meccanica" = problema meccanico del prodotto (contenitore, rotture di parti meccaniche, ecc.).',
        },
      },
      required: ['subject', 'summary', 'priority', 'category'],
    },
  }
  // Il tool di diagnostica esiste solo se l'admin ha abilitato la funzione
  const tools = diagnosticsOn ? [escalateTool, STATO_MACCHINA_TOOL] : [escalateTool]

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      let fullText = ''
      // Conversazione che cresce con i turni tool_use → tool_result
      const convo: Anthropic.MessageParam[] = [...messages]
      let diagnosticsCalls = 0

      try {
        // Ciclo agentico: al massimo 4 giri. L'escalation e' terminale (come
        // prima); la diagnostica restituisce un tool_result e il modello continua.
        let prevRoundHadText = false
        for (let round = 0; round < 4; round++) {
          // Se il giro precedente aveva gia' prodotto testo (es. "Controllo subito..."),
          // separa la continuazione: altrimenti le due parti si attaccano.
          if (prevRoundHadText) { fullText += '\n\n'; send({ type: 'text', text: '\n\n' }) }
          const lenBefore = fullText.length
          const stream = getAnthropic().messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system,
            messages: convo,
            tools,
          })

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullText += event.delta.text
              send({ type: 'text', text: event.delta.text })
            }
          }
          const finalMsg = await stream.finalMessage()
          await logUsage(finalMsg.usage.input_tokens, finalMsg.usage.output_tokens, ticketId)
          prevRoundHadText = fullText.length > lenBefore

          const toolUses = finalMsg.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
          )
          if (toolUses.length === 0) break

          const escalate = toolUses.find(t => t.name === 'escalate_to_technician')
          if (escalate) {
            const input = escalate.input as { subject: string; summary: string; priority: string; category?: string }
            try {
              const escRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/escalate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId, customerInfo, subject: input.subject, aiSummary: input.summary, priority: input.priority, category: input.category }),
              })
              const escData = await escRes.json()
              send({ type: 'escalation', ticketId: escData.ticketId, onCall: escData.onCall, onCallCount: escData.onCallCount })
            } catch (err) { console.error('Escalation failed:', err) }
            break
          }

          const results: Anthropic.ToolResultBlockParam[] = []
          for (const tu of toolUses) {
            if (tu.name === 'stato_macchina') {
              diagnosticsCalls++
              send({ type: 'status', text: 'Consulto la diagnostica della macchina…' })
              const input = tu.input as { serial?: string | number }
              const serial = digitsOnly(input.serial) || serialHint
              const result = diagnosticsCalls > 2
                ? { error: 'too_many_calls', note: 'Hai già interrogato la diagnostica: usa i dati che hai.' }
                : await fetchMachineStatus(serial)
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) })
            } else {
              results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify({ error: 'unknown_tool' }), is_error: true })
            }
          }
          convo.push({ role: 'assistant', content: finalMsg.content })
          convo.push({ role: 'user', content: results })
        }
      } catch (err) {
        console.error('[CHAT] stream error:', err)
        send({ type: 'text', text: '\n\nMi scuso, si è verificato un problema tecnico. Riprova tra qualche istante.' })
      }

      if (ticketId && fullText) {
        try {
          await supabase.from('ticket_messages').insert({ ticket_id: ticketId, role: 'assistant', content: fullText })
        } catch { /* non bloccare */ }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
