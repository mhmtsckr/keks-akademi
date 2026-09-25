import { db } from './db';

const SENSITIVE_KEYS=/(password|passphrase|token|secret|authorization|cookie|challenge|verification.?code|otp|app.?password|merchant.?key|merchant.?salt|access.?key|passwordHash|codeHash|ciphertext)/i;

function sanitize(value:unknown,depth=0):unknown{
  if(depth>6)return '[TRUNCATED]';
  if(value===null||value===undefined)return value;
  if(Array.isArray(value))return value.slice(0,100).map(v=>sanitize(v,depth+1));
  if(typeof value==='object'){
    const out:Record<string,unknown>={};
    for(const [key,item] of Object.entries(value as Record<string,unknown>)){
      out[key]=SENSITIVE_KEYS.test(key)?'[REDACTED]':sanitize(item,depth+1);
    }
    return out;
  }
  if(typeof value==='string'){
    const clean=value
      .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi,'Bearer [REDACTED]')
      .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g,'[REDACTED_JWT]');
    return clean.length>2000?clean.slice(0,2000)+'…':clean;
  }
  return value;
}

export async function writeAudit(input:{
  actorUserId?:string|null;
  action:string;
  entityType:string;
  entityId?:string|null;
  summary:string;
  metadata?:unknown;
}){
  try{
    await db.auditLog.create({data:{
      actorUserId:input.actorUserId||null,
      action:input.action,
      entityType:input.entityType,
      entityId:input.entityId||null,
      summary:input.summary.slice(0,1000),
      metadata:sanitize(input.metadata) as any
    }});
  }catch(e){
    console.error('AUDIT_LOG_FAILED');
  }
}
