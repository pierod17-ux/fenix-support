'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  id: string
  role: string
  content: string | null
  media_url: string | null
  media_type: string | null
  created_at: string
}

interface Ticket {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  machine_model: string | null
  machine_serial: string | null
  center_name: string | null
  subject: string
  ai_summary: string | null
  priority: string
}

interface Chat {
  id: string
  ticket_id: string
  status: string
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#ff3b30', high: '#ff9500', medium: '#3b82f6', low: '#aeaeb2',
}
const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Bassa',
}

export default function TechChatClient({
  token,
  chat,
  ticket,
  technicianName,
  initialMessages,
}: {
  token: string
  chat: Chat
  ticket: Ticket | null
  technicianName: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [closed] = useState(chat.status !== 'active')
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const lastIdRef = useRef<string>(initialMessages[initialMessages.length - 1]?.id ?? '')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages every 5 seconds
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/direct-chat/${token}`)
      if (!res.ok) return
      const data = await res.json()
      const newMsgs: Message[] = data.messages ?? []
      const lastId = lastIdRef.current
      const fresh = lastId ? newMsgs.filter(m => m.created_at > (newMsgs.find(x => x.id === lastId)?.created_at ?? '')) : newMsgs
      if (fresh.length > 0) {
        setMessages(newMsgs)
        lastIdRef.current = newMsgs[newMsgs.length - 1]?.id ?? lastId
      }
    } catch { /* ignore */ }
  }, [token])

  useEffect(() => {
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [poll])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending || closed) return
    setSending(true)
    const res = await fetch(`/api/direct-chat/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
      lastIdRef.current = msg.id
      setInput('')
    }
    setSending(false)
  }

  async function uploadFile(file: File) {
    if (!file || uploading || closed) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(`/api/direct-chat/${token}/upload`, { method: 'POST', body: fd })
      if (!res.ok) { setUploading(false); return }
      const { url, mediaType } = await res.json()
      const msgRes = await fetch(`/api/direct-chat/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_url: url, media_type: mediaType }),
      })
      if (msgRes.ok) {
        const msg = await msgRes.json()
        setMessages(prev => [...prev, msg])
        lastIdRef.current = msg.id
      }
    } catch { /* ignore */ }
    setUploading(false)
  }

  const initials = technicianName.charAt(0).toUpperCase()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,245,247,0.92)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        padding: '14px 20px',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: 'white',
          }}>
            {initials}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>{technicianName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: closed ? '#aeaeb2' : '#34c759',
              }} />
              <p style={{ fontSize: 12, color: '#6e6e73', margin: 0 }}>
                {closed ? 'Chat chiusa' : 'Chat diretta attiva'}
              </p>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <p style={{ fontSize: 11, color: '#aeaeb2', textAlign: 'right', margin: 0 }}>Portale Fenix</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 680, margin: '0 auto', width: '100%', padding: '20px 16px' }}>
        {/* Ticket card */}
        {ticket && (
          <div style={{
            background: 'white', borderRadius: 18, padding: 20, marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  Dettagli cliente
                </p>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f' }}>{ticket.customer_name}</p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                background: PRIORITY_COLOR[ticket.priority] ? PRIORITY_COLOR[ticket.priority] + '1a' : '#f5f5f7',
                color: PRIORITY_COLOR[ticket.priority] ?? '#6e6e73',
              }}>
                {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ticket.center_name && <InfoRow label="Centro" value={ticket.center_name} />}
              {ticket.machine_model && (
                <InfoRow label="Macchina" value={[ticket.machine_model, ticket.machine_serial].filter(Boolean).join(' — ')} />
              )}
              {ticket.customer_email && <InfoRow label="Email" value={ticket.customer_email} href={`mailto:${ticket.customer_email}`} />}
              {ticket.customer_phone && <InfoRow label="Tel" value={ticket.customer_phone} href={`tel:${ticket.customer_phone}`} />}
              <InfoRow label="Problema" value={ticket.subject} />
            </div>

            {ticket.ai_summary && (
              <div style={{
                marginTop: 14, padding: '12px 14px', borderRadius: 12,
                background: '#f0f7ff', borderLeft: '3px solid #0071e3',
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#0071e3', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Riepilogo AI
                </p>
                <p style={{ fontSize: 13, color: '#1d1d1f', lineHeight: 1.5, margin: 0 }}>{ticket.ai_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {messages.filter(m => m.role !== 'system').map(msg => (
            <ChatBubble key={msg.id} msg={msg} technicianName={technicianName} />
          ))}
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              color: '#aeaeb2', fontSize: 14,
            }}>
              Nessun messaggio ancora. Inizia la chat!
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'rgba(245,245,247,0.95)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        {closed ? (
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#aeaeb2', margin: 0 }}>Chat chiusa — non è possibile inviare nuovi messaggi</p>
          </div>
        ) : (
          <form onSubmit={sendMessage} style={{
            maxWidth: 680, margin: '0 auto',
            display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            {/* Media upload button */}
            <button type="button" onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
              {uploading ? (
                <span style={{ fontSize: 12, color: '#aeaeb2' }}>...</span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6e6e73" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }} />

            <textarea value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent) } }}
              placeholder="Rispondi al cliente..."
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 14, resize: 'none',
                background: 'white', border: '1.5px solid rgba(0,0,0,0.1)',
                color: '#1d1d1f', fontSize: 15, lineHeight: 1.4,
                overflow: 'hidden', minHeight: 42, maxHeight: 120,
                outline: 'none',
              }}
              onFocus={e => (e.target.style.borderColor = '#0071e3')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
            />

            <button type="submit" disabled={sending || !input.trim()} style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: input.trim() && !sending ? '#0071e3' : '#d1d1d6',
              cursor: input.trim() && !sending ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: input.trim() ? '0 2px 8px rgba(0,113,227,0.4)' : 'none',
              transition: 'all 0.15s',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M2.5 1.5L14.5 8L2.5 14.5V9.5L10.5 8L2.5 6.5V1.5Z"/>
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span style={{ fontSize: 12, color: '#aeaeb2', minWidth: 60, flexShrink: 0 }}>{label}</span>
      {href ? (
        <a href={href} style={{ fontSize: 13, color: '#0071e3', textDecoration: 'none' }}>{value}</a>
      ) : (
        <span style={{ fontSize: 13, color: '#1d1d1f' }}>{value}</span>
      )}
    </div>
  )
}

function ChatBubble({ msg, technicianName }: { msg: Message; technicianName: string }) {
  const isTech = msg.role === 'technician'
  const isUser = msg.role === 'user'

  const time = new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', justifyContent: isTech ? 'flex-end' : 'flex-start', gap: 8 }}>
      {!isTech && (
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0, alignSelf: 'flex-end',
          background: isUser ? '#e5e5ea' : 'linear-gradient(135deg, #0071e3, #00a2ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: isUser ? '#1d1d1f' : 'white',
        }}>
          {isUser ? 'C' : 'AI'}
        </div>
      )}
      <div style={{ maxWidth: '75%' }}>
        {!isTech && (
          <p style={{ fontSize: 11, color: '#aeaeb2', marginBottom: 4, paddingLeft: 2 }}>
            {isUser ? 'Cliente' : 'AI'} · {time}
          </p>
        )}
        <div style={{
          padding: msg.media_url ? 6 : '10px 14px',
          borderRadius: 16,
          borderBottomRightRadius: isTech ? 4 : 16,
          borderBottomLeftRadius: isTech ? 16 : 4,
          background: isTech ? '#0071e3' : 'white',
          color: isTech ? 'white' : '#1d1d1f',
          fontSize: 15, lineHeight: 1.5,
          boxShadow: isTech ? '0 2px 6px rgba(0,113,227,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          {msg.media_url && (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: msg.content ? 8 : 0 }}>
              {msg.media_type === 'video' ? (
                <video controls style={{ maxWidth: '100%', maxHeight: 240, display: 'block' }}>
                  <source src={msg.media_url} />
                </video>
              ) : (
                <a href={msg.media_url} target="_blank" rel="noreferrer">
                  <img src={msg.media_url} alt="" style={{ maxWidth: '100%', maxHeight: 240, display: 'block' }} />
                </a>
              )}
            </div>
          )}
          {msg.content && <span>{msg.content}</span>}
        </div>
        {isTech && (
          <p style={{ fontSize: 11, color: '#aeaeb2', marginTop: 4, textAlign: 'right', paddingRight: 2 }}>
            {technicianName} · {time}
          </p>
        )}
      </div>
    </div>
  )
}
