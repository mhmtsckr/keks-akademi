import { db } from '@/lib/db';
import { KEKS_MONTHLY_PRODUCT } from '@/lib/productCatalog';

export const PRODUCT_CONFIG_KEY=KEKS_MONTHLY_PRODUCT.key;
export const DEFAULT_PRODUCT_PRICING=KEKS_MONTHLY_PRODUCT.defaultPricing;

export type ProductPricing={
  listPriceKurus:number;
  priceKurus:number;
  updatedAt:string|null;
  source:'DEFAULT'|'ADMIN';
};

export const FEATURE_KEYS=['SMART_COACH','ADAPTIVE_RECOMMENDATION','TODAY_PLAN','SMART_NOTIFICATIONS','GAMIFICATION'] as const;
export type FeatureMode='ALL'|'OFF'|'PILOT';
export type FeatureKey=typeof FEATURE_KEYS[number];
export type FeatureFlagConfig={
  key:FeatureKey;
  label:string;
  description:string;
  mode:FeatureMode;
  studentCodes:string[];
  updatedAt:string|null;
  source:'DEFAULT'|'ADMIN';
};

export const FEATURE_FLAG_DEFINITIONS:Record<FeatureKey,{label:string;description:string;defaultMode:FeatureMode}>={
  SMART_COACH:{
    label:'Akıllı Koç ve Haftalık Plan',
    description:'Öğrencinin performans, tekrar ve konu verilerinden açıklanabilir haftalık plan üretir.',
    defaultMode:'ALL'
  },
  ADAPTIVE_RECOMMENDATION:{
    label:'Adaptif Çalışma Önerisi',
    description:'Son performansa göre sıradaki çalışma adımını gerekçesiyle gösterir.',
    defaultMode:'ALL'
  },
  TODAY_PLAN:{
    label:'Bugünün Planı Motoru',
    description:'Gerçek kapasite, tekrar kuyruğu ve performans verisinden günlük öncelik planı üretir.',
    defaultMode:'ALL'
  },
  SMART_NOTIFICATIONS:{
    label:'Akıllı Bildirimler',
    description:'Yalnız eylem gerektiren tekrar, deneme, plan ve yarım görev sinyallerini gösterir.',
    defaultMode:'ALL'
  },
  GAMIFICATION:{
    label:'Oyunlaştırma ve Mikro Tekrar',
    description:'XP, rozet, mikro tekrar ve öğrenci etkileşim modüllerini yönetir.',
    defaultMode:'ALL'
  }
};

function record(value:unknown):Record<string,unknown>{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
}
function positiveInt(value:unknown,fallback:number){
  const n=Number(value);
  return Number.isInteger(n)&&n>0?n:fallback;
}
function normalizeCodes(value:unknown){
  if(!Array.isArray(value))return [];
  return [...new Set(value.map(x=>String(x).trim()).filter(Boolean))].slice(0,250);
}

export async function getProductPricing():Promise<ProductPricing>{
  const row=await db.auditLog.findFirst({
    where:{action:'SYSTEM_PRODUCT_PRICING',entityType:'SystemConfig',entityId:PRODUCT_CONFIG_KEY},
    orderBy:{createdAt:'desc'},
    select:{metadata:true,createdAt:true}
  });
  if(!row)return {...DEFAULT_PRODUCT_PRICING,updatedAt:null,source:'DEFAULT'};
  const meta=record(row.metadata);
  const listPriceKurus=positiveInt(meta.listPriceKurus,DEFAULT_PRODUCT_PRICING.listPriceKurus);
  const priceKurus=positiveInt(meta.priceKurus,DEFAULT_PRODUCT_PRICING.priceKurus);
  if(priceKurus>listPriceKurus)return {...DEFAULT_PRODUCT_PRICING,updatedAt:null,source:'DEFAULT'};
  return {listPriceKurus,priceKurus,updatedAt:row.createdAt.toISOString(),source:'ADMIN'};
}

export async function saveProductPricing(actorUserId:string,input:{listPriceKurus:number;priceKurus:number}){
  if(!Number.isInteger(input.listPriceKurus)||!Number.isInteger(input.priceKurus)||input.listPriceKurus<=0||input.priceKurus<=0||input.priceKurus>input.listPriceKurus){
    throw new Error('INVALID_PRODUCT_PRICING');
  }
  const row=await db.auditLog.create({data:{
    actorUserId,
    action:'SYSTEM_PRODUCT_PRICING',
    entityType:'SystemConfig',
    entityId:PRODUCT_CONFIG_KEY,
    summary:'KEKS aylık ürün fiyat yapılandırması güncellendi.',
    metadata:{listPriceKurus:input.listPriceKurus,priceKurus:input.priceKurus}
  }});
  return {listPriceKurus:input.listPriceKurus,priceKurus:input.priceKurus,updatedAt:row.createdAt.toISOString(),source:'ADMIN' as const};
}

export async function getFeatureFlag(key:FeatureKey):Promise<FeatureFlagConfig>{
  const def=FEATURE_FLAG_DEFINITIONS[key];
  const row=await db.auditLog.findFirst({
    where:{action:'SYSTEM_FEATURE_FLAG',entityType:'FeatureFlag',entityId:key},
    orderBy:{createdAt:'desc'},
    select:{metadata:true,createdAt:true}
  });
  if(!row)return {key,label:def.label,description:def.description,mode:def.defaultMode,studentCodes:[],updatedAt:null,source:'DEFAULT'};
  const meta=record(row.metadata);
  const mode=(meta.mode==='ALL'||meta.mode==='OFF'||meta.mode==='PILOT')?meta.mode:def.defaultMode;
  return {
    key,label:def.label,description:def.description,mode,
    studentCodes:normalizeCodes(meta.studentCodes),
    updatedAt:row.createdAt.toISOString(),
    source:'ADMIN'
  };
}

export async function listFeatureFlags(){
  return Promise.all(FEATURE_KEYS.map(getFeatureFlag));
}

export async function saveFeatureFlag(actorUserId:string,input:{key:FeatureKey;mode:FeatureMode;studentCodes?:string[]}){
  const studentCodes=normalizeCodes(input.studentCodes||[]);
  const row=await db.auditLog.create({data:{
    actorUserId,
    action:'SYSTEM_FEATURE_FLAG',
    entityType:'FeatureFlag',
    entityId:input.key,
    summary:FEATURE_FLAG_DEFINITIONS[input.key].label+' feature flag ayarı güncellendi.',
    metadata:{mode:input.mode,studentCodes}
  }});
  return {
    key:input.key,
    label:FEATURE_FLAG_DEFINITIONS[input.key].label,
    description:FEATURE_FLAG_DEFINITIONS[input.key].description,
    mode:input.mode,
    studentCodes,
    updatedAt:row.createdAt.toISOString(),
    source:'ADMIN' as const
  };
}

export function featureEnabledForStudent(flag:Pick<FeatureFlagConfig,'mode'|'studentCodes'>,studentCode?:string|null){
  if(flag.mode==='ALL')return true;
  if(flag.mode==='OFF')return false;
  return Boolean(studentCode&&flag.studentCodes.includes(studentCode));
}

export async function isFeatureEnabled(key:FeatureKey,studentCode?:string|null){
  return featureEnabledForStudent(await getFeatureFlag(key),studentCode);
}

export async function getStudentFeatureSnapshot(studentCode:string){
  const flags=await listFeatureFlags();
  return Object.fromEntries(flags.map(flag=>[
    flag.key,
    featureEnabledForStudent(flag,studentCode)
  ])) as Record<FeatureKey,boolean>;
}
