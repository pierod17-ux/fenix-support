'use client'

import { useState } from 'react'

interface Rule {
  id: string
  category: 'fare' | 'evitare' | 'limiti' | 'stile'
  text: string
}

const CATEGORIES = [
  { key: 'fare',    label: 'Da fare',          color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  { key: 'evitare', label: 'Da evitare',       color: '#ff3b30', bg: 'rgba(255,59,48,0.10)' },
  { key: 'limiti',  label: 'Limiti',           color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  { key: 'stile',   label: 'Stile risposta',   color: '#0071e3', bg: 'rgba(0,113,227,0.10)' },
]

function catMeta(key: string) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[0]
}

export default function AIRulesEditor({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState<Rule['category']>('fare')
  const [newText, setNewText] = useState('')

  async function saveRules(updated: Rule[]) {
    setSaving(true)
    await fetch('/api/config/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addRule() {
    if (!newText.trim()) return
    const updated = [...rules, { id: crypto.randomUUID(), category: newCategory, text: newText.trim() }]
    setRules(updated)
    saveRules(updated)
    setNewText('')
    setShowAdd(false)
  }

  function deleteRule(id: string) {
    const updated = rules.filter(r => r.id !== id)
    setRules(updated)
    saveRules(updated)
  }

  function updateRule(id: string, text: string) {
    const updated = rules.map(r => r.id === id ? { ...r, text } : r)
    setRules(updated)
    setEditingId(null)
    saveRules(updated)
  }

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    rules: rules.filter(r => r.category === cat.key),
  }))

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Regole di comportamento AI
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Definisci come l&apos;assistente deve comportarsi — ogni regola viene applicata ad ogni conversazione
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saved && (
            <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>Salvato ✓</span>
          )}
          <button onClick={() => setShowAdd(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: 'white',
            fontSize: 13, fontWeight: 600,
          }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Aggiungi regola
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
            Nuova regola
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setNewCategory(cat.key as Rule['category'])} style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                background: newCategory === cat.key ? cat.color : cat.bg,
                color: newCategory === cat.key ? 'white' : cat.color,
                transition: 'all 0.15s',
              }}>
                {cat.label}
              </button>
            ))}
          </div>
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addRule() } }}
            placeholder="Descrivi la regola... (Invio per salvare)"
            rows={2}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical',
              fontFamily: 'inherit',
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={addRule} disabled={!newText.trim()} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: newText.trim() ? 'var(--accent)' : 'var(--surface-3)',
              color: newText.trim() ? 'white' : 'var(--text-tertiary)',
              fontSize: 13, fontWeight: 600,
            }}>
              Salva regola
            </button>
            <button onClick={() => { setShowAdd(false); setNewText('') }} style={{
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
            }}>
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Rules by category */}
      <div style={{ padding: 20 }}>
        {rules.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 4v12M4 10h12"/>
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Nessuna regola
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Aggiungi regole per personalizzare il comportamento dell&apos;assistente
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.filter(g => g.rules.length > 0).map(group => (
            <div key={group.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: group.bg, color: group.color, letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}>
                  {group.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {group.rules.length} {group.rules.length === 1 ? 'regola' : 'regole'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.rules.map(rule => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    editing={editingId === rule.id}
                    onEdit={() => setEditingId(rule.id)}
                    onSave={(text) => updateRule(rule.id, text)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteRule(rule.id)}
                    catMeta={catMeta(rule.category)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {saving && (
        <div style={{
          padding: '8px 20px', borderTop: '1px solid var(--border)',
          fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'right',
        }}>
          Salvataggio...
        </div>
      )}
    </div>
  )
}

function RuleRow({
  rule, editing, onEdit, onSave, onCancel, onDelete, catMeta,
}: {
  rule: { id: string; text: string }
  editing: boolean
  onEdit: () => void
  onSave: (text: string) => void
  onCancel: () => void
  onDelete: () => void
  catMeta: { color: string; bg: string }
}) {
  const [editText, setEditText] = useState(rule.text)

  if (editing) {
    return (
      <div style={{
        padding: 12, borderRadius: 12,
        border: `1.5px solid ${catMeta.color}`,
        background: catMeta.bg,
      }}>
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSave(editText) } }}
          rows={2}
          style={{
            width: '100%', padding: '6px 8px', borderRadius: 8,
            border: `1px solid ${catMeta.color}30`,
            background: 'var(--surface)', color: 'var(--text-primary)',
            fontSize: 13, resize: 'none', fontFamily: 'inherit',
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={() => onSave(editText)} style={{
            padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: catMeta.color, color: 'white', fontSize: 12, fontWeight: 600,
          }}>Salva</button>
          <button onClick={onCancel} style={{
            padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--text-secondary)', fontSize: 12,
          }}>Annulla</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 12px', borderRadius: 12,
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
    }}>
      <p style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {rule.text}
      </p>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button onClick={onEdit} style={{
          width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z"/>
          </svg>
        </button>
        <button onClick={onDelete} style={{
          width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; e.currentTarget.style.color = '#ff3b30' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
