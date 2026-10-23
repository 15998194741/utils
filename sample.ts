import { copy } from "./src/utils/copy";
/**
 * @param {any} value A JavaScript value, usually an object or array, to be converted.
 */
copy({})
copy.deepcopy({})


import * as reg from "./src/regular";
reg.isAlphabets
reg.isChinese
reg.isData
reg.isDomainName
reg.isEmail
reg.isId
reg.isInternetUrl
reg.isIp
reg.isLowerCase
reg.isPhoneNumer
reg.isUpperCase
reg.isXml

import { readExcelToJSON } from "./src/excel";
/**
 * @param {string} file
 * @param {string} sheetName
 * @returns {boolean}
 */
readExcelToJSON


import { whatType } from './src/utils/type'
/**
 * @param {any} value
 * @returns { string } "number" | "string" | "array" | "object" | "set" | "map" | "regexp" | "boolean" | "symbol" | "function" | "Undefined" | "null" | "htmldocument" | "htmlcollection"
 */
whatType({})


import { isEqual, objectIsEqual, shallowEqual } from './src/utils/equal'
/**
 * @param {any} left
 * @param {any} right
 * @returns { boolean }
 */
isEqual({}, {})
/**
 * @param {any} left
 * @param {any} right
 * @returns { boolean }
 */
objectIsEqual({}, {})
/**
 * @param {any} left
 * @param {any} right
 * @returns { boolean }
 */
shallowEqual({}, {})
