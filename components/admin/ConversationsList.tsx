'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Conversation } from '@/app/admin/conversations/page'

const categoryColor: Record<string, string> = {
  hardware: '#ff3b30', PC: '#0071e3', software: '#34c759', firmware: '#ff9500', meccanica: '#8e8e93',
}
const categoryLabel: Record<string, string> = {
  hardware: 'Hardware', PC: 'PC', software: 'Software', firmware: 'Firmware', meccanica: 'Meccanica',
}

export default function ConversationsList({ initial }: { initial: Conversation[] }) {
  const [items, setItems] = useState<Conversation[]>(initial)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const allSelected = items.length > 0 && selected.size === items.length

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map(i => i.id)))
  }

  async function deleteIds(ids: string[]) {
    if (ids.length === 0) return
    const msg = ids.length === 1
      ? 'Eliminare questa conversazione? L\'operazione è irreversibile.'
      : `Eliminare ${ids.length} conversazioni? L'operazione è irreversibile.`
    if (!confirm(msg)) return

    setDeleting(true)
    const res = await fetch('/api/conversations/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      const set = new Set(ids)
      setItems(prev => prev.filter(i => !set.has(i.id)))
      setSelected(new Set())
    } else {
      const d = await res.json().catch(() => ({}))
      alert(`Eliminazione non riuscita: ${d.error ?? res.status}`)
    }
    setDeleting(false)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
      <style>{`.conv-row:hover { background: var(--surface-2); }`}</style>

      {/* Header */}
      <div style={{
        padding: '24px 24px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,245,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 20,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Conversazioni
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Tutte le chat con l&apos;assistente AI, anche quelle non andate in escalation
        </p>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, minHeight: 36,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={items.length === 0}
              style={{ width: 17, height: 17, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            {selected.size > 0 ? `${selected.size} selezionate` : `${items.length} conversazioni`}
          </label>

          {selected.size > 0 && (
            <button onClick={() => deleteIds([...selected])} disabled={deleting} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, border: 'none',
              cursor: deleting ? 'default' : 'pointer',
              background: 'var(--danger)', color: 'white', fontSize: 13, fontWeight: 600,
              opacity: deleting ? 0.6 : 1,
            }}>
              {deleting ? 'Elimino…' : `Elimina selezionati (${selected.size})`}
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
          {items.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Nessuna conversazione
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Le chat dei clienti appariranno qui
              </p>
            </div>
          ) : items.map((c, i) => {
            const isSel = selected.has(c.id)
            const escalated = !!c.escalated_at
            return (
              <div key={c.id} className="conv-row" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: isSel ? 'var(--accent-light)' : 'transparent',
                transition: 'background 0.12s',
              }}>
                <input type="checkbox" checked={isSel} onChange={() => toggle(c.id)}
                  style={{ width: 17, height: 17, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />

                <Link href={`/admin/tickets/${c.id}`} style={{
                  flex: 1, minWidth: 0, textDecoration: 'none', display: 'block',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.customer_name || 'Cliente'}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                      background: escalated ? 'rgba(255,149,0,0.14)' : 'var(--surface-3)',
                      color: escalated ? '#ff9500' : 'var(--text-tertiary)',
                    }}>
                      {escalated ? 'Ticket' : 'Chat'}
                    </span>
                    {c.problem_category && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                        background: `${categoryColor[c.problem_category] ?? '#8e8e93'}1f`,
                        color: categoryColor[c.problem_category] ?? '#8e8e93',
                      }}>
                        {categoryLabel[c.problem_category] ?? c.problem_category}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                    {[c.center_name, c.machine_model].filter(Boolean).join(' · ') || c.subject || '—'}
                    {` · ${c.message_count} messaggi`}
                  </p>
                </Link>

                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0, width: 92, textAlign: 'right', margin: 0 }}>
                  {format(new Date(c.created_at), 'dd/MM/yy HH:mm', { locale: it })}
                </p>

                <button onClick={() => deleteIds([c.id])} disabled={deleting} title="Elimina"
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: 'none', flexShrink: 0,
                    cursor: deleting ? 'default' : 'pointer',
                    background: 'rgba(255,59,48,0.08)', color: 'var(--danger)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                  }}>×</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
