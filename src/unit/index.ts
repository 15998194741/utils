export type LengthUnit='mm'|'cm'|'m'|'km'|'in'|'ft'|'yd'|'mi'
export type WeightUnit='mg'|'g'|'kg'|'oz'|'lb'
const lengths:Record<LengthUnit,number>={mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,yd:.9144,mi:1609.344}
const weights:Record<WeightUnit,number>={mg:.001,g:1,kg:1000,oz:28.349523125,lb:453.59237}
export function convertLength(value:number,from:LengthUnit,to:LengthUnit):number{return value*lengths[from]/lengths[to]}
export function convertWeight(value:number,from:WeightUnit,to:WeightUnit):number{return value*weights[from]/weights[to]}
export function celsiusToFahrenheit(value:number):number{return value*9/5+32}
export function fahrenheitToCelsius(value:number):number{return (value-32)*5/9}
