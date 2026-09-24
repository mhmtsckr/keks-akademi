import { db } from './db';

const SENSITIVE_KEYS=/^(password|currentPassword|newPassword|passwordConfirm|token|authToken|accessToken|refreshToken|challenge|verificationCode|otp|appPassword|merchantKey|merchantSalt|accessKey)$/i;

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
  if(typeof value==='string'&&value.length>2000)return value.slice(0,2000)+'…';
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
    console.error('AUDIT_LOG_FAILED',e);
  }
}
