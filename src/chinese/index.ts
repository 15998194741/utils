import { isId, isPhoneNumer } from '../regular/regular'
export const isChineseIdCard = isId
export const isChineseMobile = isPhoneNumer
/** Luhn checksum for bank-card-like digit strings (12-19 digits). */
export function isBankCard(value:string|number):boolean{const text=String(value);if(!/^\d{12,19}$/.test(text))return false;let sum=0,double=false;for(let i=text.length-1;i>=0;i--){let digit=Number(text[i]);if(double){digit*=2;if(digit>9)digit-=9}sum+=digit;double=!double}return sum%10===0}
export function maskChineseMobile(value:string|number):string{const text=String(value);return isChineseMobile(text)?`${text.slice(0,3)}****${text.slice(-4)}`:text}
export function maskChineseIdCard(value:string):string{return isChineseIdCard(value)?`${value.slice(0,6)}********${value.slice(-4)}`:value}
