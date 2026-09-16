import xlsx from 'xlsx'

function rows<T>(workbook: xlsx.WorkBook, sheetName?: string): T[] {
  const name = sheetName ?? workbook.SheetNames[0]
  const sheet = workbook.Sheets[name]
  if (!sheet) throw new Error(`Worksheet not found: ${name}`)
  return xlsx.utils.sheet_to_json<T>(sheet)
}

export function readExcelToJSON<T = Record<string, any>>(file: string, sheetName?: string): T[]
export function readExcelToJSON<T = Record<string, any>>(file: File, sheetName?: string): Promise<T[]>
export function readExcelToJSON<T = Record<string, any>>(file: string | File, sheetName?: string): T[] | Promise<T[]> {
  if (typeof file === 'string') return rows<T>(xlsx.readFile(file), sheetName)
  return file.arrayBuffer().then(buffer => rows<T>(xlsx.read(buffer, { type: 'array' }), sheetName))
}
