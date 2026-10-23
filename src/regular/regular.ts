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
/**
 * Checks whether a value is a valid Chinese resident identity card number.
 *
 * Validates the 15- and 18-digit formats, including the embedded date and the 18-digit checksum.
 *
 * @param id - The identity card number to check.
 * @returns `true` when the number passes every check.
 */
export function isId(id: string): boolean {
  if (/^[1-9]\d{14}$/.test(id)) return validIdDate(id)
  if (!/^[1-9]\d{16}[0-9Xx]$/.test(id) || !validIdDate(id)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checks = '10X98765432'
  const sum = weights.reduce((total, weight, index) => total + Number(id[index]) * weight, 0)
  return checks[sum % 11] === id[17].toUpperCase()
}
/**
 * Checks whether a value looks like an email address.
 *
 * @param value - The address to check.
 * @returns `true` for a local part, an `@`, and a domain containing a dot.
 */
export function isEmail(value: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) }
/** Mainland China mobile-number shape; allocation and ownership are not verified. */
export function isPhoneNumer(value: string | number): boolean { return /^1[3-9]\d{9}$/.test(String(value)) }
/**
 * Checks whether a value is a domain name.
 *
 * The name must have at least two labels, each 1 to 63 characters, and an alphabetic top-level label.
 *
 * @param value - The domain name to check.
 * @returns `true` when the name is well formed.
 */
export function isDomainName(value: string): boolean {
  if (value.length > 253 || value.endsWith('.')) return false
  const labels = value.split('.')
  return labels.length > 1 && labels.every(label => /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/.test(label)) && /^[A-Za-z]{2,63}$/.test(labels[labels.length - 1])
}
/**
 * Checks whether a value is an absolute http or https URL.
 *
 * @param value - The URL to check.
 * @returns `true` when the URL parses and uses the `http` or `https` protocol.
 */
export function isInternetUrl(value: string): boolean {
  try { const url = new URL(value); return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname) } catch { return false }
}
/** Valid YYYY-M-D or YYYY-MM-DD calendar date. Legacy name retained. */
export function isData(value: string): boolean {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  return Boolean(match && validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3])))
}
/**
 * Checks whether a value is a calendar date in `YYYY-M-D` or `YYYY-MM-DD` form.
 *
 * Alias of {@link isData}.
 *
 * @param value - The date string to check.
 * @returns `true` when the string is a real calendar date.
 */
export const isDate = isData
/**
 * Checks whether a value is an XML file name.
 *
 * The name must end with `.xml`, must not start with a dot, and must not contain a path separator.
 *
 * @param value - The file name to check.
 * @returns `true` when the name looks like an XML file.
 */
export function isXml(value: string): boolean { return /^(?!\.)(?!.*[\\/])[^\0]+\.xml$/i.test(value) }
/**
 * Checks whether a value consists only of Chinese characters.
 *
 * @param value - The text to check.
 * @returns `true` when every character belongs to the Han script.
 */
export function isChinese(value: string): boolean { return /^\p{Script=Han}+$/u.test(value) }
/**
 * Checks whether a value is an IPv4 address.
 *
 * @param value - The address to check.
 * @returns `true` for four dot-separated decimal octets from 0 to 255.
 */
export function isIp(value: string): boolean {
  const parts = value.split('.')
  return parts.length === 4 && parts.every(part => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255)
}
/**
 * Checks whether a value contains only lowercase letters.
 *
 * @param value - The text to check.
 * @returns `true` for a non-empty string of `a` to `z` only.
 */
export function isLowerCase(value: string): boolean { return /^[a-z]+$/.test(value) }
/**
 * Checks whether a value contains only uppercase letters.
 *
 * @param value - The text to check.
 * @returns `true` for a non-empty string of `A` to `Z` only.
 */
export function isUpperCase(value: string): boolean { return /^[A-Z]+$/.test(value) }
/**
 * Checks whether a value contains only Latin letters.
 *
 * @param value - The text to check.
 * @returns `true` for a non-empty string of `a` to `z` and `A` to `Z` only.
 */
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
