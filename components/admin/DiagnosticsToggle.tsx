'use client'

import { useState } from 'react'

// Diagnostica remota Evolution: quando la chiave e' configurata, il tool e'
// SEMPRE attivo (l'AI lo usa per guidare la conversazione, dopo l'anamnesi).
// Questo interruttore controlla SOLO se il referto tecnico viene spiegato
// apertamente al cliente oppure resta a uso interno. Il tecnico, in caso di
// ticket, riceve comunque sempre il dettaglio completo.
export default function DiagnosticsToggle({
  initialDiscloseToCustomer, apiKeyConfigured,
}: { initialDiscloseToCustomer: boolean; apiKeyConfigured: boolean }) {
  const [discloseToCustomer, setDiscloseToCustomer] = useState(initialDiscloseToCustomer)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function toggle() {
    const next = !discloseToCustomer
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/config/diagnostics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discloseToCustomer: next }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? `Errore ${res.status}`)
        return
      }
      setDiscloseToCustomer(next)
    } catch {
      setError('Errore di rete. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          Diagnostica remota Evolution
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
          {apiKeyConfigured
            ? 'Sempre attiva: prima fa l\'anamnesi dei sintomi, poi consulta la macchina dal numero di serie e incrocia i dati per la diagnosi'
            : 'Non configurata: manca la chiave del servizio (vedi sotto)'}
        </p>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Mostra il referto tecnico al cliente
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.45 }}>
              {discloseToCustomer
                ? 'Attivo: l\'assistente spiega al cliente i problemi rilevati e cosa fare.'
                : 'Disattivato: la diagnostica resta attiva ma solo ad uso interno — guida le domande e i suggerimenti senza esporre il referto. In caso di ticket il tecnico riceve comunque il dettaglio completo.'}
            </p>
          </div>
          <button
            role="switch" aria-checked={discloseToCustomer} onClick={toggle} disabled={saving || !apiKeyConfigured}
            title={apiKeyConfigured ? (discloseToCustomer ? 'Disattiva' : 'Attiva') : 'Configura prima la chiave del servizio'}
            style={{
              position: 'relative', width: 52, height: 31, borderRadius: 31, border: 'none', flexShrink: 0,
              cursor: saving || !apiKeyConfigured ? 'default' : 'pointer', transition: 'background 0.2s',
              background: discloseToCustomer ? '#34c759' : 'var(--surface-3)', opacity: saving || !apiKeyConfigured ? 0.5 : 1,
            }}>
            <span style={{
              position: 'absolute', top: 2, left: discloseToCustomer ? 23 : 2, width: 27, height: 27, borderRadius: '50%',
              background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {!apiKeyConfigured && (
          <div style={{
            padding: '10px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5,
            background: 'rgba(255,149,0,0.10)', border: '1px solid rgba(255,149,0,0.25)', color: 'var(--text-primary)',
          }}>
            <strong style={{ color: '#c77700' }}>Chiave del servizio non configurata.</strong> Imposta la variabile
            <code style={{ margin: '0 4px', padding: '1px 5px', borderRadius: 5, background: 'var(--surface-2)', fontSize: 11 }}>STATUS_API_KEY</code>
            su Netlify (e ridistribuisci): fino ad allora la diagnostica remota non è disponibile e l&apos;assistente procede solo con le domande guidate.
          </div>
        )}

        {error && <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 500, margin: 0 }}>{error}</p>}

        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.5 }}>
          Prima di consultare la macchina l&apos;assistente fa sempre l&apos;anamnesi (da quando si presenta il problema, in che condizioni, eventuali codici a display) e incrocia le risposte del cliente con i dati tecnici. Problemi risolvibili dal cliente → guida passo passo. Problemi gravi o che richiedono un tecnico → apre il ticket con il referto completo, mostrandolo al cliente solo se questo interruttore è attivo.
        </p>
      </div>
    </div>
  )
}
