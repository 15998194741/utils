import { isId, isPhoneNumer } from '../regular/regular'
/**
 * Checks whether a value is a valid Chinese resident identity card number.
 *
 * Validates the 15- and 18-digit formats, including the embedded date and the 18-digit checksum.
 *
 * @param value - The identity card number to check.
 * @returns `true` when the number passes every check.
 */
export const isChineseIdCard = isId
/**
 * Checks whether a value looks like a mainland China mobile number.
 *
 * Mainland China mobile-number shape; allocation and ownership are not verified.
 *
 * @param value - The phone number to check.
 * @returns `true` for an 11-digit number starting with `1` followed by a digit from 3 to 9.
 */
export const isChineseMobile = isPhoneNumer
/** Luhn checksum for bank-card-like digit strings (12-19 digits). */
export function isBankCard(value:string|number):boolean{const text=String(value);if(!/^\d{12,19}$/.test(text))return false;let sum=0,double=false;for(let i=text.length-1;i>=0;i--){let digit=Number(text[i]);if(double){digit*=2;if(digit>9)digit-=9}sum+=digit;double=!double}return sum%10===0}
/**
 * Masks a mainland China mobile number, keeping the first 3 and last 4 digits.
 *
 * @param value - The phone number to mask.
 * @returns The masked number; values that are not valid mobile numbers are returned unchanged.
 *
 * @example
 * ```ts
 * maskChineseMobile('13800138000'); // '138****8000'
 * ```
 */
export function maskChineseMobile(value:string|number):string{const text=String(value);return isChineseMobile(text)?`${text.slice(0,3)}****${text.slice(-4)}`:text}
/**
 * Masks a Chinese identity card number, keeping the first 6 and last 4 characters.
 *
 * @param value - The identity card number to mask.
 * @returns The masked number; values that fail validation are returned unchanged.
 *
 * @example
 * ```ts
 * maskChineseIdCard('11010519491231002X'); // '110105********002X'
 * ```
 */
export function maskChineseIdCard(value:string):string{return isChineseIdCard(value)?`${value.slice(0,6)}********${value.slice(-4)}`:value}
