'use client'

import { useState, useCallback, useEffect } from 'react'

const DAYS_FULL = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

const STATUS_LABEL: Record<string, string> = {
  active: 'Attivo', disabled: 'Disabilitato', invited: 'Invitato',
}
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  active:   { bg: 'rgba(52,199,89,0.12)',    text: '#34c759' },
  disabled: { bg: 'rgba(110,110,115,0.12)',  text: '#6e6e73' },
  invited:  { bg: 'rgba(255,159,10,0.12)',   text: '#ff9500' },
}

interface Technician {
  id: string
  display_name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  role: string
  account_status: string | null
  last_seen?: string | null
}

// Online se l'ultimo heartbeat è entro 2 minuti. `now` viene da uno stato
// client (null durante SSR) per evitare mismatch di hydration.
function isOnline(lastSeen: string | null | undefined, now: number | null): boolean {
  if (!lastSeen || now === null) return false
  return now - new Date(lastSeen).getTime() < 2 * 60 * 1000
}
interface Schedule {
  id: string
  technician_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}
interface TechForm {
  display_name: string
  email: string
  phone: string
  whatsapp: string
}

export default function ScheduleEditor({
  technicians: initTechs,
  schedules: initSchedules,
  isAdmin = true,
  currentUserId,
}: {
  technicians: Technician[]
  schedules: Schedule[]
  isAdmin?: boolean
  currentUserId?: string
}) {
  const [technicians, setTechnicians] = useState<Technician[]>(initTechs)
  const [schedules, setSchedules] = useState<Schedule[]>(initSchedules)
  const [tab, setTab] = useState<'tecnici' | 'turni'>(isAdmin ? 'tecnici' : 'turni')
  const [now, setNow] = useState<number | null>(null)

  // Tick ogni 30s per ricalcolare lo stato online (e niente mismatch SSR)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Admin: aggiorna periodicamente last_seen dei tecnici (stato online live)
  useEffect(() => {
    if (!isAdmin) return
    const refresh = async () => {
      try {
        const res = await fetch('/api/technicians')
        if (!res.ok) return
        const fresh: Technician[] = await res.json()
        const seen = new Map(fresh.map(t => [t.id, t.last_seen]))
        setTechnicians(prev => prev.map(t => seen.has(t.id) ? { ...t, last_seen: seen.get(t.id) ?? null } : t))
      } catch { /* ignora */ }
    }
    const t = setInterval(refresh, 30_000)
    return () => clearInterval(t)
  }, [isAdmin])

  // ─── Technician modal state ───
  const [showModal, setShowModal] = useState(false)
  const [editingTech, setEditingTech] = useState<Technician | null>(null)
  const [form, setForm] = useState<TechForm>({ display_name: '', email: '', phone: '', whatsapp: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  // ─── Shift state ───
  const [addingDay, setAddingDay] = useState<number | null>(null)
  const [shiftForm, setShiftForm] = useState({ technician_id: '', start_time: '09:00', end_time: '18:00' })
  const [shiftLoading, setShiftLoading] = useState(false)

  // ─── Technician CRUD ───
  const openAdd = useCallback(() => {
    setEditingTech(null)
    setForm({ display_name: '', email: '', phone: '', whatsapp: '' })
    setFormError(''); setFormSuccess(''); setInviteLink(null)
    setShowModal(true)
  }, [])

  const openEdit = useCallback((t: Technician) => {
    setEditingTech(t)
    setForm({ display_name: t.display_name ?? '', email: t.email ?? '', phone: t.phone ?? '', whatsapp: t.whatsapp ?? '' })
    setFormError(''); setFormSuccess(''); setInviteLink(null)
    setShowModal(true)
  }, [])

  async function saveTech(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true); setFormError(''); setFormSuccess('')

    if (editingTech) {
      const res = await fetch(`/api/technicians/${editingTech.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: form.display_name, phone: form.phone, whatsapp: form.whatsapp }),
      })
      if (!res.ok) {
        const d = await res.json()
        setFormError(d.error ?? 'Errore di salvataggio')
        setFormLoading(false)
        return
      }
      setTechnicians(prev => prev.map(t => t.id === editingTech.id ? { ...t, ...form } : t))
      setFormSuccess('Aggiornato!')
    } else {
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setFormError(d.error ?? 'Errore di creazione')
        setFormLoading(false)
        return
      }
      const d = await res.json()
      const newTech: Technician = {
        id: d.userId,
        display_name: form.display_name,
        email: form.email,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        role: 'technician',
        account_status: 'invited',
      }
      setTechnicians(prev => [...prev, newTech])
      if (d.emailError) {
        setFormSuccess(`Tecnico aggiunto. Errore email: ${d.emailError}`)
        setInviteLink(d.inviteLink ?? null)
      } else {
        setFormSuccess('Tecnico aggiunto! Email di invito inviata.')
        setTimeout(() => setShowModal(false), 1800)
      }
    }

    setFormLoading(false)
  }

  async function toggleStatus(t: Technician) {
    const next = t.account_status === 'disabled' ? 'active' : 'disabled'
    await fetch(`/api/technicians/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_status: next }),
    })
    setTechnicians(prev => prev.map(x => x.id === t.id ? { ...x, account_status: next } : x))
  }

  async function resetPassword(t: Technician) {
    await fetch(`/api/technicians/${t.id}/reset-password`, { method: 'POST' })
    alert(`Email di reset password inviata a ${t.email}`)
  }

  async function deleteTechnician(t: Technician) {
    if (!confirm(`Eliminare definitivamente ${t.display_name}? L'operazione non è reversibile.`)) return
    const res = await fetch(`/api/technicians/${t.id}`, { method: 'DELETE' })
    if (res.ok) {
      setTechnicians(prev => prev.filter(x => x.id !== t.id))
    } else {
      const d = await res.json()
      alert(`Errore: ${d.error}`)
    }
  }

  // ─── Shifts ───
  async function addShift(e: React.FormEvent, day: number) {
    e.preventDefault()
    if (!shiftForm.technician_id) return
    setShiftLoading(true)
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...shiftForm, day_of_week: day }),
    })
    if (res.ok) {
      const s = await res.json()
      setSchedules(prev => [...prev, s])
      setAddingDay(null)
    } else {
      const d = await res.json().catch(() => ({}))
      alert(`Impossibile salvare il turno: ${d.error ?? res.status}`)
    }
    setShiftLoading(false)
  }

  async function removeShift(id: string) {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const byDay = Array.from({ length: 7 }, (_, i) => schedules.filter(s => s.day_of_week === i))
  const activeTechs = technicians.filter(t => t.account_status !== 'disabled')

  return (
    <>
      {/* Segmented control — solo admin */}
      {isAdmin && (
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: 'var(--surface-2)', borderRadius: 14,
        marginBottom: 24,
      }}>
        {([['tecnici', 'Tecnici'], ['turni', 'Turni settimanali']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === key ? 600 : 400,
            background: tab === key ? 'var(--surface)' : 'transparent',
            color: tab === key ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: tab === key ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>
      )}

      {/* ── Tab: Tecnici ── */}
      {isAdmin && tab === 'tecnici' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Tecnici reperibili
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                I tecnici aggiunti ricevono le notifiche di escalation e le chat dirette
              </p>
            </div>
            <button onClick={openAdd} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: 'white',
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 10px rgba(0,113,227,0.3)',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
              </svg>
              Aggiungi tecnico
            </button>
          </div>

          <div style={{
            background: 'var(--surface)', borderRadius: 20, boxShadow: 'var(--shadow-md)', overflow: 'hidden',
          }}>
            {technicians.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                  background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Nessun tecnico</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Aggiungi i tecnici che gestiscono la reperibilità.<br/>Riceveranno un invito via email.
                </p>
              </div>
            ) : (
              technicians.map((t, i) => {
                const status = t.account_status ?? 'active'
                const sc = STATUS_COLOR[status] ?? STATUS_COLOR.active
                const initial = (t.display_name ?? '?').charAt(0).toUpperCase()
                const isDisabled = status === 'disabled'
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                      background: isDisabled ? 'var(--surface-3)' : 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: 'white',
                    }}>
                      {initial}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {t.display_name ?? 'Senza nome'}
                        </p>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: sc.bg, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.4px',
                        }}>
                          {STATUS_LABEL[status] ?? status}
                        </span>
                        {isOnline(t.last_seen, now) && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(52,199,89,0.12)', color: '#34c759',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34c759' }} />
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {t.email && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ opacity: 0.5 }}>✉</span>{t.email}
                          </span>
                        )}
                        {t.phone && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ opacity: 0.5 }}>📞</span>{t.phone}
                          </span>
                        )}
                        {t.whatsapp && (
                          <span style={{ fontSize: 12, color: '#34c759', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>WA</span>{t.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <ActionBtn onClick={() => openEdit(t)} label="Modifica" />
                      <ActionBtn onClick={() => resetPassword(t)} label="Reset pwd" />
                      <ActionBtn
                        onClick={() => toggleStatus(t)}
                        label={isDisabled ? 'Abilita' : 'Disabilita'}
                        danger={!isDisabled}
                        success={isDisabled}
                      />
                      <ActionBtn onClick={() => deleteTechnician(t)} label="Elimina" danger />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Turni ── */}
      {tab === 'turni' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Turni settimanali
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              Il tecnico di turno riceve notifiche di escalation e chat dirette
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 7 }, (_, day) => {
              const daySchedules = byDay[day]
              const isWeekend = day === 0 || day === 6
              const isAdding = addingDay === day

              return (
                <div key={day} style={{
                  background: 'var(--surface)', borderRadius: 16, boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}>
                  {/* Day header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isWeekend ? 'rgba(255,159,10,0.04)' : 'transparent',
                    borderBottom: (daySchedules.length > 0 || isAdding) ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: isWeekend ? '#ff9500' : 'var(--text-primary)',
                      }}>
                        {DAYS_FULL[day]}
                      </span>
                      {daySchedules.length > 0 && (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 10,
                          background: 'rgba(0,113,227,0.08)', color: 'var(--accent)', fontWeight: 500,
                        }}>
                          {daySchedules.length} {daySchedules.length === 1 ? 'turno' : 'turni'}
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                    <button
                      onClick={() => {
                        setAddingDay(isAdding ? null : day)
                        setShiftForm({ technician_id: '', start_time: '09:00', end_time: '18:00' })
                      }}
                      style={{
                        width: 30, height: 30, borderRadius: 9, border: 'none', cursor: 'pointer',
                        background: isAdding ? 'rgba(255,59,48,0.10)' : 'rgba(0,113,227,0.08)',
                        color: isAdding ? 'var(--danger)' : 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, lineHeight: 1,
                        transition: 'all 0.15s',
                      }}>
                      {isAdding ? '×' : '+'}
                    </button>
                    )}
                  </div>

                  {/* Shift chips */}
                  {daySchedules.length > 0 && (
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {daySchedules.map(s => {
                        const tech = technicians.find(x => x.id === s.technician_id)
                        const init = (tech?.display_name ?? '?').charAt(0).toUpperCase()
                        const online = isOnline(tech?.last_seen, now)
                        return (
                          <div key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                            borderRadius: 10, background: 'rgba(0,113,227,0.06)',
                            border: '1px solid rgba(0,113,227,0.12)',
                          }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: 'linear-gradient(135deg, #0071e3 0%, #00a2ff 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, color: 'white',
                              }}>
                                {init}
                              </div>
                              {isAdmin && (
                                <span title={online ? 'Collegato' : 'Non collegato'} style={{
                                  position: 'absolute', right: -2, bottom: -2,
                                  width: 10, height: 10, borderRadius: '50%',
                                  background: online ? '#34c759' : '#c7c7cc',
                                  border: '2px solid var(--surface)',
                                }} />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                                {tech?.display_name ?? '—'}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                                {s.start_time} – {s.end_time}
                                {isAdmin && (
                                  <span style={{ color: online ? '#34c759' : 'var(--text-tertiary)', fontWeight: 500 }}>
                                    {' · '}{online ? 'collegato' : 'non collegato'}
                                  </span>
                                )}
                              </p>
                            </div>
                            {isAdmin && (
                              <button onClick={() => removeShift(s.id)} style={{
                                width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
                                background: 'rgba(255,59,48,0.10)', color: 'var(--danger)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, flexShrink: 0,
                              }}>×</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Add shift form */}
                  {isAdding && (
                    <form onSubmit={e => addShift(e, day)} style={{
                      padding: '12px 14px',
                      borderTop: daySchedules.length > 0 ? '1px solid var(--border)' : 'none',
                      background: 'var(--surface-2)',
                    }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <div style={{ flex: '1 1 160px' }}>
                          <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Tecnico</label>
                          <select required value={shiftForm.technician_id}
                            onChange={e => setShiftForm(p => ({ ...p, technician_id: e.target.value }))}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 13,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                            }}>
                            <option value="">Seleziona...</option>
                            {activeTechs.map(t => (
                              <option key={t.id} value={t.id}>{t.display_name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: '0 1 100px' }}>
                          <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Dalle</label>
                          <input type="time" value={shiftForm.start_time}
                            onChange={e => setShiftForm(p => ({ ...p, start_time: e.target.value }))}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 13,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                            }} />
                        </div>
                        <div style={{ flex: '0 1 100px' }}>
                          <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Alle</label>
                          <input type="time" value={shiftForm.end_time}
                            onChange={e => setShiftForm(p => ({ ...p, end_time: e.target.value }))}
                            style={{
                              width: '100%', padding: '8px 10px', borderRadius: 9, fontSize: 13,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                            }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" disabled={shiftLoading} style={{
                          padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                          background: 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600,
                        }}>
                          {shiftLoading ? '...' : 'Salva turno'}
                        </button>
                        <button type="button" onClick={() => setAddingDay(null)} style={{
                          padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                        }}>
                          Annulla
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Technician ── */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div style={{
            background: 'var(--surface)', borderRadius: 24,
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            width: '100%', maxWidth: 480, padding: 28,
          }}>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: 4 }}>
              {editingTech ? 'Modifica tecnico' : 'Aggiungi tecnico'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              {editingTech
                ? 'Modifica i dati del tecnico'
                : 'Il tecnico riceverà un\'email con il link per impostare la sua password'}
            </p>

            <form onSubmit={saveTech}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ModalField
                  label="Nome e cognome *"
                  value={form.display_name}
                  onChange={v => setForm(p => ({ ...p, display_name: v }))}
                  placeholder="Mario Rossi"
                  required
                />
                <ModalField
                  label="Email *"
                  type="email"
                  value={form.email}
                  onChange={v => setForm(p => ({ ...p, email: v }))}
                  placeholder="mario.rossi@fenix.it"
                  required
                  disabled={!!editingTech}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <ModalField
                    label="Telefono"
                    value={form.phone}
                    onChange={v => setForm(p => ({ ...p, phone: v }))}
                    placeholder="+39 320 000 0000"
                  />
                  <ModalField
                    label="WhatsApp"
                    value={form.whatsapp}
                    onChange={v => setForm(p => ({ ...p, whatsapp: v }))}
                    placeholder="+39 320 000 0000"
                  />
                </div>
              </div>

              {formError && (
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,59,48,0.08)', color: '#ff3b30', fontSize: 13,
                }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(52,199,89,0.08)', color: '#34c759', fontSize: 13,
                  }}>
                    {formSuccess}
                  </div>
                  {inviteLink && (
                    <div style={{ marginTop: 10 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Copia e invia questo link al tecnico (valido 24h):
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          readOnly
                          value={inviteLink}
                          style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 11,
                            border: '1px solid var(--border)', background: 'var(--surface-2)',
                            color: 'var(--text-secondary)', overflow: 'hidden',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(inviteLink) }}
                          style={{
                            padding: '8px 14px', borderRadius: 8, border: 'none',
                            background: 'var(--accent)', color: 'white',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          Copia
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  flex: 1, padding: 12, borderRadius: 12, border: '1px solid var(--border)',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 14, color: 'var(--text-secondary)',
                }}>
                  Annulla
                </button>
                <button type="submit" disabled={formLoading} style={{
                  flex: 2, padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'var(--accent)', color: 'white',
                  fontSize: 14, fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(0,113,227,0.3)',
                  opacity: formLoading ? 0.7 : 1,
                }}>
                  {formLoading ? 'Salvataggio...' : editingTech ? 'Salva modifiche' : 'Aggiungi e invia invito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function ActionBtn({
  onClick, label, danger, success,
}: {
  onClick: () => void; label: string; danger?: boolean; success?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 11px', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 500,
      background: danger
        ? 'rgba(255,59,48,0.08)'
        : success
          ? 'rgba(52,199,89,0.08)'
          : 'var(--surface-2)',
      color: danger ? '#ff3b30' : success ? '#34c759' : 'var(--text-secondary)',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

function ModalField({
  label, value, onChange, placeholder, type = 'text', required, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean; disabled?: boolean
}) {
  return (
    <div>
      <label style={{
        fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
        display: 'block', marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 13px', borderRadius: 10, fontSize: 14,
          background: disabled ? 'var(--surface-3)' : 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => !disabled && (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}
