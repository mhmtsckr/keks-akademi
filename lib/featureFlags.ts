import { db } from '@/lib/db';

export type FeatureFlagDef={
  key:string;
  label:string;
  description:string;
};

/**
 * Bilinen özellik bayraklarının kayıt defteri. Yeni bir modül eklerken buraya
 * bir giriş eklenir; yönetici paneli bu listeden beslenir, böylece veritabanında
 * satır olmasa bile bayrak görünür ve varsayılan olarak KAPALI kabul edilir.
 */
export const FEATURE_FLAGS:FeatureFlagDef[]=[
  {
    key:'ai_coach',
    label:'AI Koç (Rehber Bot)',
    description:'Öğrenci panelindeki yapay zekâ destekli rehber bot. Kapalıyken tüm öğrencilerde gizlenir; yalnız pilot gruba veya herkese açılabilir.'
  }
];

export function featureFlagDef(key:string){
  return FEATURE_FLAGS.find(f=>f.key===key)||null;
}

/**
 * Bir özelliğin bir öğrenci için etkin olup olmadığını döndürür.
 * Fail-safe: bayrak yoksa veya DB hatası olursa KAPALI kabul edilir; böylece
 * yeni bir geliştirme sorun çıkarırsa kod geri alınmadan kapalı kalır.
 */
export async function isFeatureEnabled(key:string,ctx?:{studentId?:string|null}):Promise<boolean>{
  try{
    const flag=await db.featureFlag.findUnique({where:{key}});
    if(!flag)return false;
    if(flag.enabled)return true;
    const sid=ctx?.studentId;
    if(sid&&Array.isArray(flag.rolloutStudentIds)&&flag.rolloutStudentIds.includes(sid))return true;
    return false;
  }catch{
    return false;
  }
}
