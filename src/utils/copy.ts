type arg = any[] | Record<any, any>
function copy(arg: arg): any[] | Record<any, any> {
  return JSON.parse(JSON.stringify(arg))
}

copy.deepcopy = <T extends Array<T> | any>(sourceData: T): T => {
  if (Array.isArray(sourceData)) {
    return sourceData.map(item => copy.deepcopy(item)) as T
  }
  const obj: T = {} as T
  for (let key in sourceData) {
    if ((typeof sourceData[key] === 'object') && sourceData[key] !== null) {
      obj[key] = copy.deepcopy(sourceData[key])
    } else {
      obj[key] = sourceData[key]
    }
  }
  return obj
}
export {
  copy
}
