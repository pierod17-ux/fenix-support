'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const transitions: Record<string, { label: string; next: string }[]> = {
  open: [{ label: 'Prendi in carico', next: 'in_progress' }],
  in_progress: [
    { label: 'Segna come risolto', next: 'resolved' },
    { label: 'Riapri', next: 'open' },
  ],
  resolved: [{ label: 'Chiudi ticket', next: 'closed' }, { label: 'Riapri', next: 'open' }],
  closed: [{ label: 'Riapri', next: 'open' }],
}

export default function TicketActions({ ticketId, currentStatus }: { ticketId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(next: string) {
    setLoading(true)
    await supabase
      .from('support_tickets')
      .update({
        status: next,
        ...(next === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
      })
      .eq('id', ticketId)
    router.refresh()
    setLoading(false)
  }

  const actions = transitions[currentStatus] ?? []

  return (
    <div className="flex gap-2 flex-shrink-0">
      {actions.map(action => (
        <button key={action.next} onClick={() => updateStatus(action.next)} disabled={loading}
          className="px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90"
          style={{
            background: action.next === 'resolved' || action.next === 'closed' ? 'var(--success)' :
              action.next === 'in_progress' ? 'var(--accent)' : 'var(--surface-3)',
            color: action.next === 'open' ? 'var(--text-secondary)' : 'white',
          }}>
          {loading ? '...' : action.label}
        </button>
      ))}
    </div>
  )
}
