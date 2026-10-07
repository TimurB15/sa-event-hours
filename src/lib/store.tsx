import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, Client, Employee, OpenJob, Shift } from './types'
import {
  loadData,
  newClient,
  newEmployee,
  newJob,
  newShift,
  resetSeed,
  saveData,
} from './storage'

type Store = {
  data: AppData
  addEmployee: (name: string, rate: number) => void
  updateEmployee: (id: string, patch: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  addClient: (name: string) => void
  updateClient: (id: string, patch: Partial<Client>) => void
  deleteClient: (id: string) => void
  addShift: (s: Omit<Shift, 'id'>) => void
  updateShift: (id: string, patch: Partial<Shift>) => void
  deleteShift: (id: string) => void
  addJob: (j: Omit<OpenJob, 'id' | 'status' | 'createdAt' | 'claimedByEmployeeId' | 'claimedAt'>) => void
  updateJob: (id: string, patch: Partial<OpenJob>) => void
  cancelJob: (id: string) => void
  claimJob: (jobId: string, employeeId: string) => boolean
  resetDemo: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  const commit = useCallback((next: AppData) => {
    setData(next)
    saveData(next)
  }, [])

  const api = useMemo<Store>(
    () => ({
      data,
      addEmployee: (name, rate) =>
        commit({ ...data, employees: [...data.employees, newEmployee(name, rate)] }),
      updateEmployee: (id, patch) =>
        commit({
          ...data,
          employees: data.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }),
      deleteEmployee: (id) =>
        commit({
          ...data,
          employees: data.employees.filter((e) => e.id !== id),
          shifts: data.shifts.filter((s) => s.employeeId !== id),
          jobs: data.jobs.map((j) =>
            j.claimedByEmployeeId === id && j.status === 'claimed'
              ? { ...j, status: 'open', claimedByEmployeeId: undefined, claimedAt: undefined }
              : j,
          ),
        }),
      addClient: (name) =>
        commit({ ...data, clients: [...data.clients, newClient(name)] }),
      updateClient: (id, patch) =>
        commit({
          ...data,
          clients: data.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),
      deleteClient: (id) =>
        commit({
          ...data,
          clients: data.clients.filter((c) => c.id !== id),
          shifts: data.shifts.filter((s) => s.clientId !== id),
          jobs: data.jobs.filter((j) => j.clientId !== id),
        }),
      addShift: (s) => commit({ ...data, shifts: [newShift(s), ...data.shifts] }),
      updateShift: (id, patch) =>
        commit({
          ...data,
          shifts: data.shifts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }),
      deleteShift: (id) =>
        commit({ ...data, shifts: data.shifts.filter((s) => s.id !== id) }),
      addJob: (j) => commit({ ...data, jobs: [newJob(j), ...data.jobs] }),
      updateJob: (id, patch) =>
        commit({
          ...data,
          jobs: data.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        }),
      cancelJob: (id) =>
        commit({
          ...data,
          jobs: data.jobs.map((j) => (j.id === id ? { ...j, status: 'cancelled' } : j)),
        }),
      claimJob: (jobId, employeeId) => {
        const job = data.jobs.find((j) => j.id === jobId)
        const emp = data.employees.find((e) => e.id === employeeId)
        if (!job || job.status !== 'open' || !emp) return false
        const hours = job.estimatedHours && job.estimatedHours > 0 ? job.estimatedHours : 8
        const shift = newShift({
          date: job.date,
          employeeId,
          clientId: job.clientId,
          part: job.part,
          hours,
          rate: emp.defaultRate,
        })
        commit({
          ...data,
          jobs: data.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  status: 'claimed',
                  claimedByEmployeeId: employeeId,
                  claimedAt: new Date().toISOString(),
                }
              : j,
          ),
          shifts: [shift, ...data.shifts],
        })
        return true
      },
      resetDemo: () => commit(resetSeed()),
    }),
    [data, commit],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
