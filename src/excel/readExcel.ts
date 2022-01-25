import xlsx from 'xlsx';

export function readExcelToJSON(filePath: string,sheetName?: string): Record<string, any>
export function readExcelToJSON(file: File, sheetName?: string): Record<string, any>
export function readExcelToJSON(...args: any):Record<string,any>{
  let [file,sheetName] = args;
  let workbook = xlsx.readFile(file)
  let sheet = sheetName ?? workbook.SheetNames[0];
  let data = xlsx.utils.sheet_to_json(sheet)
  return data;
}
