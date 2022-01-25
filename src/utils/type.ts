type types = "number" | "string" | "array" | "object" | "set" | "map" | "regexp" | "boolean" | "symbol" | "function" | "Undefined" | "null" | "htmldocument" | "htmlcollection"
type returnType = types | string
export function whatType(arg: any): returnType {
  let res = Object.prototype.toString.call(arg).replace(/^\[object (\w+)\]$/, "$1").toLowerCase()
  return res;
}
