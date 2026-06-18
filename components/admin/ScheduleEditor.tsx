'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const DAYS_FULL = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

interface Technician { id: string; display_name: string | null; whatsapp: string | null; email: string | null; role: string }
interface Schedule { id: string; technician_id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean }

export default function ScheduleEditor({
  technicians, schedules,
}: { technicians: Technician[]; schedules: Schedule[] }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ technician_id: '', day_of_week: 1, start_time: '09:00', end_time: '18:00' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function addSchedule(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setAdding(false)
    router.refresh()
    setLoading(false)
  }

  async function removeSchedule(id: string) {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  // Raggruppa turni per giorno
  const byDay = Array.from({ length: 7 }, (_, i) =>
    schedules.filter(s => s.day_of_week === i)
  )

  return (
    <div className="space-y-4">
      {/* Griglia settimanale */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {byDay.map((daySchedules, day) => (
          <div key={day} className="rounded-xl p-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: '100px' }}>
            <p className="text-xs font-semibold mb-2"
              style={{ color: day === 0 || day === 6 ? 'var(--warning)' : 'var(--text-secondary)' }}>
              {DAYS[day]}
            </p>
            {daySchedules.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--border)' }}>—</p>
            ) : (
              <div className="space-y-2">
                {daySchedules.map(s => {
                  const tech = technicians.find(t => t.id === s.technician_id)
                  return (
                    <div key={s.id} className="rounded-lg p-2 relative group"
                      style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)' }}>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {tech?.display_name ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {s.start_time}–{s.end_time}
                      </p>
                      <button onClick={() => removeSchedule(s.id)}
                        className="absolute top-1 right-1 w-4 h-4 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                        style={{ background: 'var(--danger)', color: 'white' }}>
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tecnici */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Tecnici disponibili</h3>
          <button onClick={() => setAdding(!adding)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'var(--accent)', color: 'white' }}>
            + Aggiungi turno
          </button>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {technicians.map(tech => (
            <div key={tech.id} className="px-5 py-3.5 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}>
                {tech.display_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {tech.display_name ?? 'Senza nome'}
                </p>
                <div className="flex items-center gap-3">
                  {tech.whatsapp && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
                      <span>●</span> WA: {tech.whatsapp}
                    </span>
                  )}
                  {tech.email && (
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tech.email}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form aggiunta turno */}
        {adding && (
          <form onSubmit={addSchedule} className="px-5 py-4 space-y-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Tecnico</label>
                <select required value={form.technician_id}
                  onChange={e => setForm(p => ({ ...p, technician_id: e.target.value }))}
                  className="w-full px-2 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  <option value="">Seleziona...</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Giorno</label>
                <select value={form.day_of_week}
                  onChange={e => setForm(p => ({ ...p, day_of_week: Number(e.target.value) }))}
                  className="w-full px-2 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {DAYS_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Dalle</label>
                <input type="time" value={form.start_time}
                  onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                  className="w-full px-2 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Alle</label>
                <input type="time" value={form.end_time}
                  onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                  className="w-full px-2 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--accent)', color: 'white' }}>
                {loading ? '...' : 'Salva turno'}
              </button>
              <button type="button" onClick={() => setAdding(false)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                Annulla
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
