import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { formatILS, shiftAmount } from '../lib/storage'

export default function Home() {
  const { data } = useStore()
  const emp = Object.fromEntries(data.employees.map((e) => [e.id, e.name]))
  const cli = Object.fromEntries(data.clients.map((c) => [c.id, c.name]))
  const recent = [...data.shifts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)

  return (
    <div className="space-y-4">
      <Link to="/shift/new" className="btn-primary w-full py-4 text-lg">
        <Plus className="h-5 w-5" /> הוסף משמרת
      </Link>
      <Link to="/jobs" className="btn-secondary w-full">
        עבודות פתוחות / פרסם עבודה
      </Link>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">משמרות אחרונות</h2>
        {recent.length === 0 ? (
          <div className="card text-center text-muted">
            <p>עדיין אין משמרות.</p>
            <Link to="/shift/new" className="btn-secondary mt-3 inline-flex">
              הוסף משמרת ראשונה
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((s) => (
              <li key={s.id}>
                <Link to={`/shift/${s.id}`} className="card block active:bg-[#F5F5F5]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-ink">{emp[s.employeeId] ?? '—'}</div>
                      <div className="text-sm text-muted">
                        {s.date} · אצל {cli[s.clientId] ?? '—'} ·{' '}
                        {s.part === 'morning' ? 'בוקר' : 'ערב'}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-ink">{formatILS(shiftAmount(s))}</div>
                      <div className="text-xs text-muted">{s.hours} שעות</div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
