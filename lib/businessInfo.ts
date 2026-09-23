export const BUSINESS_INFO={
  brandName:'KEKS Akademi',
  serviceName:'Kazandıran Eğitim ve Koçluk Sistemi',
  legalTitle:'',
  address:'',
  phone:'',
  email:'keksakademi@gmail.com'
} as const;

export function businessDisplay(value:string,field:string){
  return value.trim()||field+' bilgisi henüz yayımlanmadı.';
}
