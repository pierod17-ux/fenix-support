'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant' | 'technician'
  content: string
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

// Salva la sessione di chat nel browser così un reload non la perde.
const STORAGE_KEY = 'fenix-chat-session-v1'

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
  const [directChatActive, setDirectChatActive] = useState(false)
  const [directChatToken, setDirectChatToken] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = createClient()

  // Ripristina la conversazione salvata al caricamento della pagina (post-reload)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s && s.phase === 'chat' && Array.isArray(s.messages) && s.messages.length > 0) {
        if (s.customerInfo) setCustomerInfo(s.customerInfo)
        setMessages(s.messages)
        setTicketId(s.ticketId ?? null)
        setEscalated(!!s.escalated)
        setDirectChatActive(!!s.directChatActive)
        setDirectChatToken(s.directChatToken ?? null)
        setPhase('chat')
      }
    } catch { /* ignore */ }
  }, [])

  // Salva la sessione ad ogni cambiamento mentre la chat è attiva
  useEffect(() => {
    if (typeof window === 'undefined' || phase !== 'chat') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        phase, customerInfo, messages, ticketId, escalated, directChatActive, directChatToken,
      }))
    } catch { /* ignore */ }
  }, [phase, customerInfo, messages, ticketId, escalated, directChatActive, directChatToken])

  function resetChat() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }
    setMessages([])
    setTicketId(null)
    setEscalated(false)
    setDirectChatActive(false)
    setDirectChatToken(null)
    setStreamingText('')
    setInput('')
    setPhase('form')
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Poll for technician messages when direct chat is active
  useEffect(() => {
    if (!directChatActive || !directChatToken) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/direct-chat/${directChatToken}`)
        if (!res.ok) return
        const data = await res.json()
        const techMsgs: { role: string; content: string | null; created_at: string }[] = (data.messages ?? [])
          .filter((m: { role: string }) => m.role === 'technician')
        if (techMsgs.length > 0) {
          setMessages(prev => {
            const existing = new Set(prev.map(m => m.role + '|' + m.content))
            const fresh = techMsgs
              .filter(m => m.content && !existing.has('technician|' + m.content))
              .map(m => ({ role: 'technician' as const, content: m.content! }))
            return fresh.length > 0 ? [...prev, ...fresh] : prev
          })
        }
      } catch { /* ignore */ }
    }
    pollRef.current = setInterval(poll, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [directChatActive, directChatToken])

  async function requestDirectChat() {
    if (!ticketId) return
    try {
      const res = await fetch('/api/direct-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      })
      if (res.ok) {
        const { accessToken } = await res.json()
        setDirectChatToken(accessToken)
        setDirectChatActive(true)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Chat diretta aperta! Il tecnico di turno è stato notificato e si unirà a breve.',
        }])
      }
    } catch { /* ignore */ }
  }

  async function startChat(e: React.FormEvent) {
    e.preventDefault()
    if (!customerInfo.name || !customerInfo.machineModel) return

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

    setMessages([{
      role: 'assistant',
      content: `Ciao **${customerInfo.name}**! Sono l'assistente tecnico Fenix.\n\nSono qui per aiutarti con la tua macchina **${customerInfo.machineModel}**${customerInfo.machineSerial ? ` (S/N: ${customerInfo.machineSerial})` : ''}.\n\nDescrivimi il problema che stai riscontrando.`,
    }])
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

    if (ticketId) {
      await supabase.from('ticket_messages').insert({ ticket_id: ticketId, role: 'user', content: text })
    }

    // In direct chat mode, skip AI — just save the message and wait for tech reply
    if (directChatActive) {
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, ticketId, customerInfo }),
      })

      if (!res.ok || !res.body) throw new Error('Stream error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
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
  }, [messages, loading, ticketId, customerInfo, supabase, directChatActive])

  if (phase === 'form') {
    return (
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 16px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 420, paddingBottom: 32 }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'flex', justifyContent: 'center',
              margin: '0 auto 16px',
              filter: 'drop-shadow(0 4px 16px rgba(0,113,227,0.3))',
            }}>
              <Avatar size={64} radius={18} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
              Assistenza Tecnica
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
              Ciao, sono {ASSISTANT_NAME} — raccontami il problema e ti guido alla soluzione
            </p>
          </div>

          {/* Form card */}
          <form onSubmit={startChat} style={{
            background: 'var(--surface)',
            borderRadius: 20,
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '24px 24px 0' }}>
              <FormField
                label="Il tuo nome"
                required
                value={customerInfo.name}
                onChange={v => setCustomerInfo(p => ({ ...p, name: v }))}
                placeholder="Es. Marco Rossi"
              />
              <FormField
                label="Centro estetico"
                value={customerInfo.centerName}
                onChange={v => setCustomerInfo(p => ({ ...p, centerName: v }))}
                placeholder="Es. Centro Bellezza Milano"
              />

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Modello macchina <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    required
                    value={customerInfo.machineModel}
                    onChange={e => setCustomerInfo(p => ({ ...p, machineModel: e.target.value }))}
                    style={{
                      width: '100%', padding: '11px 36px 11px 14px', borderRadius: 10,
                      background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                      color: customerInfo.machineModel ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontSize: 15, cursor: 'pointer',
                    }}>
                    <option value="">Seleziona modello...</option>
                    {MACHINE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                    width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 5L7 9L11 5" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <FormField
                label="Numero di serie (opzionale)"
                value={customerInfo.machineSerial}
                onChange={v => setCustomerInfo(p => ({ ...p, machineSerial: v }))}
                placeholder="Es. ES-2024-0042"
              />
              <FormField
                label="Email (per aggiornamenti ticket)"
                type="email"
                value={customerInfo.email}
                onChange={v => setCustomerInfo(p => ({ ...p, email: v }))}
                placeholder="mario@esempio.it"
              />
              <FormField
                label="Telefono"
                type="tel"
                value={customerInfo.phone}
                onChange={v => setCustomerInfo(p => ({ ...p, phone: v }))}
                placeholder="+39 333 1234567"
              />
            </div>

            <div style={{ padding: '8px 24px 24px' }}>
              <button
                type="submit"
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: 'var(--accent)', color: 'white',
                  fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                  letterSpacing: '-0.1px',
                  boxShadow: '0 2px 8px rgba(0,113,227,0.35)',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Inizia la chat con l&apos;assistente →
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
                🔒 I tuoi dati sono protetti e usati solo per l&apos;assistenza
              </p>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Ticket bar */}
      <div style={{
        padding: '6px 16px', background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {customerInfo.name} · {customerInfo.machineModel}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {ticketId && (
            <span style={{
              fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              color: 'var(--accent)', background: 'var(--accent-light)',
              padding: '2px 8px', borderRadius: 6,
            }}>
              #{ticketId.slice(0, 8).toUpperCase()}
            </span>
          )}
          <button
            onClick={() => {
              if (confirm('Vuoi iniziare una nuova richiesta? La conversazione attuale verrà chiusa.')) resetChat()
            }}
            title="Nuova richiesta"
            style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
              background: 'transparent', border: '1px solid var(--border)',
              padding: '3px 9px', borderRadius: 6, cursor: 'pointer',
            }}
          >
            Nuova
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <Bubble key={i} role={msg.role} content={msg.content} />
        ))}

        {streamingText && <Bubble role="assistant" content={streamingText} streaming />}

        {loading && !streamingText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar />
            <div style={{
              display: 'flex', gap: 5, alignItems: 'center',
              padding: '12px 16px', borderRadius: 18, borderBottomLeftRadius: 4,
              background: 'var(--surface)', boxShadow: 'var(--shadow-sm)',
            }}>
              {[0, 150, 300].map(delay => (
                <span key={delay} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--text-tertiary)',
                  display: 'inline-block',
                  animation: 'bounce 1.2s infinite',
                  animationDelay: `${delay}ms`,
                }} />
              ))}
            </div>
          </div>
        )}

        {escalated && (
          <EscalationCard
            ticketId={ticketId}
            onRequestChat={requestDirectChat}
            directChatActive={directChatActive}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — hidden after escalation unless direct chat is active */}
      {(!escalated || directChatActive) && (
        <div style={{
          flexShrink: 0,
          padding: '10px 12px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-end', gap: 8,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
            }}
            placeholder="Descrivi il problema..."
            disabled={loading}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 22,
              background: 'var(--surface-2)', border: '1.5px solid var(--border)',
              color: 'var(--text-primary)', fontSize: 15, lineHeight: '1.4',
              resize: 'none', overflow: 'hidden', minHeight: 42, maxHeight: 120,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none',
              background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface-3)',
              color: 'white', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s, transform 0.1s',
              boxShadow: input.trim() && !loading ? '0 2px 6px rgba(0,113,227,0.4)' : 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.5 1.5L14.5 8L2.5 14.5V9.5L10.5 8L2.5 6.5V1.5Z"/>
            </svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// Nome e volto dell'assistente virtuale mostrati in chat.
// Per cambiare il volto: sostituisci public/operatrice.jpg
// Per cambiare il nome: modifica ASSISTANT_NAME qui sotto.
const ASSISTANT_NAME = 'Giulia'
const ASSISTANT_AVATAR = '/avatar.png'

function Avatar({ size = 30, radius = 10 }: { size?: number; radius?: number }) {
  const [failed, setFailed] = useState(false)
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, alignSelf: 'flex-end', marginBottom: 2, overflow: 'hidden',
      fontSize: Math.round(size * 0.42), fontWeight: 700, color: 'white',
    }}>
      {failed ? (
        ASSISTANT_NAME.charAt(0)
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ASSISTANT_AVATAR}
          alt={ASSISTANT_NAME}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}

function Bubble({ role, content, streaming }: { role: string; content: string; streaming?: boolean }) {
  const isUser = role === 'user'
  const isTech = role === 'technician'

  const html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
    + (streaming ? '<span style="display:inline-block;width:2px;height:14px;background:currentColor;margin-left:2px;vertical-align:text-bottom;animation:blink 1s infinite"></span>' : '')

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '80%', padding: '10px 14px',
            borderRadius: 18, borderBottomRightRadius: 4,
            background: 'var(--accent)', color: 'white',
            fontSize: 15, lineHeight: 1.5,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    )
  }

  if (isTech) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 10,
          background: 'linear-gradient(135deg, #34c759 0%, #30d158 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, alignSelf: 'flex-end', marginBottom: 2,
          fontSize: 11, fontWeight: 700, color: 'white',
        }}>
          T
        </div>
        <div>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3, paddingLeft: 2 }}>Tecnico</p>
          <div
            style={{
              maxWidth: '80%', padding: '10px 14px',
              borderRadius: 18, borderBottomLeftRadius: 4,
              background: 'rgba(52,199,89,0.1)', color: 'var(--text-primary)',
              fontSize: 15, lineHeight: 1.5,
              border: '1px solid rgba(52,199,89,0.2)',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <Avatar />
      <div>
        <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3, paddingLeft: 2 }}>
          {ASSISTANT_NAME} · Assistenza
        </p>
        <div
          style={{
            maxWidth: '80%', padding: '10px 14px',
            borderRadius: 18, borderBottomLeftRadius: 4,
            background: 'var(--surface)', color: 'var(--text-primary)',
            fontSize: 15, lineHeight: 1.5,
            boxShadow: 'var(--shadow-sm)',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}

function EscalationCard({
  ticketId, onRequestChat, directChatActive,
}: {
  ticketId: string | null
  onRequestChat: () => void
  directChatActive: boolean
}) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 16,
      padding: 20, textAlign: 'center',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border)',
      margin: '8px 0',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'rgba(0,113,227,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      </div>
      <h3 style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>
        Tecnico notificato
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
        Il tecnico di turno è stato avvisato e ti ricontatterà al più presto.
      </p>
      {ticketId && (
        <span style={{
          fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
          color: 'var(--accent)', background: 'var(--accent-light)',
          padding: '4px 10px', borderRadius: 8,
        }}>
          Ticket #{ticketId.slice(0, 8).toUpperCase()}
        </span>
      )}
      {!directChatActive && (
        <div style={{ marginTop: 16 }}>
          <button onClick={onRequestChat} style={{
            padding: '10px 22px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: 'white',
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
          }}>
            Apri chat diretta con il tecnico
          </button>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
            Il tecnico riceverà un link per connettersi alla chat
          </p>
        </div>
      )}
      {directChatActive && (
        <div style={{
          marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34c759' }} />
          <span style={{ fontSize: 13, color: '#34c759', fontWeight: 500 }}>Chat diretta attiva</span>
        </div>
      )}
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 10,
          background: 'var(--surface-2)', border: '1.5px solid var(--border)',
          color: 'var(--text-primary)', fontSize: 15,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}
