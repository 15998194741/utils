function words(value: string): string[] {
  return value.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean)
}

export function capitalize(value: string): string {
  const characters = Array.from(value)
  return characters.length ? characters[0].toUpperCase() + characters.slice(1).join('') : ''
}
export function camelCase(value: string): string {
  return words(value).map((word, index) => index ? capitalize(word.toLowerCase()) : word.toLowerCase()).join('')
}
export function kebabCase(value: string): string { return words(value).map(word => word.toLowerCase()).join('-') }

/** Length counts Unicode code points, including the suffix. */
export function truncate(value: string, length: number, suffix = '...'): string {
  if (!Number.isInteger(length) || length < 0) throw new RangeError('length must be a non-negative integer')
  const characters = Array.from(value)
  if (characters.length <= length) return value
  const ending = Array.from(suffix).slice(0, length)
  return characters.slice(0, length - ending.length).join('') + ending.join('')
}
