import { turkeyMonthWindow } from '@/lib/monthlyAccess';

export const KEKS_TEST_BASE_NAME='KEKS Eğilim Taraması ve Eğitim Düzeyine Göre Ön Görüşme Test Formu';
export const KEKS_TEST_PRICE_KURUS=50000;

export type KeksMonthlyProduct={
  key:string;
  monthName:string;
  name:string;
  priceKurus:number;
  priceLabel:string;
};

export function keksMonthlyProduct(date=new Date()):KeksMonthlyProduct{
  const window=turkeyMonthWindow(date);
  const monthName=new Intl.DateTimeFormat('tr-TR',{
    timeZone:'Europe/Istanbul',
    month:'long'
  }).format(date).toLocaleUpperCase('tr-TR');

  return {
    key:window.key,
    monthName,
    name:`${monthName} AYI ${KEKS_TEST_BASE_NAME}`,
    priceKurus:KEKS_TEST_PRICE_KURUS,
    priceLabel:'500 TL'
  };
}

export function productKeyFromReport(report:unknown,completedAt:Date){
  if(report&&typeof report==='object'&&!Array.isArray(report)){
    const product=(report as Record<string,any>).product;
    if(product&&typeof product==='object'&&typeof product.key==='string')return product.key;
  }
  return keksMonthlyProduct(completedAt).key;
}
