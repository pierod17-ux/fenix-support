'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // The invite/recovery link redirects here with session tokens in the URL hash.
  // @supabase/ssr's browser client auto-detects them; we wait for the session.
  useEffect(() => {
    let active = true
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (active) { setReady(true); setChecking(false) }
        return
      }
      // Session may still be processing the URL hash — listen briefly.
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (s && active) { setReady(true); setChecking(false) }
      })
      // Fallback timeout: if no session after 3s, link is invalid/expired.
      setTimeout(() => {
        if (active && !ready) { setChecking(false) }
      }, 3000)
      return () => sub.subscription.unsubscribe()
    }
    check()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La password deve avere almeno 8 caratteri'); return }
    if (password !== confirm) { setError('Le password non coincidono'); return }
    setLoading(true)

    const { error: updErr } = await supabase.auth.updateUser({ password })
    if (updErr) { setError(updErr.message); setLoading(false); return }

    // Mark own profile as active
    await fetch('/api/technicians/activate', { method: 'POST' })

    router.push('/admin')
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', background: 'var(--background)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,113,227,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="2.5"/>
              <path d="M10 16 L14 20 L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            Attiva il tuo account
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            Scegli una password per accedere al portale
          </p>
        </div>

        {checking ? (
          <div style={{
            background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)',
            padding: '40px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Verifica del link in corso…</p>
          </div>
        ) : !ready ? (
          <div style={{
            background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)',
            padding: '32px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>
              Link non valido o scaduto
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Chiedi all&apos;amministratore di inviarti un nuovo invito.
            </p>
            <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Vai al login
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: 'var(--surface)', borderRadius: 20,
            boxShadow: 'var(--shadow-md)', overflow: 'hidden',
            padding: '28px 24px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Nuova password
              </label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Almeno 8 caratteri"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 15, transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Conferma password
              </label>
              <input
                type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 15, transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)',
              }}>
                <p style={{ fontSize: 14, color: 'var(--danger)', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: loading ? 'var(--surface-3)' : 'var(--accent)', color: loading ? 'var(--text-secondary)' : 'white',
              fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(0,113,227,0.35)', transition: 'all 0.2s',
            }}>
              {loading ? 'Attivazione…' : 'Attiva account e accedi'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
