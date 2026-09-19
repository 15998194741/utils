function validCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}
function validIdDate(id: string): boolean {
  const year = Number(id.length === 18 ? id.slice(6, 10) : `19${id.slice(6, 8)}`)
  const month = Number(id.length === 18 ? id.slice(10, 12) : id.slice(8, 10))
  const day = Number(id.length === 18 ? id.slice(12, 14) : id.slice(10, 12))
  return validCalendarDate(year, month, day)
}
export function isId(id: string): boolean {
  if (/^[1-9]\d{14}$/.test(id)) return validIdDate(id)
  if (!/^[1-9]\d{16}[0-9Xx]$/.test(id) || !validIdDate(id)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checks = '10X98765432'
  const sum = weights.reduce((total, weight, index) => total + Number(id[index]) * weight, 0)
  return checks[sum % 11] === id[17].toUpperCase()
}
export function isEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) }
/** Mainland China mobile-number shape; allocation and ownership are not verified. */
export function isPhoneNumer(value: string | number): boolean { return /^1[3-9]\d{9}$/.test(String(value)) }
export function isDomainName(value: string): boolean {
  if (value.length > 253 || value.endsWith('.')) return false
  const labels = value.split('.')
  return labels.length > 1 && labels.every(label => /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/.test(label)) && /^[A-Za-z]{2,63}$/.test(labels[labels.length - 1])
}
export function isInternetUrl(value: string): boolean {
  try { const url = new URL(value); return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname) } catch { return false }
}
/** Valid YYYY-M-D or YYYY-MM-DD calendar date. Legacy name retained. */
export function isData(value: string): boolean {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  return Boolean(match && validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3])))
}
export const isDate = isData
export function isXml(value: string): boolean { return /^(?!\.)(?!.*[\\/])[^\0]+\.xml$/i.test(value) }
export function isChinese(value: string): boolean { return /^\p{Script=Han}+$/u.test(value) }
export function isIp(value: string): boolean {
  const parts = value.split('.')
  return parts.length === 4 && parts.every(part => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255)
}
export function isLowerCase(value: string): boolean { return /^[a-z]+$/.test(value) }
export function isUpperCase(value: string): boolean { return /^[A-Z]+$/.test(value) }
export function isAlphabets(value: string): boolean { return /^[A-Za-z]+$/.test(value) }

const validators: Record<string, (value: string) => boolean> = { isId, isEmail, isPhoneNumer, isDomainName, isInternetUrl, isData, isDate, isXml, isChinese, isIp, isLowerCase, isUpperCase, isAlphabets }
/** Compatibility wrapper. Prefer named validator functions for type safety. */
export default class Is {
  [key: string]: any
  constructor(public regs: Record<string, RegExp | RegExp[]> = {}) {
    for (const [name, validator] of Object.entries(validators)) this[name] = (value: string, custom?: string | RegExp) => custom ? (typeof custom === 'string' ? new RegExp(custom) : custom).test(value) : validator(value)
    for (const [name, rule] of Object.entries(regs)) this[name] = (value: string) => (Array.isArray(rule) ? rule.some(item => item.test(value)) : rule.test(value))
  }
}
