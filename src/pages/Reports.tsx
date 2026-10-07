import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { exportCsv, formatILS, shiftAmount, todayISO } from '../lib/storage'

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Reports() {
  const { data } = useStore()
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(todayISO())
  const [tab, setTab] = useState<'employee' | 'client'>('employee')

  const filtered = useMemo(
    () => data.shifts.filter((s) => s.date >= from && s.date <= to),
    [data.shifts, from, to],
  )

  const byEmployee = useMemo(() => {
    const map = new Map<string, { hours: number; amount: number }>()
    for (const s of filtered) {
      const cur = map.get(s.employeeId) ?? { hours: 0, amount: 0 }
      cur.hours += s.hours
      cur.amount += shiftAmount(s)
      map.set(s.employeeId, cur)
    }
    return [...map.entries()].map(([id, v]) => ({
      id,
      name: data.employees.find((e) => e.id === id)?.name ?? '—',
      ...v,
    }))
  }, [filtered, data.employees])

  const byClient = useMemo(() => {
    const map = new Map<string, { hours: number; amount: number }>()
    for (const s of filtered) {
      const cur = map.get(s.clientId) ?? { hours: 0, amount: 0 }
      cur.hours += s.hours
      cur.amount += shiftAmount(s)
      map.set(s.clientId, cur)
    }
    return [...map.entries()].map(([id, v]) => ({
      id,
      name: data.clients.find((c) => c.id === id)?.name ?? '—',
      ...v,
    }))
  }, [filtered, data.clients])

  const rows = tab === 'employee' ? byEmployee : byClient
  const totalH = filtered.reduce((a, s) => a + s.hours, 0)
  const totalA = filtered.reduce((a, s) => a + shiftAmount(s), 0)

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="font-bold">טווח תאריכים</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted">מ־</span>
            <input className="input-field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted">עד</span>
            <input className="input-field" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <button type="button" className="btn-primary w-full" onClick={() => exportCsv({ ...data, shifts: filtered })}>
          ייצוא CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F2F2F2] p-1">
        <button
          type="button"
          className={`rounded-lg py-3 text-sm font-bold ${tab === 'employee' ? 'bg-white text-ink shadow' : 'text-muted'}`}
          onClick={() => setTab('employee')}
        >
          לפי עובד
        </button>
        <button
          type="button"
          className={`rounded-lg py-3 text-sm font-bold ${tab === 'client' ? 'bg-white text-ink shadow' : 'text-muted'}`}
          onClick={() => setTab('client')}
        >
          לפי לקוח
        </button>
      </div>

      <div className="card flex justify-between font-bold text-ink">
        <span>סה״כ בטווח</span>
        <span>
          {totalH} שע׳ · {formatILS(totalA)}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center text-muted">אין משמרות בטווח הזה.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card flex items-center justify-between">
              <div className="font-bold">{r.name}</div>
              <div className="text-left text-sm">
                <div className="font-bold text-ink">{formatILS(r.amount)}</div>
                <div className="text-muted">{r.hours} שעות</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
