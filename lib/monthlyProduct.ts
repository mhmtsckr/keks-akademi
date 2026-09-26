import { turkeyMonthWindow } from '@/lib/monthlyAccess';
import { KEKS_MONTHLY_PRODUCT } from '@/lib/productCatalog';
import { DEFAULT_PRODUCT_PRICING,getProductPricing,type ProductPricing } from '@/lib/systemConfig';

export const KEKS_TEST_BASE_NAME=KEKS_MONTHLY_PRODUCT.baseName;
export const KEKS_TEST_LIST_PRICE_KURUS=DEFAULT_PRODUCT_PRICING.listPriceKurus;
export const KEKS_TEST_PRICE_KURUS=DEFAULT_PRODUCT_PRICING.priceKurus;

export type KeksMonthlyProduct={
  key:string;
  monthName:string;
  name:string;
  listPriceKurus:number;
  listPriceLabel:string;
  priceKurus:number;
  priceLabel:string;
  discountPercent:number;
};

function priceLabel(kurus:number){
  return new Intl.NumberFormat('tr-TR',{minimumFractionDigits:0,maximumFractionDigits:2}).format(kurus/100)+' TL';
}

export function keksMonthlyProduct(date=new Date(),pricing:Pick<ProductPricing,'listPriceKurus'|'priceKurus'>=DEFAULT_PRODUCT_PRICING):KeksMonthlyProduct{
  const window=turkeyMonthWindow(date);
  const monthName=new Intl.DateTimeFormat('tr-TR',{
    timeZone:'Europe/Istanbul',
    month:'long'
  }).format(date).toLocaleUpperCase('tr-TR');
  const discountPercent=Math.max(0,Math.round((1-pricing.priceKurus/pricing.listPriceKurus)*100));

  return {
    key:window.key,
    monthName,
    name:`${monthName} AYI ${KEKS_TEST_BASE_NAME}`,
    listPriceKurus:pricing.listPriceKurus,
    listPriceLabel:priceLabel(pricing.listPriceKurus),
    priceKurus:pricing.priceKurus,
    priceLabel:priceLabel(pricing.priceKurus),
    discountPercent
  };
}

export async function getKeksMonthlyProduct(date=new Date()){
  return keksMonthlyProduct(date,await getProductPricing());
}

export function productKeyFromReport(report:unknown,completedAt:Date){
  if(report&&typeof report==='object'&&!Array.isArray(report)){
    const product=(report as Record<string,any>).product;
    if(product&&typeof product==='object'&&typeof product.key==='string')return product.key;
  }
  return turkeyMonthWindow(completedAt).key;
}
