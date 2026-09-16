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

export function base64ToBlob(base64: string, mimeType?: string | null): Blob {
  const match = /^data:([^,]*);base64,([\s\S]*)$/i.exec(base64)
  if (!match) throw new TypeError('Expected a base64 Data URL')
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType ?? (match[1].split(';')[0] || 'text/plain') })
}

export function base64ToFile(base: string, filename = 'png'): File {
  const blob = base64ToBlob(base)
  return new File([blob], filename, { type: blob.type })
}
export function blobToFile(blob: Blob, fileName = '', type = blob.type || 'image/png'): File {
  return new File([blob], fileName, { type })
}
export function fileToBlob(file: File, callback?: (data: Blob) => void): Promise<Blob> {
  return readBlob(file, false).then(data => {
    const blob = new Blob([data], { type: file.type })
    if (callback) callback(blob)
    return blob
  })
}
export function fileToUrl(file: File): string { return URL.createObjectURL(file) }
export function blobToDataURL(blob: Blob, callback?: (data: string) => void): Promise<string> {
  return readBlob(blob, true).then(data => { if (callback) callback(data); return data })
}
// Legacy names remain available.
export const base64Tofile = base64ToFile
export const bolbToFile = blobToFile
export const fileToBolb = fileToBlob
