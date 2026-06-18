'use client'

import { useState } from 'react'

export default function PromptEditor({ currentValue }: { currentValue: string }) {
  const [value, setValue] = useState(currentValue)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    await fetch('/api/config/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Contesto tecnico di sistema
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Informazioni che l&apos;AI conosce sempre: modelli macchine, specifiche, procedure standard
          </p>
        </div>
        <button onClick={save} disabled={loading} style={{
          padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: saved ? 'var(--success)' : loading ? 'var(--surface-3)' : 'var(--accent)',
          color: saved || !loading ? 'white' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: 600, flexShrink: 0,
          boxShadow: !loading && !saved ? '0 2px 8px rgba(0,113,227,0.25)' : 'none',
          transition: 'all 0.2s',
        }}>
          {saved ? '✓ Salvato' : loading ? '...' : 'Salva'}
        </button>
      </div>
      <div style={{ padding: 20 }}>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={10}
          placeholder="Inserisci le informazioni tecniche che l'AI deve sempre conoscere: specifiche macchine, procedure di reset, codici errore, FAQ comuni..."
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12,
            background: 'var(--surface-2)', border: '1.5px solid var(--border)',
            color: 'var(--text-primary)', fontSize: 13, lineHeight: '1.7',
            resize: 'vertical', fontFamily: 'ui-monospace, "SF Mono", monospace',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
          {value.length.toLocaleString('it-IT')} caratteri · Aggiunto al system prompt di ogni conversazione
        </p>
      </div>
    </div>
  )
}
