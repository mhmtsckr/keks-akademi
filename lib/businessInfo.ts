export const BUSINESS_INFO={
  brandName:'KEKS Akademi',
  serviceName:'Kazandıran Eğitim ve Koçluk Sistemi',
  legalTitle:'Mehmet Sait Çakır (KEKS AKADEMİ)',
  address:'Cumhuriyet Mahallesi Piri Reis Caddesi Tuana Apartmanı No: 25 Kat:2 Daire No: 6 Adıyaman/Merkez',
  phone:'05327081471',
  email:'keksakademi@gmail.com'
} as const;

export function businessDisplay(value:string,field:string){
  return value.trim()||field+' bilgisi henüz yayımlanmadı.';
}
