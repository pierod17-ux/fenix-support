'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Stesse forme dati di AIRulesEditor / SystemContextsEditor (ai_config)
type RuleCategory = 'fare' | 'evitare' | 'limiti' | 'stile'
interface Rule { id: string; category: RuleCategory; text: string }
interface Context { id: string; title: string; content: string }

const CATEGORIES: { key: RuleCategory; label: string; color: string; bg: string }[] = [
  { key: 'fare',    label: 'Da fare',        color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  { key: 'evitare', label: 'Da evitare',     color: '#ff3b30', bg: 'rgba(255,59,48,0.10)' },
  { key: 'limiti',  label: 'Limiti',         color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  { key: 'stile',   label: 'Stile risposta', color: '#0071e3', bg: 'rgba(0,113,227,0.10)' },
]
const catMeta = (k: RuleCategory) => CATEGORIES.find(c => c.key === k) ?? CATEGORIES[0]

interface ProposedRule { key: string; category: RuleCategory; text: string; selected: boolean }
interface ProposedContext { key: string; title: string; content: string; selected: boolean }
interface Proposal {
  kind: 'instructions' | 'documentation' | 'mixed'
  summary: string
  truncated: boolean
  rules: ProposedRule[]
  contexts: ProposedContext[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.45,
}

// Importa regole e contesti da un documento: l'AI PROPONE, l'amministratore
// rivede (modifica, seleziona, scarta) e solo allora applica. Nulla cambia il
// comportamento dell'assistente senza questo passaggio.
export default function ImportFromDocument({
  currentRules, currentContexts,
}: { currentRules: Rule[]; currentContexts: Context[] }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [applied, setApplied] = useState<{ rules: number; contexts: number } | null>(null)

  async function analyze() {
    if (!file) return
    setAnalyzing(true); setError(''); setProposal(null); setApplied(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/config/import-document', { method: 'POST', body: fd })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error ?? `Errore ${res.status}`); return }
      setProposal({
        kind: d.kind, summary: d.summary, truncated: !!d.truncated,
        rules: (d.rules ?? []).map((r: { category: RuleCategory; text: string }, i: number) =>
          ({ key: `r${i}`, category: r.category, text: r.text, selected: true })),
        contexts: (d.contexts ?? []).map((c: { title: string; content: string }, i: number) =>
          ({ key: `c${i}`, title: c.title, content: c.content, selected: true })),
      })
    } catch {
      setError('Errore di rete durante l\'analisi. Riprova.')
    } finally {
      setAnalyzing(false)
    }
  }

  function updateRule(key: string, patch: Partial<ProposedRule>) {
    setProposal(p => p && { ...p, rules: p.rules.map(r => r.key === key ? { ...r, ...patch } : r) })
  }
  function updateContext(key: string, patch: Partial<ProposedContext>) {
    setProposal(p => p && { ...p, contexts: p.contexts.map(c => c.key === key ? { ...c, ...patch } : c) })
  }

  const selRules = proposal?.rules.filter(r => r.selected && r.text.trim()) ?? []
  const selContexts = proposal?.contexts.filter(c => c.selected && c.title.trim() && c.content.trim()) ?? []
  const selCount = selRules.length + selContexts.length

  async function apply() {
    if (!proposal || selCount === 0) return
    setApplying(true); setError('')
    try {
      const mergedRules: Rule[] = [
        ...currentRules,
        ...selRules.map(r => ({ id: crypto.randomUUID(), category: r.category, text: r.text.trim() })),
      ]
      const mergedContexts: Context[] = [
        ...currentContexts,
        ...selContexts.map(c => ({ id: crypto.randomUUID(), title: c.title.trim(), content: c.content.trim() })),
      ]
      const reqs: Promise<Response>[] = []
      if (selRules.length > 0) reqs.push(fetch('/api/config/rules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mergedRules),
      }))
      if (selContexts.length > 0) reqs.push(fetch('/api/config/contexts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mergedContexts),
      }))
      const results = await Promise.all(reqs)
      const failed = results.find(r => !r.ok)
      if (failed) {
        const d = await failed.json().catch(() => ({}))
        setError(d.error ?? `Salvataggio fallito (${failed.status})`)
        return
      }
      setApplied({ rules: selRules.length, contexts: selContexts.length })
      setProposal(null); setFile(null)
      router.refresh() // ricarica gli editor Regole e Contesti con i nuovi elementi
    } catch {
      setError('Errore di rete durante il salvataggio. Riprova.')
    } finally {
      setApplying(false)
    }
  }

  function discard() { setProposal(null); setFile(null); setError('') }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Importa regole da documento
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          Carica un file di istruzioni (TXT, PDF): l&apos;AI propone regole e contesti, tu li rivedi e li applichi.
          Nulla cambia finché non confermi.
        </p>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Esito applicazione */}
        {applied && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.25)',
            fontSize: 13, color: '#1f8f3f', fontWeight: 500,
          }}>
            Applicati {applied.rules} {applied.rules === 1 ? 'regola' : 'regole'} e {applied.contexts} {applied.contexts === 1 ? 'contesto' : 'contesti'}.
            Li trovi nelle sezioni qui sopra.
          </div>
        )}

        {/* Selezione file + analisi */}
        {!proposal && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{
              flex: 1, minWidth: 220, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              border: '1.5px dashed var(--border)', background: 'var(--surface-2)',
              fontSize: 13, color: file ? 'var(--text-primary)' : 'var(--text-secondary)',
              textAlign: 'center', fontWeight: file ? 500 : 400,
            }}>
              {file ? file.name : 'Scegli un file TXT o PDF'}
              <input type="file" accept=".txt,.pdf" style={{ display: 'none' }}
                onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); setApplied(null) }} />
            </label>
            <button onClick={analyze} disabled={!file || analyzing} style={{
              padding: '12px 20px', borderRadius: 12, border: 'none',
              cursor: !file || analyzing ? 'default' : 'pointer',
              background: !file || analyzing ? 'var(--surface-3)' : 'var(--accent)',
              color: !file || analyzing ? 'var(--text-secondary)' : 'white',
              fontSize: 13, fontWeight: 600,
              boxShadow: !file || analyzing ? 'none' : '0 2px 10px rgba(0,113,227,0.3)',
            }}>
              {analyzing ? 'Analisi in corso…' : 'Analizza'}
            </button>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)',
          }}>
            <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {/* Proposta da rivedere */}
        {proposal && (
          <>
            <div style={{
              padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)',
              fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5,
            }}>
              <span style={{
                display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.4px',
                background: proposal.kind === 'documentation' ? 'rgba(255,149,0,0.12)' : 'rgba(0,113,227,0.10)',
                color: proposal.kind === 'documentation' ? '#ff9500' : 'var(--accent)',
              }}>
                {proposal.kind === 'documentation' ? 'Documentazione' : proposal.kind === 'mixed' ? 'Misto' : 'Istruzioni'}
              </span>
              {proposal.summary}
              {proposal.truncated && (
                <span style={{ display: 'block', marginTop: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                  Il documento era molto lungo: è stata analizzata solo la prima parte.
                </span>
              )}
            </div>

            {proposal.kind === 'documentation' && proposal.rules.length === 0 && proposal.contexts.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Questo file sembra documentazione tecnica: va caricato nella sezione <strong>Carica documenti di addestramento</strong>, così resta consultabile dall&apos;AI tramite ricerca.
              </p>
            )}

            {proposal.rules.length > 0 && (
              <section>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Regole proposte ({proposal.rules.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {proposal.rules.map(r => {
                    const m = catMeta(r.category)
                    return (
                      <div key={r.key} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 12,
                        border: '1px solid var(--border)', opacity: r.selected ? 1 : 0.5,
                      }}>
                        <input type="checkbox" checked={r.selected}
                          onChange={e => updateRule(r.key, { selected: e.target.checked })}
                          style={{ marginTop: 10, width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }} />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <select value={r.category}
                            onChange={e => updateRule(r.key, { category: e.target.value as RuleCategory })}
                            style={{
                              alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                              border: 'none', background: m.bg, color: m.color, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                          </select>
                          <textarea value={r.text} rows={2}
                            onChange={e => updateRule(r.key, { text: e.target.value })}
                            style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {proposal.contexts.length > 0 && (
              <section>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Contesti proposti ({proposal.contexts.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {proposal.contexts.map(c => (
                    <div key={c.key} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 12,
                      border: '1px solid var(--border)', opacity: c.selected ? 1 : 0.5,
                    }}>
                      <input type="checkbox" checked={c.selected}
                        onChange={e => updateContext(c.key, { selected: e.target.checked })}
                        style={{ marginTop: 10, width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input value={c.title} placeholder="Titolo"
                          onChange={e => updateContext(c.key, { title: e.target.value })}
                          style={{ ...inputStyle, fontWeight: 600 }} />
                        <textarea value={c.content} rows={4}
                          onChange={e => updateContext(c.key, { content: e.target.value })}
                          style={{ ...inputStyle, resize: 'vertical' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={apply} disabled={selCount === 0 || applying} style={{
                padding: '12px 20px', borderRadius: 12, border: 'none',
                cursor: selCount === 0 || applying ? 'default' : 'pointer',
                background: selCount === 0 || applying ? 'var(--surface-3)' : 'var(--accent)',
                color: selCount === 0 || applying ? 'var(--text-secondary)' : 'white',
                fontSize: 13, fontWeight: 600,
                boxShadow: selCount === 0 || applying ? 'none' : '0 2px 10px rgba(0,113,227,0.3)',
              }}>
                {applying ? 'Salvataggio…' : `Applica ${selCount} ${selCount === 1 ? 'elemento' : 'elementi'} selezionati`}
              </button>
              <button onClick={discard} disabled={applying} style={{
                padding: '12px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              }}>
                Scarta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
