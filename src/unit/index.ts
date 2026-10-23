/**
 * The supported units of length.
 */
export type LengthUnit='mm'|'cm'|'m'|'km'|'in'|'ft'|'yd'|'mi'
/**
 * The supported units of weight.
 */
export type WeightUnit='mg'|'g'|'kg'|'oz'|'lb'
const lengths:Record<LengthUnit,number>={mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,yd:.9144,mi:1609.344}
const weights:Record<WeightUnit,number>={mg:.001,g:1,kg:1000,oz:28.349523125,lb:453.59237}
/**
 * Converts a length between two units.
 *
 * @param value - The length to convert.
 * @param from - The unit the value is given in.
 * @param to - The unit to convert to.
 * @returns The converted length.
 *
 * @example
 * ```ts
 * convertLength(1, 'm', 'cm'); // 100
 * ```
 */
export function convertLength(value:number,from:LengthUnit,to:LengthUnit):number{return value*lengths[from]/lengths[to]}
/**
 * Converts a weight between two units.
 *
 * @param value - The weight to convert.
 * @param from - The unit the value is given in.
 * @param to - The unit to convert to.
 * @returns The converted weight.
 *
 * @example
 * ```ts
 * convertWeight(1, 'kg', 'g'); // 1000
 * ```
 */
export function convertWeight(value:number,from:WeightUnit,to:WeightUnit):number{return value*weights[from]/weights[to]}
/**
 * Converts a temperature from Celsius to Fahrenheit.
 *
 * @param value - The temperature in degrees Celsius.
 * @returns The temperature in degrees Fahrenheit.
 *
 * @example
 * ```ts
 * celsiusToFahrenheit(100); // 212
 * ```
 */
export function celsiusToFahrenheit(value:number):number{return value*9/5+32}
/**
 * Converts a temperature from Fahrenheit to Celsius.
 *
 * @param value - The temperature in degrees Fahrenheit.
 * @returns The temperature in degrees Celsius.
 *
 * @example
 * ```ts
 * fahrenheitToCelsius(212); // 100
 * ```
 */
export function fahrenheitToCelsius(value:number):number{return (value-32)*5/9}
