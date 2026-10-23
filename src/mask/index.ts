function maskMiddle(value: string, visibleStart: number, visibleEnd: number, character = '*'): string {
  const chars = Array.from(value)
  if (chars.length <= visibleStart + visibleEnd) return character.repeat(chars.length)
  return chars.slice(0, visibleStart).join('') + character.repeat(chars.length - visibleStart - visibleEnd) + chars.slice(chars.length - visibleEnd).join('')
}
/**
 * Masks the middle of a phone number, keeping the first 3 and last 4 digits.
 *
 * @param value - The phone number to mask.
 * @returns The masked number; short inputs are masked entirely.
 *
 * @example
 * ```ts
 * maskPhone(13800138000); // '138****8000'
 * ```
 */
export function maskPhone(value: string | number): string { return maskMiddle(String(value), 3, 4) }
/**
 * Masks the local part of an email address, keeping the first character and the domain.
 *
 * @param value - The email address to mask.
 * @returns The masked address; values without an `@` are returned unchanged.
 *
 * @example
 * ```ts
 * maskEmail('user@example.com'); // 'u***@example.com'
 * ```
 */
export function maskEmail(value: string): string {
  const at = value.lastIndexOf('@')
  if (at <= 0) return value
  return maskMiddle(value.slice(0, at), 1, 0) + value.slice(at)
}
/**
 * Masks a name, keeping only its first character.
 *
 * @param value - The name to mask.
 * @returns The masked name; single-character names are returned unchanged.
 *
 * @example
 * ```ts
 * maskName('张三'); // '张*'
 * ```
 */
export function maskName(value: string): string {
  const chars = Array.from(value)
  return chars.length <= 1 ? value : chars[0] + '*'.repeat(chars.length - 1)
}
/**
 * Masks the middle of a bank card number, keeping the first 4 and last 4 digits.
 *
 * @param value - The card number to mask.
 * @returns The masked number; short inputs are masked entirely.
 *
 * @example
 * ```ts
 * maskBankCard('6222021234567890'); // '6222********7890'
 * ```
 */
export function maskBankCard(value: string | number): string { return maskMiddle(String(value), 4, 4, '*') }
