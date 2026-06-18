'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/admin', label: 'Ticket', icon: <IconTicket /> },
  { href: '/admin/knowledge', label: 'Knowledge Base', icon: <IconBook /> },
  { href: '/admin/training', label: 'Training AI', icon: <IconBrain /> },
  { href: '/admin/schedule', label: 'Reperibilità', icon: <IconClock /> },
  { href: '/admin/analytics', label: 'Analytics', icon: <IconChart /> },
]

export default function AdminSidebar({ role, displayName }: { role: string; displayName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 z-40"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5"/>
              <path d="M10 16 L14 20 L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Fenix Support</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{role === 'admin' ? 'Amministratore' : 'Tecnico'}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'white' : 'var(--text-secondary)',
                }}>
                <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{displayName}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-xl text-sm"
            style={{ color: 'var(--danger)' }}>
            Esci
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        {nav.slice(0, 4).map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-xs"
              style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)' }}>
              <span className="w-5 h-5">{item.icon}</span>
              {item.label.split(' ')[0]}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

function IconTicket() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M5 3v10M1 8h4"/></svg>
}
function IconBook() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 1h8a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2z"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>
}
function IconBrain() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2C5.5 2 3 4 3 7c0 1.5.6 2.8 1.5 3.7V13h7v-2.3C12.4 9.8 13 8.5 13 7c0-3-2.5-5-5-5z"/><path d="M6 13v1M10 13v1M5 7c0-1.7 1.3-3 3-3"/></svg>
}
function IconClock() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
}
function IconChart() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 14 L5 9 L8 11 L11 5 L15 2"/><path d="M1 14h14"/></svg>
}
