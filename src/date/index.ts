const pad = (value: number, length = 2) => String(value).padStart(length, '0')

/**
 * Reports whether a value is a usable Date.
 *
 * @param value - The value to test.
 * @returns `true` when the value is a `Date` whose time is valid.
 *
 * @example
 * ```ts
 * isValidDate(new Date()); // true
 * isValidDate(new Date('nope')); // false
 * ```
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/**
 * Formats a Date using a token pattern.
 *
 * Formats a valid Date in local time. Supported tokens: YYYY, MM, DD, HH, mm, ss, SSS.
 *
 * @param value - The date to format.
 * @param pattern - The token pattern. Default: `'YYYY-MM-DD HH:mm:ss'`.
 * @returns The formatted date string.
 * @throws {RangeError} When the date is invalid.
 *
 * @example
 * ```ts
 * formatDate(new Date(2024, 0, 2, 3, 4, 5)); // '2024-01-02 03:04:05'
 * formatDate(new Date(2024, 0, 2), 'YYYY/MM/DD'); // '2024/01/02'
 * ```
 */
export function formatDate(value: Date, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!isValidDate(value)) throw new RangeError('Invalid date')
  const tokens: Record<string, string> = {
    YYYY: pad(value.getFullYear(), 4), MM: pad(value.getMonth() + 1), DD: pad(value.getDate()),
    HH: pad(value.getHours()), mm: pad(value.getMinutes()), ss: pad(value.getSeconds()), SSS: pad(value.getMilliseconds(), 3)
  }
  return pattern.replace(/YYYY|SSS|MM|DD|HH|mm|ss/g, token => tokens[token])
}

/**
 * Adds calendar days to a date.
 *
 * Adds calendar days in local time without mutating the input.
 *
 * @param value - The starting date.
 * @param amount - The number of days to add. May be negative. Must be an integer.
 * @returns A new Date shifted by the given number of days.
 * @throws {RangeError} When the date is invalid or `amount` is not an integer.
 *
 * @example
 * ```ts
 * addDays(new Date(2024, 0, 1), 5); // Sat Jan 06 2024
 * ```
 */
export function addDays(value: Date, amount: number): Date {
  if (!isValidDate(value)) throw new RangeError('Invalid date')
  if (!Number.isInteger(amount)) throw new RangeError('amount must be an integer')
  const result = new Date(value.getTime())
  result.setDate(result.getDate() + amount)
  return result
}

/**
 * Counts the calendar days between two dates.
 *
 * Difference in local calendar days, ignoring time of day and daylight-saving transitions.
 *
 * @param left - The later date.
 * @param right - The earlier date.
 * @returns The number of days from `right` to `left`; negative when `left` is earlier.
 * @throws {RangeError} When either date is invalid.
 *
 * @example
 * ```ts
 * differenceInDays(new Date(2024, 0, 10), new Date(2024, 0, 1)); // 9
 * ```
 */
export function differenceInDays(left: Date, right: Date): number {
  if (!isValidDate(left) || !isValidDate(right)) throw new RangeError('Invalid date')
  const day = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((day(left) - day(right)) / 86400000)
}
