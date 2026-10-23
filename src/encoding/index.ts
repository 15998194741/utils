/**
 * Converts bytes to their lowercase hexadecimal representation.
 *
 * @param bytes - The bytes to convert. Every entry must be an integer from 0 to 255.
 * @returns A hex string with two characters per byte.
 * @throws {RangeError} When a byte is not an integer from 0 to 255.
 *
 * @example
 * ```ts
 * bytesToHex([0, 15, 255]); // '000fff'
 * ```
 */
export function bytesToHex(bytes:ArrayLike<number>):string{return Array.from(bytes,value=>{if(!Number.isInteger(value)||value<0||value>255)throw new RangeError('bytes must contain integers from 0 to 255');return value.toString(16).padStart(2,'0')}).join('')}
/**
 * Converts a hexadecimal string into bytes.
 *
 * @param hex - A hex string with an even number of characters. Case-insensitive.
 * @returns The decoded bytes.
 * @throws {TypeError} When the string is not valid hexadecimal.
 *
 * @example
 * ```ts
 * hexToBytes('00ff10'); // Uint8Array [0, 255, 16]
 * ```
 */
export function hexToBytes(hex:string):Uint8Array{if(!/^(?:[0-9a-fA-F]{2})*$/.test(hex))throw new TypeError('Invalid hexadecimal string');return Uint8Array.from(hex.match(/.{2}/g)?.map(value=>parseInt(value,16))??[])}
/**
 * Encodes a string as UTF-8 bytes.
 *
 * @param value - The string to encode.
 * @returns The UTF-8 bytes of the string.
 *
 * @example
 * ```ts
 * utf8ToBytes('hi'); // Uint8Array [104, 105]
 * ```
 */
export function utf8ToBytes(value:string):Uint8Array{return new TextEncoder().encode(value)}
/**
 * Decodes UTF-8 bytes into a string.
 *
 * @param bytes - The bytes to decode.
 * @returns The decoded string.
 * @throws {TypeError} When the bytes are not valid UTF-8.
 *
 * @example
 * ```ts
 * bytesToUtf8(utf8ToBytes('hi')); // 'hi'
 * ```
 */
export function bytesToUtf8(bytes:ArrayBufferView|ArrayBuffer):string{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}
/**
 * Encodes bytes as a standard base64 string.
 *
 * @param bytes - The bytes to encode. Every entry must be an integer from 0 to 255.
 * @returns The base64 representation, padded with `=`.
 * @throws {RangeError} When a byte is not an integer from 0 to 255.
 *
 * @example
 * ```ts
 * bytesToBase64([104, 105]); // 'aGk='
 * ```
 */
export function bytesToBase64(bytes:ArrayLike<number>):string{let binary='';for(const value of Array.from(bytes)){if(!Number.isInteger(value)||value<0||value>255)throw new RangeError('Invalid byte');binary+=String.fromCharCode(value)}return btoa(binary)}
/**
 * Decodes a standard base64 string into bytes.
 *
 * @param value - The base64 string to decode.
 * @returns The decoded bytes.
 * @throws {TypeError} When the string is not valid base64.
 *
 * @example
 * ```ts
 * base64ToBytes('aGk='); // Uint8Array [104, 105]
 * ```
 */
export function base64ToBytes(value:string):Uint8Array{if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw new TypeError('Invalid base64');const binary=atob(value);return Uint8Array.from(binary,char=>char.charCodeAt(0))}
/**
 * Encodes bytes as an unpadded base64url string.
 *
 * Padding is removed and the `+` and `/` characters become `-` and `_`.
 *
 * @param bytes - The bytes to encode. Every entry must be an integer from 0 to 255.
 * @returns The base64url representation without padding.
 * @throws {RangeError} When a byte is not an integer from 0 to 255.
 *
 * @example
 * ```ts
 * bytesToBase64Url([251, 255]); // '-_8'
 * ```
 */
export function bytesToBase64Url(bytes:ArrayLike<number>):string{return bytesToBase64(bytes).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}
/**
 * Decodes an unpadded base64url string into bytes.
 *
 * @param value - The base64url string to decode. Padding is not accepted.
 * @returns The decoded bytes.
 * @throws {TypeError} When the string is not valid base64url.
 *
 * @example
 * ```ts
 * base64UrlToBytes('-_8'); // Uint8Array [251, 255]
 * ```
 */
export function base64UrlToBytes(value:string):Uint8Array{if(!/^[A-Za-z0-9_-]*$/.test(value)||value.length%4===1)throw new TypeError('Invalid base64url');const base=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');return base64ToBytes(base)}
