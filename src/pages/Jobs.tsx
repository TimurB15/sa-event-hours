import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { todayISO } from '../lib/storage'
import type { ShiftPart } from '../lib/types'

export default function Jobs() {
  const { data, addJob, cancelJob, claimJob, updateJob } = useStore()
  const [tab, setTab] = useState<'open' | 'manage'>('open')
  const [date, setDate] = useState(todayISO())
  const [clientId, setClientId] = useState(data.clients[0]?.id ?? '')
  const [part, setPart] = useState<ShiftPart>('morning')
  const [notes, setNotes] = useState('')
  const [est, setEst] = useState('')
  const [claimEmp, setClaimEmp] = useState<Record<string, string>>({})
  const [editId, setEditId] = useState<string | null>(null)

  const openJobs = data.jobs.filter((j) => j.status === 'open').sort((a, b) => a.date.localeCompare(b.date))
  const managed = data.jobs.filter((j) => j.status !== 'cancelled').sort((a, b) => b.date.localeCompare(a.date))
  const cli = Object.fromEntries(data.clients.map((c) => [c.id, c.name]))
  const emp = Object.fromEntries(data.employees.map((e) => [e.id, e.name]))

  const publish = () => {
    if (!clientId || !date) return
    const estimatedHours = est ? Number(est) : undefined
    if (est && !(estimatedHours! > 0)) return
    if (editId) {
      updateJob(editId, {
        date,
        clientId,
        part,
        notes: notes.trim() || undefined,
        estimatedHours,
        status: 'open',
        claimedByEmployeeId: undefined,
        claimedAt: undefined,
      })
      setEditId(null)
    } else {
      addJob({
        date,
        clientId,
        part,
        notes: notes.trim() || undefined,
        estimatedHours,
      })
    }
    setNotes('')
    setEst('')
    setTab('open')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F2F2F2] p-1">
        <button
          type="button"
          className={`rounded-lg py-3 text-sm font-bold ${tab === 'open' ? 'bg-white text-ink shadow' : 'text-muted'}`}
          onClick={() => setTab('open')}
        >
          עבודות פתוחות
        </button>
        <button
          type="button"
          className={`rounded-lg py-3 text-sm font-bold ${tab === 'manage' ? 'bg-white text-ink shadow' : 'text-muted'}`}
          onClick={() => setTab('manage')}
        >
          פרסם / נהל
        </button>
      </div>

      {tab === 'manage' ? (
        <div className="card space-y-3">
          <h2 className="font-bold">{editId ? 'עריכת פרסום' : 'פרסם עבודה'}</h2>
          {!data.clients.length ? (
            <p className="text-sm text-muted">
              אין לקוחות.{' '}
              <Link to="/clients" className="font-semibold text-ink underline">
                הוסף לקוח
              </Link>
            </p>
          ) : (
            <>
              <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <select className="input-field" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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
              <input
                className="input-field"
                placeholder="שעות משוערות (אופציונלי)"
                type="number"
                min={0.25}
                step={0.25}
                value={est}
                onChange={(e) => setEst(e.target.value)}
              />
              <textarea
                className="input-field min-h-20"
                placeholder="הערות (אופציונלי)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button type="button" className="btn-primary w-full" onClick={publish}>
                {editId ? 'שמור שינויים' : 'פרסם עבודה'}
              </button>
              {editId ? (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={() => {
                    setEditId(null)
                    setNotes('')
                    setEst('')
                  }}
                >
                  ביטול עריכה
                </button>
              ) : null}
            </>
          )}

          <h3 className="pt-2 font-bold text-ink">פרסומים</h3>
          {managed.length === 0 ? (
            <p className="text-sm text-muted">אין פרסומים.</p>
          ) : (
            <ul className="space-y-2">
              {managed.map((j) => (
                <li key={j.id} className="rounded-xl border border-line p-3">
                  <div className="font-bold">
                    {j.date} · {cli[j.clientId] ?? '—'} · {j.part === 'morning' ? 'בוקר' : 'ערב'}
                  </div>
                  <div className="text-sm text-muted">
                    {j.status === 'open'
                      ? 'פתוח'
                      : `נלקח ע״י ${emp[j.claimedByEmployeeId ?? ''] ?? '—'}`}
                  </div>
                  {j.status === 'open' ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary px-3 py-2 text-sm"
                        onClick={() => {
                          setEditId(j.id)
                          setDate(j.date)
                          setClientId(j.clientId)
                          setPart(j.part)
                          setNotes(j.notes ?? '')
                          setEst(j.estimatedHours ? String(j.estimatedHours) : '')
                        }}
                      >
                        עריכה
                      </button>
                      <button type="button" className="btn-danger" onClick={() => cancelJob(j.id)}>
                        בטל פרסום
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : openJobs.length === 0 ? (
        <div className="card text-center text-muted">
          <p>אין עבודות פתוחות כרגע.</p>
          <button type="button" className="btn-secondary mt-3 inline-flex" onClick={() => setTab('manage')}>
            פרסם עבודה
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {openJobs.map((j) => {
            const selected = claimEmp[j.id] ?? data.employees[0]?.id ?? ''
            return (
              <li key={j.id} className="card space-y-2">
                <div className="font-bold text-lg">
                  {cli[j.clientId] ?? '—'} · {j.part === 'morning' ? 'בוקר' : 'ערב'}
                </div>
                <div className="text-sm text-muted">{j.date}</div>
                {j.estimatedHours ? (
                  <div className="text-sm text-muted">~{j.estimatedHours} שעות</div>
                ) : null}
                {j.notes ? <p className="text-sm text-ink">{j.notes}</p> : null}
                {data.employees.length === 0 ? (
                  <p className="text-sm text-red-700">אין עובדים — הוסיפו עובד לפני לקיחה.</p>
                ) : (
                  <>
                    <select
                      className="input-field"
                      value={selected}
                      onChange={(e) => setClaimEmp((m) => ({ ...m, [j.id]: e.target.value }))}
                    >
                      {data.employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={() => {
                        if (!selected) return
                        claimJob(j.id, selected)
                      }}
                    >
                      אני לוקח
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
