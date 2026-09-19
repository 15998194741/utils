function maskMiddle(value: string, visibleStart: number, visibleEnd: number, character = '*'): string {
  const chars = Array.from(value)
  if (chars.length <= visibleStart + visibleEnd) return character.repeat(chars.length)
  return chars.slice(0, visibleStart).join('') + character.repeat(chars.length - visibleStart - visibleEnd) + chars.slice(chars.length - visibleEnd).join('')
}
export function maskPhone(value: string | number): string { return maskMiddle(String(value), 3, 4) }
export function maskEmail(value: string): string {
  const at = value.lastIndexOf('@')
  if (at <= 0) return value
  return maskMiddle(value.slice(0, at), 1, 0) + value.slice(at)
}
export function maskName(value: string): string {
  const chars = Array.from(value)
  return chars.length <= 1 ? value : chars[0] + '*'.repeat(chars.length - 1)
}
export function maskBankCard(value: string | number): string { return maskMiddle(String(value), 4, 4, '*') }
