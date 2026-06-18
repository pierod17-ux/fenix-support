'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClosedTicket {
  id: string
  subject: string
  ai_summary: string | null
  resolved_at: string | null
  machine_model: string | null
}

export default function TicketToKnowledge({ tickets }: { tickets: ClosedTicket[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function addToKB() {
    if (!selected.size) return
    setLoading(true)
    await fetch('/api/knowledge/from-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketIds: [...selected] }),
    })
    setSelected(new Set())
    router.refresh()
    setLoading(false)
  }

  if (!tickets.length) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: 'var(--text-secondary)' }}>
        Nessun ticket risolto da aggiungere. Risolvi i ticket aperti per vederli qui.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {tickets.map(t => (
          <label key={t.id} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
            style={{
              background: selected.has(t.id) ? 'rgba(108,99,255,0.1)' : 'var(--surface-2)',
              border: `1px solid ${selected.has(t.id) ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
            }}>
            <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)}
              className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.subject}</p>
              {t.ai_summary && (
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {t.ai_summary}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t.machine_model ?? 'Macchina n/d'}
              </p>
            </div>
          </label>
        ))}
      </div>

      {selected.size > 0 && (
        <button onClick={addToKB} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: 'var(--success)', color: 'white' }}>
          {loading ? 'Indicizzazione...' : `Aggiungi ${selected.size} ticket alla Knowledge Base`}
        </button>
      )}
    </div>
  )
}
