function readBlob(blob: Blob, dataURL: true): Promise<string>
function readBlob(blob: Blob, dataURL: false): Promise<ArrayBuffer>
function readBlob(blob: Blob, dataURL: boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.onabort = () => reject(new Error('File read aborted'))
    if (dataURL) reader.readAsDataURL(blob)
    else reader.readAsArrayBuffer(blob)
  })
}

/** Both overloads return a Promise so read errors can be handled. */
export function fileToBase64(file: File, callback?: (data: string) => void): Promise<string> {
  return readBlob(file, true).then(data => { if (callback) callback(data); return data })
}

/**
 * Converts a base64 Data URL into a Blob.
 *
 * @param base64 - A Data URL such as `data:image/png;base64,...`.
 * @param mimeType - The MIME type of the resulting Blob. Default: the type carried by the Data URL,
 * or `text/plain` when the URL has none.
 * @returns The new Blob.
 * @throws {TypeError} When the input is not a base64 Data URL.
 */
export function base64ToBlob(base64: string, mimeType?: string | null): Blob {
  const match = /^data:([^,]*);base64,([\s\S]*)$/i.exec(base64)
  if (!match) throw new TypeError('Expected a base64 Data URL')
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType ?? (match[1].split(';')[0] || 'text/plain') })
}

/**
 * Converts a base64 Data URL into a File.
 *
 * @param base - A Data URL such as `data:image/png;base64,...`.
 * @param filename - The name of the created file. Default: `'png'`.
 * @returns The new File, carrying the MIME type of the source Data URL.
 * @throws {TypeError} When the input is not a base64 Data URL.
 */
export function base64ToFile(base: string, filename = 'png'): File {
  const blob = base64ToBlob(base)
  return new File([blob], filename, { type: blob.type })
}
/**
 * Wraps a Blob into a File.
 *
 * @param blob - The blob to wrap.
 * @param fileName - The name of the created file. Default: `''`.
 * @param type - The MIME type of the created file. Default: the type of the blob, or `image/png`.
 * @returns The new File.
 */
export function blobToFile(blob: Blob, fileName = '', type = blob.type || 'image/png'): File {
  return new File([blob], fileName, { type })
}
/**
 * Reads a File into a Blob.
 *
 * @param file - The file to read.
 * @param callback - Called with the Blob once the read succeeds.
 * @returns A promise of the Blob.
 */
export function fileToBlob(file: File, callback?: (data: Blob) => void): Promise<Blob> {
  return readBlob(file, false).then(data => {
    const blob = new Blob([data], { type: file.type })
    if (callback) callback(blob)
    return blob
  })
}
/**
 * Creates an object URL for a File.
 *
 * @param file - The file to expose.
 * @returns The object URL. Release it with `URL.revokeObjectURL` when it is no longer needed.
 */
export function fileToUrl(file: File): string { return URL.createObjectURL(file) }
/**
 * Reads a Blob into a base64 Data URL.
 *
 * @param blob - The blob to read.
 * @param callback - Called with the Data URL once the read succeeds.
 * @returns A promise of the Data URL.
 */
export function blobToDataURL(blob: Blob, callback?: (data: string) => void): Promise<string> {
  return readBlob(blob, true).then(data => { if (callback) callback(data); return data })
}
// Legacy names remain available.
/**
 * @deprecated Inconsistent capitalization of a legacy name. Use {@link base64ToFile} instead.
 */
export const base64Tofile = base64ToFile
/**
 * @deprecated Misspelled legacy name. Use {@link blobToFile} instead.
 */
export const bolbToFile = blobToFile
/**
 * @deprecated Misspelled legacy name. Use {@link fileToBlob} instead.
 */
export const fileToBolb = fileToBlob
