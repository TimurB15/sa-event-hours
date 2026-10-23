import { z } from 'zod'
const id = z.string().min(1).max(160)
const day = z.iso.date()
const part = z.enum(['morning', 'evening'])
export const legacySchema = z.object({
  employees: z.array(z.object({ id, name: z.string().trim().min(1).max(150), defaultRate: z.number().finite().nonnegative().max(100000) })),
  clients: z.array(z.object({ id, name: z.string().trim().min(1).max(150) })),
  shifts: z.array(z.object({ id, date: day, employeeId: id, clientId: id, part, hours: z.number().finite().positive().max(24), rate: z.number().finite().nonnegative().max(100000), startTime: z.string().optional(), endTime: z.string().optional() })),
  jobs: z.array(z.object({ id, date: day, clientId: id, part, status: z.enum(['open', 'claimed', 'cancelled']), estimatedHours: z.number().finite().positive().max(24).optional(), notes: z.string().max(10000).optional(), claimedByEmployeeId: id.optional(), claimedAt: z.string().optional(), createdAt: z.string() })),
})
export function validateLegacy(input: unknown) {
  const data = legacySchema.parse(input)
  for (const rows of [data.employees, data.clients, data.shifts, data.jobs]) {
    if (new Set(rows.map(r => r.id)).size !== rows.length) throw new Error('Duplicate record ID')
  }
  for (const s of data.shifts) {
    if (!data.employees.some(e => e.id === s.employeeId) || !data.clients.some(c => c.id === s.clientId)) throw new Error('Missing shift reference')
  }
  for (const j of data.jobs) {
    if (!data.clients.some(c => c.id === j.clientId) || (j.claimedByEmployeeId && !data.employees.some(e => e.id === j.claimedByEmployeeId))) throw new Error('Missing job reference')
  }
  return data
}
export function previewLegacy(raw: string) {
  const data = validateLegacy(JSON.parse(raw))
  return { data, counts: { employees: data.employees.length, customers: data.clients.length, shifts: data.shifts.length, jobs: data.jobs.length } }
}
