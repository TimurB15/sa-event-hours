import { useState } from 'react'
import { useStore } from '../lib/store'

export default function Clients() {
  const { data, addClient, updateClient, deleteClient } = useStore()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [eName, setEName] = useState('')

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="font-bold">הוסף לקוח / מקום</h2>
        <input className="input-field" placeholder="שם (למשל טל)" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => {
            if (!name.trim()) return
            addClient(name)
            setName('')
          }}
        >
          שמור לקוח
        </button>
      </div>

      {data.clients.length === 0 ? (
        <div className="card text-center text-muted">אין לקוחות עדיין.</div>
      ) : (
        <ul className="space-y-2">
          {data.clients.map((c) => (
            <li key={c.id} className="card">
              {editing === c.id ? (
                <div className="space-y-2">
                  <input className="input-field" value={eName} onChange={(e) => setEName(e.target.value)} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-primary flex-1"
                      onClick={() => {
                        if (!eName.trim()) return
                        updateClient(c.id, { name: eName.trim() })
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
                  <div className="font-bold">{c.name}</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-sm"
                      onClick={() => {
                        setEditing(c.id)
                        setEName(c.name)
                      }}
                    >
                      עריכה
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => {
                        if (confirm(`למחוק את ${c.name}?`)) deleteClient(c.id)
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
