import HelpGuide from '@/components/admin/HelpGuide'

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 40 }}>

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
          Aiuto
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Guida rapida per usare il portale · tocca una sezione per espanderla
        </p>
      </div>

      <div style={{ padding: '0 24px' }}>
        <HelpGuide />
      </div>
    </div>
  )
}
