import { db } from '@/lib/db';

const SENSITIVE_PATH_LABELS=/^(?:password|passphrase|token|secret|session|challenge|otp|verification(?:-?code)?|code|api-?key|key|salt)$/i;
const HIGH_ENTROPY_SEGMENT=/^(?:eyJ[A-Za-z0-9_-]{20,}|[A-Fa-f0-9]{40,}|[A-Za-z0-9_-]{48,})$/;

function safeRequestId(value:string|null|undefined){
  return value&&/^[A-Za-z0-9._:-]{8,100}$/.test(value)?value:null;
}

export function createRequestId(req?:Request|null){
  return safeRequestId(req?.headers.get('x-request-id'))||crypto.randomUUID();
}

function safeEndpoint(value:string){
  const raw=(value||'unknown').split(/[?#]/)[0]||'unknown';
  const segments=raw.split('/');
  return segments.map((segment,index)=>{
    const previous=segments[index-1]||'';
    if(SENSITIVE_PATH_LABELS.test(previous))return '[redacted]';
    const labelled=segment.match(/^([^=]+)=(.+)$/);
    if(labelled&&SENSITIVE_PATH_LABELS.test(labelled[1]))return labelled[1]+'=[redacted]';
    if(HIGH_ENTROPY_SEGMENT.test(segment))return '[redacted]';
    return segment;
  }).join('/').slice(0,500)||'unknown';
}

function safeMethod(value:string){
  const method=(value||'').toUpperCase();
  return /^[A-Z]{3,12}$/.test(method)?method:'UNKNOWN';
}

function safeLabel(value:unknown,fallback:string,max=100){
  if(typeof value!=='string'||!value)return fallback;
  return /^[A-Za-z0-9_.:-]+$/.test(value)?value.slice(0,max):fallback;
}

function errorClass(error:unknown){
  if(error instanceof Error&&error.name)return safeLabel(error.name,'Error');
  if(error&&typeof error==='object'&&(error as any).constructor?.name){
    return safeLabel(String((error as any).constructor.name),'UnknownError');
  }
  return safeLabel(typeof error,'UnknownError');
}

function safeCode(error:unknown){
  if(!error||typeof error!=='object')return null;
  const code=(error as any).code;
  return typeof code==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(code)?code:null;
}

export type ServerErrorMetadata={
  requestId:string;
  endpoint:string;
  method:string;
  errorClass:string;
  errorCode:string|null;
  environment:string;
  deployment:string|null;
  occurredAt:string;
};

export async function recordServerError(input:{endpoint:string;method:string;requestId:string;error:unknown}){
  const endpoint=safeEndpoint(input.endpoint);
  const method=safeMethod(input.method);
  const requestId=safeRequestId(input.requestId)||crypto.randomUUID();
  const error=input.error;
  const metadata:ServerErrorMetadata={
    requestId,
    endpoint,
    method,
    errorClass:errorClass(error),
    errorCode:safeCode(error),
    environment:safeLabel(process.env.VERCEL_ENV||process.env.NODE_ENV||'unknown','unknown',40),
    deployment:safeLabel(process.env.VERCEL_GIT_COMMIT_SHA||'','',40).slice(0,12)||null,
    occurredAt:new Date().toISOString()
  };

  // Tests metadata sanitization without touching the database or writing noisy logs.
  if(process.env.NODE_ENV==='test')return metadata;

  // Vercel Runtime Logs always receive a structured, secret-free correlation record.
  // Deliberately excluded: error.message, stack, request/response body, headers, cookies and auth data.
  console.error(JSON.stringify({
    level:'error',
    event:'API_ERROR_500',
    ...metadata
  }));

  try{
    await db.auditLog.create({data:{
      action:'API_ERROR_500',
      entityType:'ApiError',
      entityId:requestId,
      summary:method+' '+endpoint+' beklenmeyen sunucu hatası üretti.',
      metadata:metadata as any
    }});
  }catch{
    // DB logging failure must not leak the original exception or request data.
    console.error(JSON.stringify({
      level:'error',
      event:'API_ERROR_PERSIST_FAILED',
      requestId,
      endpoint,
      occurredAt:new Date().toISOString()
    }));
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
