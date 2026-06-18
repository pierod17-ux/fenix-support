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
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Contesto di sistema AI</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Informazioni tecniche aggiuntive che l&apos;AI conosce sempre (modelli, specifiche, procedure standard)
          </p>
        </div>
        <button onClick={save} disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{
            background: saved ? 'var(--success)' : 'var(--accent)',
            color: 'white',
          }}>
          {saved ? 'Salvato ✓' : loading ? '...' : 'Salva'}
        </button>
      </div>
      <div className="p-5">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={10}
          placeholder="Inserisci qui le informazioni tecniche che l'AI deve conoscere: specifiche macchine, procedure di reset, codici errore, FAQ comuni..."
          className="w-full px-3 py-3 rounded-xl text-sm font-mono resize-y"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            lineHeight: '1.6',
          }}
        />
        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          {value.length} caratteri · Questo testo viene aggiunto al system prompt di ogni conversazione
        </p>
      </div>
    </div>
  )
}
