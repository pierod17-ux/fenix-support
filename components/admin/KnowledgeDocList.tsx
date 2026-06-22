'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Doc {
  id: string
  title: string
  file_type: string
  status: string
  chunk_count: number
  created_at: string
}

const statusColor: Record<string, { bg: string; text: string }> = {
  ready:      { bg: 'rgba(52,199,89,0.12)',  text: '#34c759' },
  processing: { bg: 'rgba(255,149,0,0.12)',  text: '#ff9500' },
  error:      { bg: 'rgba(255,59,48,0.10)',  text: '#ff3b30' },
}
const statusLabel: Record<string, string> = {
  ready: 'Pronto', processing: 'Elaborazione...', error: 'Errore',
}

export default function KnowledgeDocList({ docs: initial }: { docs: Doc[] }) {
  const [docs, setDocs] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo documento e tutti i suoi chunk?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== id))
        router.refresh()
      }
    } finally {
      setDeleting(null)
    }
  }

  if (!docs.length) {
    return (
      <div style={{
        background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)',
        marginTop: 20, padding: '60px 20px', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9L13 2z"/>
            <path d="M13 2v7h7"/>
          </svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Nessun documento</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Carica manuali e procedure per addestrare l&apos;AI</p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 20,
      boxShadow: 'var(--shadow-md)', overflow: 'hidden', marginTop: 20,
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Documenti caricati</h2>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{docs.length} file</span>
      </div>

      <div>
        {docs.map((doc, i) => {
          const sc = statusColor[doc.status] ?? { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
          const isDeleting = deleting === doc.id
          return (
            <div key={doc.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              opacity: isDeleting ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9L13 2z"/>
                  <path d="M13 2v7h7"/>
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {doc.file_type?.toUpperCase() ?? 'FILE'}
                  {doc.chunk_count ? ` · ${doc.chunk_count} chunk` : ''}
                  {' · '}{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: it })}
                </p>
              </div>

              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: sc.bg, color: sc.text, whiteSpace: 'nowrap',
              }}>
                {statusLabel[doc.status] ?? doc.status}
              </span>

              <button
                onClick={() => handleDelete(doc.id)}
                disabled={isDeleting}
                title="Elimina documento"
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: 'transparent', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,59,48,0.10)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#ff3b30'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 4h12M5 4V2h6v2M6 7v6M10 7v6M3 4l1 10h8l1-10"/>
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
