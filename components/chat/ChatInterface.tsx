'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  id?: string
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  centerName: string
  machineModel: string
  machineSerial: string
}

const MACHINE_MODELS = [
  'Endosphere Body',
  'Endosphere Face',
  'Endosphere Body & Face',
  'Altro',
]

export default function ChatInterface() {
  const [phase, setPhase] = useState<'form' | 'chat'>('form')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '', email: '', phone: '', centerName: '', machineModel: '', machineSerial: '',
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [escalated, setEscalated] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function startChat(e: React.FormEvent) {
    e.preventDefault()
    if (!customerInfo.name || !customerInfo.machineModel) return

    // Crea il ticket nel DB
    const { data: ticket } = await supabase
      .from('support_tickets')
      .insert({
        status: 'open',
        priority: 'medium',
        subject: 'Richiesta assistenza tecnica',
        customer_name: customerInfo.name,
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phone || null,
        machine_model: customerInfo.machineModel,
        machine_serial: customerInfo.machineSerial || null,
        center_name: customerInfo.centerName || null,
      })
      .select()
      .single()

    if (ticket) setTicketId(ticket.id)

    const welcome: Message = {
      role: 'assistant',
      content: `Ciao **${customerInfo.name}**! Sono l'assistente tecnico Fenix.\n\nSono qui per aiutarti con la tua macchina **${customerInfo.machineModel}**${customerInfo.machineSerial ? ` (S/N: ${customerInfo.machineSerial})` : ''}.\n\nDescrivimi il problema che stai riscontrando: cosa succede esattamente?`,
    }
    setMessages([welcome])
    setPhase('chat')
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreamingText('')

    // Salva messaggio utente nel DB
    if (ticketId) {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        role: 'user',
        content: text,
      })
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role === 'system' ? 'assistant' : m.role, content: m.content })),
          ticketId,
          customerInfo,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text') {
              accText += parsed.text
              setStreamingText(accText)
            } else if (parsed.type === 'escalation') {
              if (parsed.ticketId) setTicketId(parsed.ticketId)
              setEscalated(true)
            }
          } catch { /* partial JSON */ }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: accText }])
      setStreamingText('')
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Si è verificato un errore di connessione. Riprova tra qualche istante.',
      }])
      setStreamingText('')
    } finally {
      setLoading(false)
    }
  }, [messages, loading, ticketId, customerInfo, supabase])

  if (phase === 'form') {
    return (
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Avvia assistenza tecnica</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Inserisci i tuoi dati per iniziare la chat con l&apos;assistente AI
              </p>
            </div>

            <form onSubmit={startChat} className="p-6 space-y-4">
              <Field label="Il tuo nome *" required
                value={customerInfo.name}
                onChange={v => setCustomerInfo(p => ({ ...p, name: v }))}
                placeholder="Es. Marco Rossi" />

              <Field label="Centro estetico"
                value={customerInfo.centerName}
                onChange={v => setCustomerInfo(p => ({ ...p, centerName: v }))}
                placeholder="Es. Centro Bellezza Milano" />

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Modello macchina *
                </label>
                <select
                  required
                  value={customerInfo.machineModel}
                  onChange={e => setCustomerInfo(p => ({ ...p, machineModel: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: customerInfo.machineModel ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}>
                  <option value="">Seleziona modello...</option>
                  {MACHINE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <Field label="Numero di serie (opzionale)"
                value={customerInfo.machineSerial}
                onChange={v => setCustomerInfo(p => ({ ...p, machineSerial: v }))}
                placeholder="Es. ES-2024-0042" />

              <Field label="Email (per aggiornamenti ticket)"
                type="email"
                value={customerInfo.email}
                onChange={v => setCustomerInfo(p => ({ ...p, email: v }))}
                placeholder="marco@esempio.it" />

              <Field label="Telefono"
                type="tel"
                value={customerInfo.phone}
                onChange={v => setCustomerInfo(p => ({ ...p, phone: v }))}
                placeholder="+39 333 1234567" />

              <button type="submit"
                className="w-full py-3 rounded-xl text-sm font-semibold mt-2 transition-all hover:opacity-90"
                style={{ background: 'var(--accent)', color: 'white' }}>
                Inizia chat con l&apos;assistente →
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 57px)' }}>
      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {streamingText && (
          <MessageBubble role="assistant" content={streamingText} streaming />
        )}

        {loading && !streamingText && (
          <div className="flex gap-2 items-center px-4 py-3 rounded-2xl max-w-xs"
            style={{ background: 'var(--surface-2)' }}>
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '300ms' }} />
          </div>
        )}

        {escalated && (
          <EscalationCard ticketId={ticketId} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!escalated && (
        <div className="flex-shrink-0 px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Descrivi il problema..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface-3)',
                color: 'white',
              }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 8L14 2L10 8L14 14L2 8Z"/>
              </svg>
            </button>
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--text-secondary)' }}>
            Ticket #{ticketId?.slice(0, 8).toUpperCase() ?? '—'}
          </p>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  )
}

function MessageBubble({ role, content, streaming }: { role: string; content: string; streaming?: boolean }) {
  const isUser = role === 'user'

  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-0.5 flex-shrink-0"
          style={{ background: 'var(--accent)' }}>
          <svg width="12" height="12" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5"/>
            <path d="M10 16 L14 20 L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div
        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--surface-2)',
          color: isUser ? 'white' : 'var(--text-primary)',
          borderBottomRightRadius: isUser ? '4px' : '16px',
          borderBottomLeftRadius: isUser ? '16px' : '4px',
        }}
        dangerouslySetInnerHTML={{ __html: formatted + (streaming ? '<span class="animate-pulse">▋</span>' : '') }}
      />
    </div>
  )
}

function EscalationCard({ ticketId }: { ticketId: string | null }) {
  return (
    <div className="rounded-2xl p-4 mx-auto max-w-sm text-center"
      style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)' }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ background: 'rgba(108,99,255,0.2)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      </div>
      <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Tecnico notificato</h3>
      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
        Il tecnico di turno è stato avvisato via WhatsApp ed email e ti ricontatterà al più presto.
      </p>
      {ticketId && (
        <p className="text-xs font-mono px-3 py-1 rounded-lg inline-block"
          style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
          Ticket #{ticketId.slice(0, 8).toUpperCase()}
        </p>
      )}
    </div>
  )
}
