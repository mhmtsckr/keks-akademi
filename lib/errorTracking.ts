import crypto from 'node:crypto';
import { db } from '@/lib/db';

// Gizli veri anahtarları: bunları içeren parçalar loglanmadan önce maskelenir.
const SENSITIVE=/(pass(word)?|sifre|şifre|token|secret|salt|otp|kod|code|authorization|cookie|api[_-]?key|bearer)/i;

/** Hata mesajından olası gizli değerleri ve sorgu parametrelerini temizler. */
function redact(input:string){
  let out=input;
  // "key=deger" / "key: deger" kalıplarında hassas anahtarların değerini maskele.
  out=out.replace(/([\w.-]+)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;&]+)/g,(m,key)=>{
    return SENSITIVE.test(String(key))?`${key}=***`:m;
  });
  // "Bearer xxx" gibi başlıkları maskele.
  out=out.replace(/bearer\s+[\w.\-]+/gi,'bearer ***');
  return out;
}

/** Yalnızca yol kısmını tutar; sorgu dizesi token taşıyabileceği için atılır. */
function safePath(url?:string){
  if(!url)return 'unknown';
  try{return new URL(url).pathname}catch{
    const q=url.indexOf('?');
    return q>=0?url.slice(0,q):url;
  }
}

type ErrorContext={req?:Request;method?:string;path?:string;actorUserId?:string|null};

/**
 * Beklenmedik bir API arızasını (500) kalıcı olarak kaydeder ve yapılandırılmış
 * biçimde konsola yazar. En iyi çaba prensibiyle çalışır: kayıt başarısız olsa
 * bile asıl isteğin akışını bozmaz. Şifre/token gibi veriler asla yazılmaz.
 */
export async function recordApiError(error:unknown,ctx:ErrorContext={}):Promise<string|null>{
  const requestId=crypto.randomUUID();
  const method=(ctx.method||ctx.req?.method||'UNKNOWN').toUpperCase();
  const path=ctx.path||safePath(ctx.req?.url);
  const errorClass=(error&&typeof error==='object'&&error.constructor&&error.constructor.name)
    ?error.constructor.name
    :typeof error;
  const rawMessage=error instanceof Error?error.message:String(error);
  const message=redact(rawMessage).slice(0,2000);

  // Hata izleme servisi / log toplayıcı için yapılandırılmış satır.
  console.error('[v0] API_ERROR',JSON.stringify({requestId,method,path,errorClass:String(errorClass).slice(0,120)}));

  // Test ortamında veritabanına yazma; testler DB bağlantısına bağlı olmamalı.
  if(process.env.NODE_ENV==='test')return requestId;

  try{
    await db.errorEvent.create({data:{
      requestId,
      method,
      path:String(path).slice(0,300),
      errorClass:String(errorClass).slice(0,120),
      message,
      statusCode:500,
      actorUserId:ctx.actorUserId||null
    }});
  }catch(persistError){
    console.error('[v0] ERROR_TRACKING_PERSIST_FAILED',persistError instanceof Error?persistError.message:String(persistError));
  }
  return requestId;
}
