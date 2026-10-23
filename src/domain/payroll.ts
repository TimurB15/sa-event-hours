/** Monetary values are integer agorot; round half up once per line. */
export function integer(value: number, label: string, min = 0): number {
  if (!Number.isSafeInteger(value) || value < min) throw new Error(`Invalid ${label}`)
  return value
}
export function minutesFromRange(start: string, end: string, breakMinutes = 0): number {
  const parse = (s: string) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s)) throw new Error('Invalid time')
    const [h, m] = s.split(':').map(Number)
    return h * 60 + m
  }
  const delta = parse(end) - parse(start)
  const elapsed = delta < 0 ? delta + 1440 : delta
  integer(breakMinutes, 'break')
  if (breakMinutes > elapsed) throw new Error('Break exceeds shift')
  return elapsed - breakMinutes
}
function roundedProduct(a: number, b: number, divisor: number) {
  const value = (BigInt(integer(a, 'minutes')) * BigInt(integer(b, 'rate')) + BigInt(divisor / 2)) / BigInt(divisor)
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount overflow')
  return Number(value)
}
export type PayPolicy = { kind: 'hourly' | 'minimum' | 'fixed'; rateAgorot: number; minimumAgorot: number; fixedAgorot: number }
export function calculatePay(minutes: number, policy: PayPolicy): number {
  integer(minutes, 'minutes')
  for (const v of [policy.rateAgorot, policy.minimumAgorot, policy.fixedAgorot]) integer(v, 'policy')
  if (!minutes) return 0
  if (policy.kind === 'fixed') return policy.fixedAgorot
  const hourly = roundedProduct(minutes, policy.rateAgorot, 60)
  return policy.kind === 'minimum' ? Math.max(policy.minimumAgorot, hourly) : hourly
}
export type Adjustment = { sourceId: string; kind: 'fuel' | 'transport' | 'bonus' | 'additional_worker'; amountAgorot: number }
export function adjustmentTotal(entries: Adjustment[]): number {
  const seen = new Set<string>()
  return entries.reduce((sum, entry) => {
    if (!entry.sourceId || seen.has(entry.sourceId)) throw new Error('Duplicate or missing expense source')
    seen.add(entry.sourceId)
    return integer(sum + integer(entry.amountAgorot, 'adjustment'), 'total')
  }, 0)
}
export function reconcile(totalAgorot: number, payments: { id: string; amountAgorot: number }[]) {
  integer(totalAgorot, 'total')
  const ids = new Set<string>()
  const paid = payments.reduce((sum, p) => {
    if (!p.id || ids.has(p.id)) throw new Error('Duplicate payment')
    ids.add(p.id)
    return integer(sum + integer(p.amountAgorot, 'payment', 1), 'paid')
  }, 0)
  if (paid > totalAgorot) throw new Error('Payment exceeds balance')
  return { paid, outstanding: totalAgorot - paid, status: paid === totalAgorot ? 'paid' : paid ? 'partial' : 'unpaid' }
}
export function businessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function csvCell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
