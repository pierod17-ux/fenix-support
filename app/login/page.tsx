'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setResetSent(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o password non validi'); setLoading(false); return }
    router.push('/admin')
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Si è verificato un errore. Riprova.')
        setLoading(false)
        return
      }
      setResetSent(true)
    } catch {
      setError('Si è verificato un errore. Riprova.')
    }
    setLoading(false)
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
            Fenix Support
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            {mode === 'login' ? 'Area riservata tecnici e amministratori' : 'Reimposta la password del tuo account'}
          </p>
        </div>

        {mode === 'login' ? (
          /* Form login */
          <form onSubmit={handleLogin} style={{
            background: 'var(--surface)', borderRadius: 20,
            boxShadow: 'var(--shadow-md)', overflow: 'hidden',
            padding: '28px 24px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 15,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 15,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button type="button" onClick={() => switchMode('forgot')} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: 'var(--accent)',
              }}>
                Password dimenticata?
              </button>
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
              boxShadow: loading ? 'none' : '0 2px 8px rgba(0,113,227,0.35)',
              transition: 'all 0.2s',
            }}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        ) : (
          /* Form recupero password */
          <form onSubmit={handleForgot} style={{
            background: 'var(--surface)', borderRadius: 20,
            boxShadow: 'var(--shadow-md)', overflow: 'hidden',
            padding: '28px 24px',
          }}>
            {resetSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: 'var(--success)', fontSize: 24 }}>✓</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Controlla la tua email
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Se l’indirizzo è associato a un account, riceverai un link per reimpostare la password. Il link è valido per 1 ora.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="nome@esempio.it"
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 10,
                      background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                      color: 'var(--text-primary)', fontSize: 15,
                      transition: 'border-color 0.15s',
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
                  boxShadow: loading ? 'none' : '0 2px 8px rgba(0,113,227,0.35)',
                  transition: 'all 0.2s',
                }}>
                  {loading ? 'Invio in corso...' : 'Invia link di reset'}
                </button>
              </>
            )}
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-tertiary)' }}>
          {mode === 'login' ? (
            <a href="/chat" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              ← Torna al portale clienti
            </a>
          ) : (
            <button type="button" onClick={() => switchMode('login')} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: 'var(--accent)',
            }}>
              ← Torna al login
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
