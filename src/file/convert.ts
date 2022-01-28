export function fileToBase64(file: File, callback: () => string): void
export function fileToBase64(file: File): Promise<string>
export function fileToBase64(...args: any): any {
  let [file, callback] = args;
  callback = callback ?? '';
  let reader = new FileReader();
  let res = new Promise((res) => {
    reader.onload = () => {
      (callback && callback(reader.result)) ?? res(reader.result)
    }
  })
  reader.readAsDataURL(file);
  return res
}

export function base64Tofile(base: string, filename: string = 'png'): File {
  var arr = base.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}


export function bolbToFile(blob: Blob, fileName = '', type = 'image/png'): File {
  // URL.createObjectURL(File)
  return new File([blob], fileName, { type })
}

export function fileToBolb(file: File): Promise<any>
export function fileToBolb(file: File, callback: (data: Blob) => void): void
export function fileToBolb(...args: any): any {
  let [file, callback] = args;
  let reader = new FileReader();
  let res = new Promise((res) => {
    reader.onload = (event) => {
      let blob = new Blob([event.target.result], { type: file.type });
      (callback && callback(blob)) ?? res(blob)
    }
  })
  reader.readAsArrayBuffer(file)
  return res

}

export function fileToUrl(file: File): string {
  return URL.createObjectURL(file)
}

export function base64ToBlob(base64: string, mimeType = null): Blob {
  const arr = base64.split(','),
    defaultMimeType = arr[0].match(/:(.*?);/)[1],
    bStr = atob(arr[1]);
  let n = bStr.length,
    u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bStr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mimeType || defaultMimeType })
}


export function blobToDataURL(blob: Blob, callback: (returnValue: any) => any): void
export function blobToDataURL(blob: Blob): Promise<any>
export function blobToDataURL(...args: any): any {
  let [blob, callback] = args;
  let reader = new FileReader();
  let res = new Promise((res) => {
    reader.onload = (e) => {
      (callback && callback(e.target.result)) ?? res(e.target.result)
    }
  })
  reader.readAsDataURL(blob);
  return res
}
