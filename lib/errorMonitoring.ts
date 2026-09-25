import crypto from 'node:crypto';
import { db } from '@/lib/db';

function safeRequestId(value:string|null){
  return value&&/^[A-Za-z0-9._:-]{8,100}$/.test(value)?value:null;
}

export function createRequestId(req?:Request|null){
  return safeRequestId(req?.headers.get('x-request-id')||null)||crypto.randomUUID();
}

function errorClass(error:unknown){
  if(error instanceof Error&&error.name)return error.name.slice(0,100);
  if(error&&typeof error==='object'&&(error as any).constructor?.name)return String((error as any).constructor.name).slice(0,100);
  return typeof error;
}

function safeCode(error:unknown){
  if(!error||typeof error!=='object')return null;
  const code=(error as any).code;
  return typeof code==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(code)?code:null;
}

function safeMessage(error:unknown){
  if(!(error instanceof Error))return null;
  const message=error.message||'';
  if(!message)return null;
  if(/password|passphrase|token|secret|credential|authorization|cookie|merchant.?key|merchant.?salt|app.?password|postgres(?:ql)?:\/\//i.test(message)){
    return '[REDACTED_SENSITIVE_ERROR_MESSAGE]';
  }
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi,'Bearer [REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g,'[REDACTED_JWT]')
    .slice(0,500);
}

export async function recordServerError(input:{endpoint:string;method:string;requestId:string;error:unknown}){
  const endpoint=input.endpoint.split('?')[0].slice(0,500)||'unknown';
  const method=input.method.slice(0,16)||'UNKNOWN';
  const requestId=input.requestId;
  const error=input.error;
  const metadata={
    requestId,
    endpoint,
    method,
    errorClass:errorClass(error),
    errorCode:safeCode(error),
    message:safeMessage(error),
    environment:process.env.VERCEL_ENV||process.env.NODE_ENV||'unknown',
    deployment:(process.env.VERCEL_GIT_COMMIT_SHA||'').slice(0,12)||null
  };
  if(process.env.NODE_ENV==='test')return metadata;
  try{
    await db.auditLog.create({data:{
      action:'API_ERROR_500',
      entityType:'ApiError',
      entityId:requestId,
      summary:method+' '+endpoint+' beklenmeyen sunucu hatası üretti.',
      metadata:metadata as any
    }});
  }catch{
    // Hata kaydı DB arızası nedeniyle yazılamıyorsa gizli ayrıntı basmadan yalnız korelasyon kimliği loglanır.
    console.error('API_ERROR_LOG_FAILED',requestId);
  }
  return metadata;
}

export async function recordApiError(req:Request|null,error:unknown,requestId:string){
  return recordServerError({
    endpoint:req?new URL(req.url).pathname:'unknown',
    method:req?.method||'UNKNOWN',
    requestId,
    error
  });
}
