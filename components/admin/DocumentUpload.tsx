'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function DocumentUpload() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !file) return
    setLoading(true)
    setError('')
    setSuccess(false)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('file', file)

    try {
      const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Errore upload')
        setLoading(false)
        return
      }

      setTitle('')
      setDescription('')
      setFile(null)
      setSuccess(true)
      setLoading(false)
      router.refresh()
      // Auto-hide form after 3 seconds
      setTimeout(() => { setOpen(false); setSuccess(false) }, 3000)
    } catch {
      setError('Errore di rete. Riprova.')
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {!open ? (
        <button onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: 'var(--accent)', color: 'white',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 1v10M3 6l5-5 5 5M1 13h14"/>
          </svg>
          Carica documento
        </button>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1.5px solid var(--accent)',
          borderRadius: 16, padding: 20,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Carica nuovo documento
          </h3>

          {success ? (
            <div style={{
              background: 'rgba(52,199,89,0.10)', borderRadius: 12,
              padding: '14px 16px', color: '#34c759', fontSize: 14, fontWeight: 500,
            }}>
              Documento caricato. Elaborazione in corso (30-60 sec) — la pagina si aggiornerà automaticamente.
            </div>
          ) : (
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Titolo *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="Es. Manuale manutenzione Endosphere Body v2.1"
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 14,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', boxSizing: 'border-box',
                  }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Descrizione</label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Breve descrizione del contenuto"
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 14,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', boxSizing: 'border-box',
                  }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>File (PDF, TXT) *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    padding: '16px 12px', borderRadius: 10, fontSize: 13, textAlign: 'center',
                    background: 'var(--surface-2)', border: '2px dashed var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}>
                  {file ? file.name : 'Clicca per selezionare un file'}
                  <input ref={fileRef} type="file" accept=".pdf,.txt" style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              {error && <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={loading}
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: 'none', fontSize: 14,
                    fontWeight: 600, background: 'var(--accent)', color: 'white',
                    cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? 'Caricamento...' : 'Carica e indicizza'}
                </button>
                <button type="button" onClick={() => { setOpen(false); setError('') }}
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: 'none', fontSize: 14,
                    background: 'var(--surface-2)', color: 'var(--text-secondary)', cursor: 'pointer',
                  }}>
                  Annulla
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
