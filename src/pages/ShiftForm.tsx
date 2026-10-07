import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { hoursFromRange, todayISO } from '../lib/storage'
import type { ShiftPart } from '../lib/types'

export default function ShiftForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, addShift, updateShift, deleteShift } = useStore()
  const existing = data.shifts.find((s) => s.id === id)

  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [employeeId, setEmployeeId] = useState(existing?.employeeId ?? data.employees[0]?.id ?? '')
  const [clientId, setClientId] = useState(existing?.clientId ?? data.clients[0]?.id ?? '')
  const [part, setPart] = useState<ShiftPart>(existing?.part ?? 'morning')
  const [mode, setMode] = useState<'hours' | 'range'>(
    existing?.startTime && existing?.endTime ? 'range' : 'hours',
  )
  const [hours, setHours] = useState(String(existing?.hours ?? '8'))
  const [startTime, setStartTime] = useState(existing?.startTime ?? '08:00')
  const [endTime, setEndTime] = useState(existing?.endTime ?? '16:00')

  const empRate = useMemo(
    () => data.employees.find((e) => e.id === employeeId)?.defaultRate ?? 50,
    [data.employees, employeeId],
  )
  const [rate, setRate] = useState(String(existing?.rate ?? empRate))
  const [rateTouched, setRateTouched] = useState(!!existing)

  const onEmployeeChange = (eid: string) => {
    setEmployeeId(eid)
    if (!rateTouched) {
      const r = data.employees.find((e) => e.id === eid)?.defaultRate ?? 50
      setRate(String(r))
    }
  }

  const computedHours =
    mode === 'range' ? hoursFromRange(startTime, endTime) : Number(hours)

  const save = () => {
    if (!employeeId || !clientId || !date) return
    const h = computedHours
    const r = Number(rate)
    if (!h || h <= 0 || !(r > 0)) return
    const payload = {
      date,
      employeeId,
      clientId,
      part,
      hours: h,
      rate: r,
      startTime: mode === 'range' ? startTime : undefined,
      endTime: mode === 'range' ? endTime : undefined,
    }
    if (existing) updateShift(existing.id, payload)
    else addShift(payload)
    nav('/')
  }

  if (data.employees.length === 0 || data.clients.length === 0) {
    return (
      <div className="card space-y-3 text-center">
        <p className="text-ink">צריך לפחות עובד אחד ולקוח אחד לפני רישום משמרת.</p>
        <button type="button" className="btn-primary w-full" onClick={() => nav('/employees')}>
          לעובדים
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => nav('/clients')}>
          ללקוחות
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">{existing ? 'עריכת משמרת' : 'הוסף משמרת'}</h2>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-muted">תאריך</span>
        <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-muted">עובד</span>
        <select className="input-field" value={employeeId} onChange={(e) => onEmployeeChange(e.target.value)}>
          {data.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} (₪{e.defaultRate})
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-muted">אצל מי</span>
        <select className="input-field" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          {data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="mb-1 text-sm font-semibold text-muted">בוקר / ערב</div>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['morning', 'בוקר'],
              ['evening', 'ערב'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={`rounded-xl border-2 py-3 font-bold ${
                part === v ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'
              }`}
              onClick={() => setPart(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-sm font-semibold text-muted">שעות</div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-xl border-2 py-2 text-sm font-bold ${
              mode === 'hours' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'
            }`}
            onClick={() => setMode('hours')}
          >
            מספר שעות
          </button>
          <button
            type="button"
            className={`rounded-xl border-2 py-2 text-sm font-bold ${
              mode === 'range' ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'
            }`}
            onClick={() => setMode('range')}
          >
            התחלה–סיום
          </button>
        </div>
        {mode === 'hours' ? (
          <input
            className="input-field"
            type="number"
            min={0.25}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input className="input-field" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        )}
        {mode === 'range' && computedHours != null ? (
          <p className="mt-1 text-sm text-muted">{computedHours} שעות</p>
        ) : null}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-semibold text-muted">תעריף שעתי (₪/שעה)</span>
        <input
          className="input-field"
          type="number"
          min={1}
          value={rate}
          onChange={(e) => {
            setRateTouched(true)
            setRate(e.target.value)
          }}
        />
      </label>

      <button type="button" className="btn-primary w-full py-4 text-lg" onClick={save}>
        שמירה
      </button>
      <button type="button" className="btn-secondary w-full" onClick={() => nav(-1)}>
        ביטול
      </button>
      {existing ? (
        <button
          type="button"
          className="btn-danger w-full"
          onClick={() => {
            if (confirm('למחוק משמרת?')) {
              deleteShift(existing.id)
              nav('/')
            }
          }}
        >
          מחיקת משמרת
        </button>
      ) : null}
    </div>
  )
}
