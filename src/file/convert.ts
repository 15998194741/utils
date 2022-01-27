export function fileToBase64(file:File,callback: () => string):void
export function fileToBase64(file:File):Promise<string>
export function fileToBase64(...args:any):any{
  let [ file,callback ] = args;
  callback = callback ?? '';
  let reader = new FileReader();
  reader.readAsDataURL(file);
  return  new Promise ((res) => {
    reader.onload = () => {
      (callback && callback(reader.result)) ?? res(reader.result)
    }
  }) 
}

export function base64Tofile(base:string,filename:string = 'png'):File{
  var arr = base.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
