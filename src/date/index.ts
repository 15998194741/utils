const pad = (value: number, length = 2) => String(value).padStart(length, '0')

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/** Formats a valid Date in local time. Supported tokens: YYYY, MM, DD, HH, mm, ss, SSS. */
export function formatDate(value: Date, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!isValidDate(value)) throw new RangeError('Invalid date')
  const tokens: Record<string, string> = {
    YYYY: pad(value.getFullYear(), 4), MM: pad(value.getMonth() + 1), DD: pad(value.getDate()),
    HH: pad(value.getHours()), mm: pad(value.getMinutes()), ss: pad(value.getSeconds()), SSS: pad(value.getMilliseconds(), 3)
  }
  return pattern.replace(/YYYY|SSS|MM|DD|HH|mm|ss/g, token => tokens[token])
}

/** Adds calendar days in local time without mutating the input. */
export function addDays(value: Date, amount: number): Date {
  if (!isValidDate(value)) throw new RangeError('Invalid date')
  if (!Number.isInteger(amount)) throw new RangeError('amount must be an integer')
  const result = new Date(value.getTime())
  result.setDate(result.getDate() + amount)
  return result
}

/** Difference in local calendar days, ignoring time of day and daylight-saving transitions. */
export function differenceInDays(left: Date, right: Date): number {
  if (!isValidDate(left) || !isValidDate(right)) throw new RangeError('Invalid date')
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((day(left) - day(right)) / 86400000)
}
