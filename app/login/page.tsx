'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o password non validi'); setLoading(false); return }
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
            Fenix Support
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            Area riservata tecnici e amministratori
          </p>
        </div>

        {/* Form */}
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

          <div style={{ marginBottom: 20 }}>
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

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-tertiary)' }}>
          <a href="/chat" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            ← Torna al portale clienti
          </a>
        </p>
      </div>
    </div>
  )
}
