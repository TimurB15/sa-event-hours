import { useState } from 'react'
import { useStore } from '../lib/store'
import { formatILS } from '../lib/storage'

export default function Employees() {
  const { data, addEmployee, updateEmployee, deleteEmployee } = useStore()
  const [name, setName] = useState('')
  const [rate, setRate] = useState('50')
  const [editing, setEditing] = useState<string | null>(null)
  const [eName, setEName] = useState('')
  const [eRate, setERate] = useState('')

  const submit = () => {
    const r = Number(rate)
    if (!name.trim() || !(r > 0)) return
    addEmployee(name, r)
    setName('')
    setRate('50')
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="font-bold">הוסף עובד</h2>
        <input className="input-field" placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input-field"
          type="number"
          min={1}
          placeholder="תעריף ₪/שעה"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
        <button type="button" className="btn-primary w-full" onClick={submit}>
          שמור עובד
        </button>
      </div>

      {data.employees.length === 0 ? (
        <div className="card text-center text-muted">אין עובדים עדיין.</div>
      ) : (
        <ul className="space-y-2">
          {data.employees.map((e) => (
            <li key={e.id} className="card">
              {editing === e.id ? (
                <div className="space-y-2">
                  <input className="input-field" value={eName} onChange={(ev) => setEName(ev.target.value)} />
                  <input
                    className="input-field"
                    type="number"
                    value={eRate}
                    onChange={(ev) => setERate(ev.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary flex-1"
                      onClick={() => {
                        const r = Number(eRate)
                        if (!eName.trim() || !(r > 0)) return
                        updateEmployee(e.id, { name: eName.trim(), defaultRate: r })
                        setEditing(null)
                      }}
                    >
                      שמירה
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{e.name}</div>
                    <div className="text-sm text-muted">{formatILS(e.defaultRate)} / שעה</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-sm"
                      onClick={() => {
                        setEditing(e.id)
                        setEName(e.name)
                        setERate(String(e.defaultRate))
                      }}
                    >
                      עריכה
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => {
                        if (confirm(`למחוק את ${e.name}?`)) deleteEmployee(e.id)
                      }}
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
