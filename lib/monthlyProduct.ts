import { turkeyMonthWindow } from '@/lib/monthlyAccess';

// KEKS aylık test ürününün TEK fiyat kaynağı burasıdır. Ödeme sayfası,
// yönetici paneli, test erişimi ve kampanya gösterimi bu modülden beslenir;
// hiçbir yerde "400 TL / 800 TL" gibi değerler elle yazılmaz.

export const KEKS_TEST_BASE_NAME='KEKS Eğilim Taraması ve Eğitim Düzeyine Göre Ön Görüşme Test Formu';

function positiveIntEnv(name:string,fallback:number){
  const raw=process.env[name];
  const n=raw?Number.parseInt(raw,10):Number.NaN;
  return Number.isFinite(n)&&n>0?n:fallback;
}

/** İndirimli satış fiyatı (kuruş). Tek kaynak: TEST_PRICE_KURUS ortam değişkeni. */
export const KEKS_TEST_PRICE_KURUS=positiveIntEnv('TEST_PRICE_KURUS',40000);

/** Kampanya indirim oranı (%). */
export const KEKS_TEST_DISCOUNT_PERCENT=Math.min(95,Math.max(0,positiveIntEnv('TEST_DISCOUNT_PERCENT',50)));

/** Normal (indirim öncesi) liste fiyatı. Ayrıca verilmezse indirimden türetilir. */
export const KEKS_TEST_LIST_PRICE_KURUS=(()=>{
  const explicit=process.env.TEST_LIST_PRICE_KURUS?Number.parseInt(process.env.TEST_LIST_PRICE_KURUS,10):Number.NaN;
  if(Number.isFinite(explicit)&&explicit>=KEKS_TEST_PRICE_KURUS)return explicit;
  const pct=KEKS_TEST_DISCOUNT_PERCENT;
  if(pct<=0||pct>=100)return KEKS_TEST_PRICE_KURUS;
  return Math.round(KEKS_TEST_PRICE_KURUS/(1-pct/100));
})();

/** Kuruş değerini "400 TL" biçiminde, tek yerden formatlar. */
export function formatPriceTRY(kurus:number){
  const lira=(kurus||0)/100;
  const nf=new Intl.NumberFormat('tr-TR',{maximumFractionDigits:Number.isInteger(lira)?0:2});
  return nf.format(lira)+' TL';
}

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
    listPriceKurus:KEKS_TEST_LIST_PRICE_KURUS,
    listPriceLabel:formatPriceTRY(KEKS_TEST_LIST_PRICE_KURUS),
    priceKurus:KEKS_TEST_PRICE_KURUS,
    priceLabel:formatPriceTRY(KEKS_TEST_PRICE_KURUS),
    discountPercent:KEKS_TEST_DISCOUNT_PERCENT
  };
}

/** Fiyat özetini yönetici paneli / API yanıtları için tek biçimde döndürür. */
export function keksPricingSummary(date=new Date()){
  const p=keksMonthlyProduct(date);
  return {
    listPriceKurus:p.listPriceKurus,
    listPriceLabel:p.listPriceLabel,
    priceKurus:p.priceKurus,
    priceLabel:p.priceLabel,
    discountPercent:p.discountPercent
  };
}

export function productKeyFromReport(report:unknown,completedAt:Date){
  if(report&&typeof report==='object'&&!Array.isArray(report)){
    const product=(report as Record<string,any>).product;
    if(product&&typeof product==='object'&&typeof product.key==='string')return product.key;
  }
  return keksMonthlyProduct(completedAt).key;
}
