export function arrayIsRqual(arr1:any[],arr2:any[]):boolean
export function arrayIsRqual(arr1:any[],arr2:any[],...arr3:any[][]):boolean
export function arrayIsRqual(...args:any[]):boolean{
  for(let i = 0; i < args.length - 1;i++){
    let left = args[i];
    let right = args[i + 1];
    if(!isRqual(left,right))return false
  }
  return true
}

export function isRqual(arg1:any,arg2:any){
  let typeone = typeof arg1 !== 'object' 
  let typetwo = typeof arg2 !== 'object' 
  if (typeone && typetwo){
    return arg1 === arg2;
  }
  if (Number(!typeone) ^ Number(!typetwo)){
    return false
  }
  return objectIsRqualShallow(arg1,arg2);
}

export function arrayIsRqualShallow(arr1:any[],arr2:any[]):boolean{
  return arr1.length === arr2.length && JSON.stringify(arr1) == JSON.stringify(arr2)
}

export function objectIsRqualShallow(obj1:any,obj2:any){
  if(JSON.stringify(obj1) === JSON.stringify(obj2))return true
  let keys1 = Object.keys(obj1);
  let keys2 = Object.keys(obj2);
  if (keys2.length !== keys1.length) return false
  if(!keys1.every(e => keys2.includes(e)))return false
  for(let i in obj1){
    let left = obj1[i];
    let right = obj2[i];
    if(!isRqual(left,right))return false;
  }
  return true
}
