'use client'

import { useState } from 'react'

// Interruttore della diagnostica remota Evolution: quando e' attiva, l'assistente
// puo' interrogare lo stato della macchina dal numero di serie e guidare il
// cliente (o aprire il ticket) in base ai problemi rilevati.
export default function DiagnosticsToggle({
  initialEnabled, apiKeyConfigured,
}: { initialEnabled: boolean; apiKeyConfigured: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    const next = !enabled
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/config/diagnostics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `Errore ${res.status}`)
        return
      }
      setEnabled(next)
    } catch {
      setError('Errore di rete. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  const active = enabled && apiKeyConfigured

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Diagnostica remota Evolution
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            L&apos;assistente interroga lo stato della macchina dal numero di serie e guida il cliente in base ai problemi rilevati
          </p>
        </div>
        <button
          role="switch" aria-checked={enabled} onClick={toggle} disabled={saving}
          title={enabled ? 'Disattiva' : 'Attiva'}
          style={{
            position: 'relative', width: 52, height: 31, borderRadius: 31, border: 'none', flexShrink: 0,
            cursor: saving ? 'default' : 'pointer', transition: 'background 0.2s',
            background: enabled ? '#34c759' : 'var(--surface-3)', opacity: saving ? 0.6 : 1,
          }}>
          <span style={{
            position: 'absolute', top: 2, left: enabled ? 23 : 2, width: 27, height: 27, borderRadius: '50%',
            background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transition: 'left 0.2s',
          }} />
        </button>
      </div>

      <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: active ? '#34c759' : enabled ? '#ff9500' : '#c7c7cc',
          }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            {active ? 'Attiva' : enabled ? 'Attivata, ma non operativa' : 'Disattivata'}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {active
              ? '— alla prima segnalazione l\'assistente consulta la diagnostica e propone le verifiche, oppure apre il ticket'
              : enabled
                ? '— manca la chiave del servizio: vedi sotto'
                : '— l\'assistente diagnostica solo con le domande guidate'}
          </span>
        </div>

        {enabled && !apiKeyConfigured && (
          <div style={{
            padding: '10px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5,
            background: 'rgba(255,149,0,0.10)', border: '1px solid rgba(255,149,0,0.25)', color: 'var(--text-primary)',
          }}>
            <strong style={{ color: '#c77700' }}>Chiave del servizio non configurata.</strong> Imposta la variabile
            <code style={{ margin: '0 4px', padding: '1px 5px', borderRadius: 5, background: 'var(--surface-2)', fontSize: 11 }}>STATUS_API_KEY</code>
            su Netlify (e ridistribuisci): fino ad allora l&apos;assistente dirà al cliente che la diagnostica remota non è disponibile e proseguirà con la diagnosi guidata.
          </div>
        )}

        {error && <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 500, margin: 0 }}>{error}</p>}

        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
          Problemi che il cliente può risolvere da solo (es. testa del manipolo, cavo, alimentazione) → guida passo passo.
          Problemi gravi o che richiedono un tecnico → comunica l&apos;anomalia e apre il ticket con i dati della diagnostica.
        </p>
      </div>
    </div>
  )
}
