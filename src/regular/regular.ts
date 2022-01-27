export function isId(id: string): boolean {
  let result = false;
  result = id.length === 15 && /^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}[0-9Xx]$/.test(id)
  result = id.length === 18 && /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(id)
  return result
}

// export function EmailRegular(email: string): boolean {
//   return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(email)
// }
export function isEmail(email: string) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}



export function isPhoneNumer(phoneNumber: string | number): boolean {
  let phone = String(phoneNumber);
  return /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/.test(phone)
}

export function isDomainName(domainName: string): boolean {
  return /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,6}$/.test(domainName)
}


export function isInternetUrl(url: string): boolean {
  let result = false;
  result = result || /^http:\/\/([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=]*)?$/.test(url)
  result = result || /[a-zA-z]+:\/\/[^\s]*/.test(url)
  return result
}


export function isData(date: string): boolean {
  return /^\d{4}-\d{1,2}-\d{1,2}/.test(date)
}


export function isXml(file: string): boolean {
  return /^([a-zA-Z]+-?)+[a-zA-Z0-9]+\\.[x|X][m|M][l|L]$/.test(file)
}


export function isChinese(word: string): boolean {
  return /^[\u4e00-\u9fa5]+$/.test(word)
}


export function isIp(ip: string): boolean {
  return /^((?:(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d))$/.test(ip)
}

/* 小写字母*/
export function isLowerCase(str: string) {
  const reg = /^[a-z]+$/;
  return reg.test(str);
}

/* 大写字母*/
export function isUpperCase(str: string) {
  const reg = /^[A-Z]+$/;
  return reg.test(str);
}

/* 大小写字母*/
export function isAlphabets(str: string) {
  const reg = /^[A-Za-z]+$/;
  return reg.test(str);
}


const Regs = {
  isAlphabets: /^[A-Za-z]+$/,
  isUpperCase: /^[A-Z]+$/,
  isLowerCase: /^[a-z]+$/,
  isIp: /^((?:(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d?\\d))$/,
  isChinese: /^[\u4e00-\u9fa5]+$/,
  isXml: /^([a-zA-Z]+-?)+[a-zA-Z0-9]+\\.[x|X][m|M][l|L]$/,
  isData: /^\d{4}-\d{1,2}-\d{1,2}/,
  isInternetUrl: [
    /^http:\/\/([\w-]+\.)+[\w-]+(\/[\w-.\/?%&=]*)?$/,
    /[a-zA-z]+:\/\/[^\s]*/,
  ],
  isDomainName: /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,6}$/,
  isPhoneNumer: /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/,
  isEmail: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  isId: [
    /^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}[0-9Xx]$/,
    /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  ]
}

export default class Is {
  constructor(public regs = Regs) {
    this.regs = {
      ...Regs,
      ...this.regs
    }
    for (let i of Object.keys(this.regs)) {
      (this as any)[i] = (args: string, reg?: string | RegExp): boolean => {
        let regs = reg ?? Regs?.[i]
        let res = Array.isArray(regs) ? regs.every(reg => reg.test(args)) : regs.test(args)
        return res
      }
    }
    return this
  }
}
