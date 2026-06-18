import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import DocumentUpload from '@/components/admin/DocumentUpload'

const statusColor: Record<string, string> = {
  ready: 'var(--success)',
  processing: 'var(--warning)',
  error: 'var(--danger)',
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Knowledge Base</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Documenti usati dall&apos;AI per rispondere ai clienti
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Documenti pronti', value: ready, color: 'var(--success)' },
          { label: 'In elaborazione', value: processing, color: 'var(--warning)' },
          { label: 'Totale', value: docs?.length ?? 0, color: 'var(--accent)' },
          { label: 'Chunks vettoriali', value: docs?.reduce((s, d) => s + (d.chunk_count ?? 0), 0) ?? 0, color: 'var(--info)' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <DocumentUpload />

      {/* Lista documenti */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Documenti caricati</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {!docs?.length && (
            <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nessun documento. Carica il primo manuale o la prima procedura.
            </p>
          )}
          {docs?.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface-3)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
                  <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z"/>
                  <path d="M9 1v5h5"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {doc.file_type?.toUpperCase() ?? 'FILE'}
                  {doc.chunk_count ? ` · ${doc.chunk_count} chunk` : ''}
                  {' · '}{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: it })}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md"
                style={{
                  background: `${statusColor[doc.status]}20`,
                  color: statusColor[doc.status],
                }}>
                {statusLabel[doc.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
