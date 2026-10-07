export type ShiftPart = 'morning' | 'evening'

export type Employee = {
  id: string
  name: string
  defaultRate: number
}

export type Client = {
  id: string
  name: string
}

export type Shift = {
  id: string
  date: string // YYYY-MM-DD
  employeeId: string
  clientId: string
  part: ShiftPart
  hours: number
  rate: number
  startTime?: string
  endTime?: string
}

export type AppData = {
  employees: Employee[]
  clients: Client[]
  shifts: Shift[]
  jobs: OpenJob[]
}

export type OpenJob = {
  id: string
  date: string
  clientId: string
  part: ShiftPart
  notes?: string
  estimatedHours?: number
  status: 'open' | 'claimed' | 'cancelled'
  claimedByEmployeeId?: string
  claimedAt?: string
  createdAt: string
}
