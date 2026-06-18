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
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !file) return
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('file', file)

    const res = await fetch('/api/knowledge/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Errore upload')
      setLoading(false)
      return
    }

    setTitle('')
    setDescription('')
    setFile(null)
    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'var(--accent)', color: 'white' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1v10M3 6l5-5 5 5M1 13h14"/></svg>
          Carica documento
        </button>
      ) : (
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--accent)' }}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Carica nuovo documento</h3>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Titolo *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="Es. Manuale manutenzione Endosphere Body v2.1"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Descrizione</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Breve descrizione del contenuto"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>File (PDF, DOCX, TXT) *</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full px-3 py-4 rounded-xl text-sm text-center cursor-pointer"
                style={{ background: 'var(--surface-2)', border: '2px dashed var(--border)', color: 'var(--text-secondary)' }}>
                {file ? file.name : 'Clicca per selezionare un file'}
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all"
                style={{ background: 'var(--accent)', color: 'white' }}>
                {loading ? 'Caricamento...' : 'Carica e indicizza'}
              </button>
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
