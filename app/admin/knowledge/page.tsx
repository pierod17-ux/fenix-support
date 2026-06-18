import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import DocumentUpload from '@/components/admin/DocumentUpload'

const statusColor: Record<string, { bg: string; text: string }> = {
  ready:      { bg: 'rgba(52,199,89,0.12)',   text: '#34c759' },
  processing: { bg: 'rgba(255,149,0,0.12)',   text: '#ff9500' },
  error:      { bg: 'rgba(255,59,48,0.10)',   text: '#ff3b30' },
}
const statusLabel: Record<string, string> = {
  ready: 'Pronto', processing: 'Elaborazione...', error: 'Errore',
}

export default async function KnowledgePage() {
  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('knowledge_documents')
    .select('*')
    .order('created_at', { ascending: false })

  const ready = docs?.filter(d => d.status === 'ready').length ?? 0
  const processing = docs?.filter(d => d.status === 'processing').length ?? 0
  const chunks = docs?.reduce((s, d) => s + (d.chunk_count ?? 0), 0) ?? 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>

      {/* Page header */}
      <div style={{
        padding: '24px 24px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,245,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
          Knowledge Base
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Documenti usati dall&apos;AI per rispondere ai clienti
        </p>
      </div>

      <div style={{ padding: '0 24px' }}>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Documenti pronti',   value: ready,              color: '#34c759' },
            { label: 'In elaborazione',    value: processing,         color: '#ff9500' },
            { label: 'Totale documenti',   value: docs?.length ?? 0,  color: 'var(--accent)' },
            { label: 'Chunks vettoriali',  value: chunks,             color: '#8e8e93' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'var(--surface)',
              borderRadius: 16, padding: '16px 20px',
              boxShadow: 'var(--shadow-md)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {kpi.label}
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Upload */}
        <DocumentUpload />

        {/* Doc list */}
        <div style={{
          background: 'var(--surface)', borderRadius: 20,
          boxShadow: 'var(--shadow-md)', overflow: 'hidden', marginTop: 20,
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Documenti caricati
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {docs?.length ?? 0} file
            </span>
          </div>

          {!docs?.length ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
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
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Nessun documento
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Carica manuali e procedure per addestrare l&apos;AI
              </p>
            </div>
          ) : (
            <div>
              {docs.map((doc, i) => {
                const sc = statusColor[doc.status] ?? { bg: 'var(--surface-2)', text: 'var(--text-secondary)' }
                return (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
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
                      background: sc.bg, color: sc.text,
                    }}>
                      {statusLabel[doc.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
