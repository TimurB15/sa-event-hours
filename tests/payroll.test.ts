import { describe, expect, it } from 'vitest'
import { adjustmentTotal, businessDate, calculatePay, csvCell, minutesFromRange, reconcile } from '../src/domain/payroll'
import { previewLegacy } from '../src/domain/migration'
const policy = { kind: 'minimum' as const, rateAgorot: 6500, minimumAgorot: 40000, fixedAgorot: 0 }
describe('financial rules', () => {
  it('calculates overnight work and breaks without assuming 24h for equal times', () => {
    expect(minutesFromRange('17:00', '00:00')).toBe(420)
    expect(minutesFromRange('22:00', '06:00', 30)).toBe(450)
    expect(minutesFromRange('08:00', '08:00')).toBe(0)
    expect(() => minutesFromRange('24:30', '10:00')).toThrow()
    expect(() => minutesFromRange('08:00', '09:00', 90)).toThrow()
  })
  it('uses max(400, hours*65), not a six-hour rate floor', () => {
    expect(calculatePay(0, policy)).toBe(0)
    expect(calculatePay(360, policy)).toBe(40000)
    expect(calculatePay(361, policy)).toBe(40000)
    expect(calculatePay(420, policy)).toBe(45500)
  })
  it('keeps worker wages separate and rounds once per line', () => {
    expect(calculatePay(1, { ...policy, kind: 'hourly', rateAgorot: 5000 })).toBe(83)
    expect(calculatePay(420, { ...policy, kind: 'hourly', rateAgorot: 5000 })).toBe(35000)
    expect(calculatePay(420, { ...policy, kind: 'fixed', fixedAgorot: 30000 })).toBe(30000)
    expect(() => calculatePay(-1, policy)).toThrow()
  })
  it('deduplicates source records and keeps additional worker fees explicit', () => {
    const fuel = { sourceId: 'receipt-1', kind: 'fuel' as const, amountAgorot: 5000 }
    expect(() => adjustmentTotal([fuel, fuel])).toThrow()
    expect(adjustmentTotal([fuel, { sourceId: 'worker-fee-1', kind: 'additional_worker', amountAgorot: 5000 }])).toBe(10000)
  })
  it('rejects duplicate and excess payments while supporting partial payment', () => {
    expect(reconcile(40000, [{ id: 'a', amountAgorot: 10000 }])).toEqual({ paid: 10000, outstanding: 30000, status: 'partial' })
    expect(() => reconcile(40000, [{ id: 'a', amountAgorot: 40001 }])).toThrow()
    expect(() => reconcile(40000, [{ id: 'a', amountAgorot: 1 }, { id: 'a', amountAgorot: 1 }])).toThrow()
  })
  it('uses Jerusalem business dates and escapes spreadsheet formulas', () => {
    expect(businessDate(new Date('2026-10-23T22:00:00Z'))).toBe('2026-10-24')
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"')
  })
})
describe('legacy migration', () => {
  const data = { employees: [{ id: 'e', name: 'טל', defaultRate: 50 }], clients: [{ id: 'c', name: 'לקוח' }], shifts: [], jobs: [] }
  it('previews without mutating source', () => {
    const raw = JSON.stringify(data)
    expect(previewLegacy(raw).counts.employees).toBe(1)
    expect(JSON.stringify(data)).toBe(raw)
  })
  it('rejects duplicate ids, malformed input and orphaned references', () => {
    expect(() => previewLegacy(JSON.stringify({ ...data, employees: [...data.employees, ...data.employees] }))).toThrow()
    expect(() => previewLegacy('{')).toThrow()
    expect(() => previewLegacy(JSON.stringify({ ...data, shifts: [{ id: 's', employeeId: 'missing', clientId: 'c', date: '2026-10-23', part: 'morning', hours: 7, rate: 50 }] }))).toThrow()
  })
})
