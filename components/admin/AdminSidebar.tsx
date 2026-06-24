'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/admin', label: 'Ticket', icon: IconTicket },
  { href: '/admin/conversations', label: 'Conversazioni', icon: IconChat },
  { href: '/admin/knowledge', label: 'Knowledge Base', icon: IconBook },
  { href: '/admin/training', label: 'Training AI', icon: IconBrain },
  { href: '/admin/schedule', label: 'Reperibilità', icon: IconClock },
  { href: '/admin/analytics', label: 'Analytics', icon: IconChart },
]

export default function AdminSidebar({ role, displayName }: { role: string; displayName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        display: 'none',
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 240, zIndex: 40,
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderRight: '1px solid var(--border)',
        boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
      }}
        className="md-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,113,227,0.35)',
          }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5"/>
              <path d="M10 16 L14 20 L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
              Fenix Support
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
              {role === 'admin' ? 'Amministratore' : 'Tecnico'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0 16px 8px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 10,
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-light)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}>
                <span style={{ width: 18, height: 18, flexShrink: 0, color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  <item.icon />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            background: 'var(--surface-2)',
            marginBottom: 6,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
            }}>
              {initials || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {role === 'admin' ? 'Admin' : 'Tecnico'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', textAlign: 'left', padding: '5px 10px', borderRadius: 8,
            fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center' }}><IconLogout /></span>
            Esci
          </button>
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', opacity: 0.45, marginTop: 8, paddingLeft: 4 }}>
            Fenix Support v1.0.0
          </p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
        className="mobile-tab-bar"
      >
        {nav.slice(0, 5).map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '10px 8px',
              color: active ? 'var(--accent)' : 'var(--text-tertiary)',
              textDecoration: 'none', fontSize: 10, fontWeight: active ? 600 : 400,
              minWidth: 60,
            }}>
              <span style={{ width: 24, height: 24 }}><item.icon /></span>
              {item.label.split(' ')[0]}
            </Link>
          )
        })}
        <button onClick={handleLogout} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '10px 8px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--danger)', fontSize: 10, fontWeight: 400, minWidth: 60,
        }}>
          <span style={{ width: 24, height: 24 }}><IconLogout /></span>
          Esci
        </button>
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .mobile-tab-bar { display: none !important; }
        }
      `}</style>
    </>
  )
}

function IconTicket() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="16" height="12" rx="2.5"/><path d="M6 5V4a2 2 0 014 0v1M2 10h4M6 10v4"/></svg>
}
function IconChat() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H8l-4 3v-3H3a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M6 8h8M6 11h5"/></svg>
}
function IconBook() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2h9a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M7 7h6M7 10h6M7 13h4"/></svg>
}
function IconBrain() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3C7 3 4.5 5 4.5 8c0 1.5.6 2.8 1.5 3.7V15h8v-3.3c.9-.9 1.5-2.2 1.5-3.7 0-3-2.5-5-5.5-5z"/><path d="M7.5 15v1.5M12.5 15v1.5M7 8c0-1.7 1.3-3 3-3"/></svg>
}
function IconClock() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7"/><path d="M10 6.5v3.8l2.5 2.2"/></svg>
}
function IconChart() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17L7 11l3.5 3L14 7l4-4"/><path d="M2 17h16"/></svg>
}
function IconLogout() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3h3a1 1 0 011 1v12a1 1 0 01-1 1h-3M9 14l4-4-4-4M13 10H4"/></svg>
}
