import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--background)',
    }}>
      <header style={{
        flexShrink: 0,
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
        zIndex: 10,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
          flexShrink: 0, boxShadow: '0 2px 8px rgba(0,113,227,0.35)',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar.png" alt="Giulia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            Fenix Assistenza Tecnica
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }}/>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Giulia · Assistente AI attivo</p>
          </div>
        </div>
        <a href="/login" style={{
          fontSize: 13, color: 'var(--accent)', fontWeight: 500,
          textDecoration: 'none', padding: '6px 12px',
          background: 'var(--accent-light)', borderRadius: 20,
          flexShrink: 0,
        }}>
          Area tecnici
        </a>
      </header>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatInterface />
      </div>
    </div>
  )
}
