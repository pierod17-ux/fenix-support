'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

export type AdminTicket = {
  id: string
  subject: string | null
  customer_name: string | null
  center_name: string | null
  machine_model: string | null
  status: string
  priority: string
  problem_category: string | null
  created_at: string
  assignee?: { display_name: string | null } | null
}

const statusLabel: Record<string, string> = {
  open: 'Aperto', in_progress: 'In gestione', resolved: 'Risolto', closed: 'Chiuso',
}
const statusColor: Record<string, { bg: string; text: string }> = {
  open:        { bg: 'rgba(255,59,48,0.10)',   text: '#ff3b30' },
  in_progress: { bg: 'rgba(255,149,0,0.12)',   text: '#ff9500' },
  resolved:    { bg: 'rgba(52,199,89,0.12)',   text: '#34c759' },
  closed:      { bg: 'rgba(110,110,115,0.12)', text: '#6e6e73' },
}
const priorityColor: Record<string, string> = {
  urgent: '#ff3b30', high: '#ff9500', medium: '#3b82f6', low: '#aeaeb2',
}
const categoryColor: Record<string, string> = {
  hardware: '#ff3b30', PC: '#0071e3', software: '#34c759', firmware: '#ff9500', meccanica: '#8e8e93',
}
const categoryLabel: Record<string, string> = {
  hardware: 'Hardware', PC: 'PC', software: 'Software', firmware: 'Firmware', meccanica: 'Meccanica',
}

export default function TicketsBoard({ tickets: initial }: { tickets: AdminTicket[] }) {
  const router = useRouter()
  const [tickets, setTickets] = useState<AdminTicket[]>(initial)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [allExpanded, setAllExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tickets
    return tickets.filter(t =>
      [t.subject, t.customer_name, t.center_name, t.machine_model, categoryLabel[t.problem_category ?? ''] ?? t.problem_category]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [tickets, query])

  const openTickets = filtered.filter(t => t.status === 'open' || t.status === 'in_progress')

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function deleteIds(ids: string[]) {
    if (ids.length === 0) return
    const msg = ids.length === 1
      ? 'Eliminare questo ticket? L\'operazione è irreversibile.'
      : `Eliminare ${ids.length} ticket? L'operazione è irreversibile.`
    if (!confirm(msg)) return

    setDeleting(true)
    const res = await fetch('/api/conversations/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      const set = new Set(ids)
      setTickets(prev => prev.filter(t => !set.has(t.id)))
      setSelected(new Set())
      router.refresh() // aggiorna i KPI lato server
    } else {
      const d = await res.json().catch(() => ({}))
      alert(`Eliminazione non riuscita: ${d.error ?? res.status}`)
    }
    setDeleting(false)
  }

  function Row({ t }: { t: AdminTicket }) {
    const isSel = selected.has(t.id)
    const sc = statusColor[t.status] ?? { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
    return (
      <div className="tkt-row" style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: isSel ? 'var(--accent-light)' : 'transparent',
        transition: 'background 0.12s',
      }}>
        <input type="checkbox" checked={isSel} onChange={() => toggle(t.id)}
          style={{ width: 17, height: 17, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: priorityColor[t.priority] ?? 'var(--border)' }} />
        <Link href={`/admin/tickets/${t.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.subject || 'Richiesta assistenza'}
            </span>
            {t.problem_category && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                background: `${categoryColor[t.problem_category] ?? '#8e8e93'}1f`,
                color: categoryColor[t.problem_category] ?? '#8e8e93',
              }}>
                {categoryLabel[t.problem_category] ?? t.problem_category}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {[t.customer_name, t.center_name, t.machine_model].filter(Boolean).join(' · ') || '—'}
          </p>
        </Link>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text, flexShrink: 0 }}>
          {statusLabel[t.status] ?? t.status}
        </span>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0, width: 84, textAlign: 'right', margin: 0 }}>
          {format(new Date(t.created_at), 'dd/MM HH:mm')}
        </p>
        <button onClick={() => deleteIds([t.id])} disabled={deleting} title="Elimina" style={{
          width: 28, height: 28, borderRadius: 8, border: 'none', flexShrink: 0,
          cursor: deleting ? 'default' : 'pointer',
          background: 'rgba(255,59,48,0.08)', color: 'var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}>×</button>
      </div>
    )
  }

  function EmptyState({ text }: { text: string }) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{text}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`.tkt-row:hover { background: var(--surface-2); } .tkt-row + .tkt-row { border-top: 1px solid var(--border); }`}</style>

      {/* Search + bulk actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cerca per cliente, centro, macchina, oggetto…"
          style={{
            flex: '1 1 240px', padding: '9px 14px', borderRadius: 12, fontSize: 13,
            background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
          }}
        />
        {selected.size > 0 && (
          <button onClick={() => deleteIds([...selected])} disabled={deleting} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: 'none',
            cursor: deleting ? 'default' : 'pointer', background: 'var(--danger)', color: 'white',
            fontSize: 13, fontWeight: 600, opacity: deleting ? 0.6 : 1, flexShrink: 0,
          }}>
            {deleting ? 'Elimino…' : `Elimina selezionati (${selected.size})`}
          </button>
        )}
      </div>

      {/* Card: Ticket aperti */}
      <div style={{ background: 'var(--surface)', borderRadius: 18, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: openTickets.length ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Ticket aperti</h2>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{openTickets.length}</span>
        </div>
        {openTickets.length === 0
          ? <EmptyState text={query ? 'Nessun risultato' : 'Nessun ticket aperto'} />
          : openTickets.map(t => <Row key={t.id} t={t} />)}
      </div>

      {/* Card: Tutti i ticket (collassabile) */}
      <div style={{ background: 'var(--surface)', borderRadius: 18, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <button onClick={() => setAllExpanded(v => !v)} style={{
          width: '100%', padding: '16px 20px', border: 'none', cursor: 'pointer', background: 'transparent',
          borderBottom: allExpanded && filtered.length ? '1px solid var(--border)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block', transition: 'transform 0.18s', transform: allExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: 'var(--text-tertiary)', fontSize: 12,
            }}>▶</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Tutti i ticket</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{filtered.length}</span>
        </button>
        {allExpanded && (
          filtered.length === 0
            ? <EmptyState text={query ? 'Nessun risultato' : 'Nessun ticket'} />
            : <div>{filtered.map(t => <Row key={t.id} t={t} />)}</div>
        )}
      </div>
    </div>
  )
}
