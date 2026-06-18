'use client'

import { useState } from 'react'

interface CostData {
  currentMonthCost: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  callCount: number
  limit: number
}

export default function AICostTracker({ data }: { data: CostData }) {
  const [limit, setLimit] = useState(data.limit)
  const [editLimit, setEditLimit] = useState(false)
  const [newLimit, setNewLimit] = useState(String(data.limit))
  const [saving, setSaving] = useState(false)

  const pct = limit > 0 ? Math.min((data.currentMonthCost / limit) * 100, 100) : 0
  const remaining = Math.max(limit - data.currentMonthCost, 0)
  const isWarning = pct > 80
  const isDanger = pct > 95

  const barColor = isDanger ? '#ff3b30' : isWarning ? '#ff9500' : '#34c759'

  async function saveLimit() {
    const val = parseFloat(newLimit)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    await fetch('/api/config/cost-limit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: val }),
    })
    setLimit(val)
    setEditLimit(false)
    setSaving(false)
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Costi AI</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Mese corrente · claude-sonnet-4-6
          </p>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: 20,
          background: isDanger ? 'rgba(255,59,48,0.1)' : isWarning ? 'rgba(255,149,0,0.1)' : 'rgba(52,199,89,0.1)',
          color: isDanger ? '#ff3b30' : isWarning ? '#ff9500' : '#34c759',
          fontSize: 12, fontWeight: 600,
        }}>
          {isDanger ? '⚠ Limite raggiunto' : isWarning ? '⚠ Vicino al limite' : '✓ Nella norma'}
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Spesa principale */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              ${data.currentMonthCost.toFixed(4)}
            </span>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              / ${limit.toFixed(2)} limite
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden', marginBottom: 4 }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${pct}%`,
              background: barColor,
              transition: 'width 0.4s ease, background 0.3s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)' }}>
            <span>{pct.toFixed(1)}% utilizzato</span>
            <span>Rimanente: ${remaining.toFixed(4)}</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Conversazioni', value: data.callCount.toLocaleString('it-IT') },
            { label: 'Token input', value: (data.inputTokens / 1000).toFixed(1) + 'K' },
            { label: 'Token output', value: (data.outputTokens / 1000).toFixed(1) + 'K' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 12px', borderRadius: 12,
              background: 'var(--surface-2)',
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Limit editor */}
        {editLimit ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Limite mensile $</span>
            <input
              type="number" step="0.5" min="0.5" value={newLimit}
              onChange={e => setNewLimit(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveLimit()}
              style={{
                width: 80, padding: '6px 10px', borderRadius: 8,
                border: '1.5px solid var(--accent)',
                background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14,
              }}
              autoFocus
            />
            <button onClick={saveLimit} disabled={saving} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600,
            }}>
              {saving ? '...' : 'Salva'}
            </button>
            <button onClick={() => setEditLimit(false)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
            }}>
              Annulla
            </button>
          </div>
        ) : (
          <button onClick={() => setEditLimit(true)} style={{
            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z"/>
            </svg>
            Modifica limite (${limit.toFixed(2)}/mese)
          </button>
        )}
      </div>
    </div>
  )
}
