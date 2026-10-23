import xlsx from 'xlsx'

function rows<T>(workbook: xlsx.WorkBook, sheetName?: string): T[] {
  const name = sheetName ?? workbook.SheetNames[0]
  const sheet = workbook.Sheets[name]
  if (!sheet) throw new Error(`Worksheet not found: ${name}`)
  return xlsx.utils.sheet_to_json<T>(sheet)
}

/**
 * Reads a worksheet into an array of objects.
 *
 * @param file - The path of the workbook to read.
 * @param sheetName - The worksheet to read. Default: the first worksheet of the workbook.
 * @returns The rows of the worksheet, one object per row.
 * @throws {Error} When the worksheet does not exist.
 */
export function readExcelToJSON<T = Record<string, any>>(file: string, sheetName?: string): T[]
/**
 * Reads a worksheet into an array of objects.
 *
 * @param file - The workbook to read.
 * @param sheetName - The worksheet to read. Default: the first worksheet of the workbook.
 * @returns A promise of the rows of the worksheet, one object per row.
 * @throws {Error} When the worksheet does not exist.
 */
export function readExcelToJSON<T = Record<string, any>>(file: File, sheetName?: string): Promise<T[]>
/**
 * Reads a worksheet into an array of objects.
 *
 * @param file - The workbook path or `File` to read.
 * @param sheetName - The worksheet to read. Default: the first worksheet of the workbook.
 * @returns The rows of the worksheet for a path, or a promise of them for a `File`.
 * @throws {Error} When the worksheet does not exist.
 */
export function readExcelToJSON<T = Record<string, any>>(file: string | File, sheetName?: string): T[] | Promise<T[]> {
  if (typeof file === 'string') return rows<T>(xlsx.readFile(file), sheetName)
  return file.arrayBuffer().then(buffer => rows<T>(xlsx.read(buffer, { type: 'array' }), sheetName))
}
