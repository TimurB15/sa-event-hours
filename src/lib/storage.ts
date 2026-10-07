import type { AppData, Client, Employee, OpenJob, Shift } from './types'

const KEY = 'shiurei-ovdim-v1'

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export const SEED: AppData = {
  employees: [
    { id: 'e1', name: 'טל', defaultRate: 40 },
    { id: 'e2', name: 'עידו', defaultRate: 50 },
    { id: 'e3', name: 'אבי', defaultRate: 60 },
  ],
  clients: [
    { id: 'c1', name: 'כהן' },
    { id: 'c2', name: 'לוי' },
    { id: 'c3', name: 'מזרחי' },
  ],
  shifts: [],
  jobs: [],
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED))
      return structuredClone(SEED)
    }
    const data = JSON.parse(raw) as AppData
    return {
      employees: data.employees ?? [],
      clients: data.clients ?? [],
      shifts: data.shifts ?? [],
      jobs: data.jobs ?? [],
    }
  } catch {
    return structuredClone(SEED)
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function resetSeed() {
  localStorage.setItem(KEY, JSON.stringify(SEED))
  return structuredClone(SEED)
}

export function newEmployee(name: string, defaultRate: number): Employee {
  return { id: uid('e'), name: name.trim(), defaultRate }
}

export function newClient(name: string): Client {
  return { id: uid('c'), name: name.trim() }
}

export function newShift(partial: Omit<Shift, 'id'>): Shift {
  return { ...partial, id: uid('s') }
}

export function formatILS(n: number) {
  return `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`
}

export function shiftAmount(s: Shift) {
  return Math.round(s.hours * s.rate * 100) / 100
}

export function hoursFromRange(start: string, end: string): number | null {
  if (!start || !end) return null
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some((x) => Number.isNaN(x))) return null
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60
  return Math.round((mins / 60) * 100) / 100
}

export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function exportCsv(data: AppData) {
  const emp = Object.fromEntries(data.employees.map((e) => [e.id, e]))
  const cli = Object.fromEntries(data.clients.map((c) => [c.id, c]))
  const header = ['תאריך', 'עובד', 'אצל מי', 'משמרת', 'שעות', 'תעריף', 'סכום']
  const rows = [...data.shifts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => [
      s.date,
      emp[s.employeeId]?.name ?? '',
      cli[s.clientId]?.name ?? '',
      s.part === 'morning' ? 'בוקר' : 'ערב',
      String(s.hours),
      String(s.rate),
      String(shiftAmount(s)),
    ])
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shiurei-ovdim-${todayISO()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function newJob(partial: Omit<OpenJob, 'id' | 'status' | 'createdAt'>): OpenJob {
  return {
    ...partial,
    id: uid('j'),
    status: 'open',
    createdAt: new Date().toISOString(),
  }
}
