function words(value: string): string[] {
  return value.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean)
}

/**
 * Uppercases the first character and leaves the rest of the string untouched.
 *
 * @param value - The source string.
 * @returns The string with its first character uppercased, or an empty string when the input is empty.
 *
 * @example
 * ```ts
 * capitalize('hello world'); // 'Hello world'
 * ```
 */
export function capitalize(value: string): string {
  const characters = Array.from(value)
  return characters.length ? characters[0].toUpperCase() + characters.slice(1).join('') : ''
}
/**
 * Converts a string to camelCase.
 *
 * Words are split on whitespace, underscores, hyphens, and case boundaries.
 *
 * @param value - The source string.
 * @returns The camelCase form of the string.
 *
 * @example
 * ```ts
 * camelCase('hello world-foo'); // 'helloWorldFoo'
 * camelCase('FooBar'); // 'fooBar'
 * ```
 */
export function camelCase(value: string): string {
  return words(value).map((word, index) => index ? capitalize(word.toLowerCase()) : word.toLowerCase()).join('')
}
/**
 * Converts a string to kebab-case.
 *
 * Words are split on whitespace, underscores, hyphens, and case boundaries.
 *
 * @param value - The source string.
 * @returns The kebab-case form of the string.
 *
 * @example
 * ```ts
 * kebabCase('helloWorld'); // 'hello-world'
 * kebabCase('Foo Bar'); // 'foo-bar'
 * ```
 */
export function kebabCase(value: string): string { return words(value).map(word => word.toLowerCase()).join('-') }

/**
 * Shortens a string to the given length, replacing the tail with a suffix.
 *
 * Length counts Unicode code points, including the suffix.
 *
 * @param value - The source string.
 * @param length - Maximum length of the result, suffix included. Must be a non-negative integer.
 * @param suffix - The marker appended to a truncated string. Default: `'...'`.
 * @returns The original string when it is short enough, otherwise the truncated string with the suffix.
 * @throws {RangeError} When `length` is not a non-negative integer.
 *
 * @example
 * ```ts
 * truncate('abcdefgh', 5); // 'ab...'
 * truncate('abcdefgh', 5, '~'); // 'abcd~'
 * ```
 */
export function truncate(value: string, length: number, suffix = '...'): string {
  if (!Number.isInteger(length) || length < 0) throw new RangeError('length must be a non-negative integer')
  const characters = Array.from(value)
  if (characters.length <= length) return value
  const ending = Array.from(suffix).slice(0, length)
  return characters.slice(0, length - ending.length).join('') + ending.join('')
}
