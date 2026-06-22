import { createClient } from '@/lib/supabase/server'
import DocumentUpload from '@/components/admin/DocumentUpload'
import KnowledgeDocList from '@/components/admin/KnowledgeDocList'

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
            { label: 'Chunks indicizzati', value: chunks,             color: '#8e8e93' },
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
        <KnowledgeDocList docs={docs?.map(d => ({
          id: d.id,
          title: d.title,
          file_type: d.file_type,
          status: d.status,
          chunk_count: d.chunk_count,
          created_at: d.created_at,
        })) ?? []} />
      </div>
    </div>
  )
}
