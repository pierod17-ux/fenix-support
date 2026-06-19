'use client'

import { useState, useCallback } from 'react'

interface SystemContext {
  id: string
  title: string
  content: string
}

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function SystemContextsEditor({ initialContexts }: { initialContexts: SystemContext[] }) {
  const [contexts, setContexts] = useState<SystemContext[]>(
    initialContexts.length > 0 ? initialContexts : []
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(
    initialContexts.length === 1 ? initialContexts[0].id : null
  )

  const save = useCallback(async (ctxs: SystemContext[]) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/config/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctxs),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Errore ${res.status}`)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Salvataggio non riuscito')
    } finally {
      setSaving(false)
    }
  }, [])

  function addContext() {
    const id = genId()
    const next = [...contexts, { id, title: '', content: '' }]
    setContexts(next)
    setExpandedId(id)
  }

  function updateContext(id: string, field: 'title' | 'content', value: string) {
    setContexts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  function removeContext(id: string) {
    const next = contexts.filter(c => c.id !== id)
    setContexts(next)
    if (expandedId === id) setExpandedId(next.length > 0 ? next[next.length - 1].id : null)
  }

  const totalChars = contexts.reduce((s, c) => s + c.content.length, 0)

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Contesti di sistema
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Sezioni di conoscenza tecnica che si fondono in un unico contesto per l&apos;AI
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={addContext}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '1.5px dashed var(--border)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Aggiungi sezione
          </button>
          <button
            onClick={() => save(contexts)}
            disabled={saving}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: saved ? 'var(--success)' : saving ? 'var(--surface-3)' : 'var(--accent)',
              color: saved || !saving ? 'white' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600,
              boxShadow: !saving && !saved ? '0 2px 8px rgba(0,113,227,0.25)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {saved ? '✓ Salvato' : saving ? '...' : 'Salva tutto'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px 20px', fontSize: 13, fontWeight: 500,
          color: '#ff3b30', background: 'rgba(255,59,48,0.08)',
          borderBottom: '1px solid var(--border)',
        }}>
          Salvataggio non riuscito: {error}
        </div>
      )}

      {/* Context list */}
      <div style={{ padding: contexts.length > 0 ? '12px 16px' : 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {contexts.length === 0 && (
          <div style={{
            padding: '40px 24px', textAlign: 'center',
            color: 'var(--text-tertiary)', fontSize: 13,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            Nessuna sezione. Clicca &ldquo;Aggiungi sezione&rdquo; per iniziare.
          </div>
        )}

        {contexts.map((ctx, i) => {
          const isOpen = expandedId === ctx.id
          return (
            <div key={ctx.id} style={{
              border: '1.5px solid',
              borderColor: isOpen ? 'var(--accent)' : 'var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
              transition: 'border-color 0.15s',
              background: 'var(--surface-2)',
            }}>
              {/* Section header row */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  cursor: 'pointer', userSelect: 'none',
                }}
                onClick={() => setExpandedId(isOpen ? null : ctx.id)}
              >
                {/* Index badge */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: isOpen ? 'var(--accent)' : 'var(--surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: isOpen ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                  {i + 1}
                </div>

                {/* Title (inline edit when open, click to expand when closed) */}
                {isOpen ? (
                  <input
                    value={ctx.title}
                    onChange={e => updateContext(ctx.id, 'title', e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder="Titolo sezione (es. Modelli macchine)"
                    style={{
                      flex: 1, border: 'none', background: 'transparent', outline: 'none',
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                    }}
                  />
                ) : (
                  <span style={{
                    flex: 1, fontSize: 14, fontWeight: 600,
                    color: ctx.title ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}>
                    {ctx.title || 'Sezione senza titolo'}
                  </span>
                )}

                {/* Char count */}
                {!isOpen && ctx.content.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {ctx.content.length.toLocaleString('it-IT')} car.
                  </span>
                )}

                {/* Chevron */}
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="var(--text-tertiary)" strokeWidth="2.5"
                  style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); removeContext(ctx.id) }}
                  title="Rimuovi sezione"
                  style={{
                    width: 26, height: 26, borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-tertiary)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,59,48,0.1)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#ff3b30'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding: '0 14px 14px' }}>
                  <textarea
                    value={ctx.content}
                    onChange={e => updateContext(ctx.id, 'content', e.target.value)}
                    rows={8}
                    placeholder="Inserisci le informazioni per questa sezione: specifiche tecniche, procedure, codici errore, FAQ..."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      background: 'var(--surface)', border: '1.5px solid var(--border)',
                      color: 'var(--text-primary)', fontSize: 13, lineHeight: '1.7',
                      resize: 'vertical', fontFamily: 'ui-monospace, "SF Mono", monospace',
                      transition: 'border-color 0.15s', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                    {ctx.content.length.toLocaleString('it-IT')} caratteri
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer summary */}
      {contexts.length > 1 && (
        <div style={{
          padding: '10px 20px 16px',
          fontSize: 12, color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border)',
          marginTop: 4,
        }}>
          {contexts.length} sezioni · {totalChars.toLocaleString('it-IT')} caratteri totali · si fondono in un unico blocco &ldquo;Conoscenza di base&rdquo;
        </div>
      )}
    </div>
  )
}
