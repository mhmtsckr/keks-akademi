import crypto from 'node:crypto';
import { db } from '@/lib/db';

const LOGIN_WINDOW_MS=15*60*1000;
const LOGIN_LOCK_MS=15*60*1000;
const CHALLENGE_IP_WINDOW_MS=15*60*1000;

function authSecret(){
  const secret=process.env.AUTH_SECRET;
  if(!secret)throw new Error('AUTH_SECRET_MISSING');
  return secret;
}

export function clientIp(req:Request){
  const forwarded=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded||req.headers.get('x-real-ip')?.trim()||req.headers.get('cf-connecting-ip')?.trim()||'unknown';
}

export function authHash(value:string){
  return crypto.createHmac('sha256',authSecret()).update(value).digest('hex').slice(0,40);
}

function key(scope:string,value:string){
  return scope+':'+authHash(value);
}

async function logRate(action:string,entityId:string,actorUserId?:string|null,metadata?:unknown){
  await db.auditLog.create({data:{
    actorUserId:actorUserId||null,
    action,
    entityType:'AuthSecurity',
    entityId,
    summary:action,
    metadata:metadata as any
  }});
}

async function latest(action:string,entityId:string,since?:Date){
  return db.auditLog.findFirst({
    where:{action,entityType:'AuthSecurity',entityId,...(since?{createdAt:{gte:since}}:{})},
    orderBy:{createdAt:'desc'},
    select:{createdAt:true}
  });
}

async function count(action:string,entityId:string,since:Date){
  return db.auditLog.count({where:{action,entityType:'AuthSecurity',entityId,createdAt:{gte:since}}});
}

function activeLock(createdAt:Date|null|undefined,durationMs:number){
  if(!createdAt)return null;
  const until=createdAt.getTime()+durationMs;
  const remaining=until-Date.now();
  if(remaining<=0)return null;
  return Math.max(1,Math.ceil(remaining/1000));
}

export async function checkLoginLimit(req:Request,email:string){
  const now=new Date();
  const since=new Date(now.getTime()-LOGIN_WINDOW_MS);
  const accountId=key('login-account',email.trim().toLowerCase());
  const ipId=key('login-ip',clientIp(req));
  const [accountLock,ipLock]=await Promise.all([
    latest('LOGIN_LOCK_ACCOUNT',accountId,since),
    latest('LOGIN_LOCK_IP',ipId,since)
  ]);
  const accountRetry=activeLock(accountLock?.createdAt,LOGIN_LOCK_MS);
  const ipRetry=activeLock(ipLock?.createdAt,LOGIN_LOCK_MS);
  const retryAfterSeconds=Math.max(accountRetry||0,ipRetry||0);
  return {allowed:retryAfterSeconds===0,retryAfterSeconds,accountId,ipId};
}

export async function recordLoginFailure(req:Request,email:string){
  const now=new Date();
  const windowStart=new Date(now.getTime()-LOGIN_WINDOW_MS);
  const accountId=key('login-account',email.trim().toLowerCase());
  const ipId=key('login-ip',clientIp(req));
  await Promise.all([
    logRate('LOGIN_FAILURE_ACCOUNT',accountId),
    logRate('LOGIN_FAILURE_IP',ipId)
  ]);

  const lastSuccess=await latest('LOGIN_SUCCESS_ACCOUNT',accountId,windowStart);
  const accountSince=lastSuccess&&lastSuccess.createdAt>windowStart?lastSuccess.createdAt:windowStart;
  const [accountFailures,ipFailures]=await Promise.all([
    count('LOGIN_FAILURE_ACCOUNT',accountId,accountSince),
    count('LOGIN_FAILURE_IP',ipId,windowStart)
  ]);

  if(accountFailures>=5){
    const lock=await latest('LOGIN_LOCK_ACCOUNT',accountId,windowStart);
    if(!lock)await logRate('LOGIN_LOCK_ACCOUNT',accountId,null,{minutes:15,reason:'5_FAILED_LOGINS'});
  }
  if(ipFailures>=20){
    const lock=await latest('LOGIN_LOCK_IP',ipId,windowStart);
    if(!lock)await logRate('LOGIN_LOCK_IP',ipId,null,{minutes:15,reason:'20_FAILED_LOGINS'});
  }
}

export async function recordLoginSuccess(req:Request,email:string,userId:string){
  const accountId=key('login-account',email.trim().toLowerCase());
  await logRate('LOGIN_SUCCESS_ACCOUNT',accountId,userId,{ipHash:authHash(clientIp(req))});
}

function utcDayStart(){
  const now=new Date();
  return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
}

export async function checkCodeSendLimit(
  scope:string,
  req:Request,
  userId:string,
  limits:{accountDaily:number;ipDaily:number;cooldownSeconds?:number}
){
  const cooldownSeconds=limits.cooldownSeconds??60;
  const now=new Date();
  const cooldownSince=new Date(now.getTime()-cooldownSeconds*1000);
  const dayStart=utcDayStart();
  const ip=clientIp(req);
  const accountId=key(scope+'-account',userId);
  const ipId=key(scope+'-ip',ip);
  const comboId=key(scope+'-combo',userId+'|'+ip);

  const [cooldownCount,accountDailyCount,ipDailyCount]=await Promise.all([
    count('CODE_SEND_'+scope+'_COMBO',comboId,cooldownSince),
    count('CODE_SEND_'+scope+'_ACCOUNT',accountId,dayStart),
    count('CODE_SEND_'+scope+'_IP',ipId,dayStart)
  ]);

  if(cooldownCount>=1)return {allowed:false,retryAfterSeconds:cooldownSeconds,reason:'COOLDOWN' as const};
  if(accountDailyCount>=limits.accountDaily){
    const nextDay=dayStart.getTime()+24*60*60*1000;
    return {allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((nextDay-now.getTime())/1000)),reason:'ACCOUNT_DAILY' as const};
  }
  if(ipDailyCount>=limits.ipDaily){
    const nextDay=dayStart.getTime()+24*60*60*1000;
    return {allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((nextDay-now.getTime())/1000)),reason:'IP_DAILY' as const};
  }
  return {allowed:true,retryAfterSeconds:0,reason:null,accountId,ipId,comboId};
}

export async function reserveCodeSend(scope:string,req:Request,userId:string){
  const ip=clientIp(req);
  const accountId=key(scope+'-account',userId);
  const ipId=key(scope+'-ip',ip);
  const comboId=key(scope+'-combo',userId+'|'+ip);
  await Promise.all([
    logRate('CODE_SEND_'+scope+'_COMBO',comboId,userId),
    logRate('CODE_SEND_'+scope+'_ACCOUNT',accountId,userId),
    logRate('CODE_SEND_'+scope+'_IP',ipId,userId)
  ]);
}

export async function checkChallengeLimit(req:Request,purpose:string,jti:string,maxAttempts=5){
  const used=await latest('AUTH_CHALLENGE_USED',jti);
  if(used)return {allowed:false,reason:'USED' as const,remainingAttempts:0};
  const invalid=await latest('AUTH_CHALLENGE_INVALIDATED',jti);
  if(invalid)return {allowed:false,reason:'INVALIDATED' as const,remainingAttempts:0};

  const failures=await db.auditLog.count({
    where:{action:'AUTH_CHALLENGE_FAILURE',entityType:'AuthSecurity',entityId:jti}
  });
  if(failures>=maxAttempts)return {allowed:false,reason:'ATTEMPTS' as const,remainingAttempts:0};

  const ipId=key('challenge-ip-'+purpose,clientIp(req));
  const ipSince=new Date(Date.now()-CHALLENGE_IP_WINDOW_MS);
  const ipFailures=await count('AUTH_CHALLENGE_FAILURE_IP',ipId,ipSince);
  if(ipFailures>=20)return {allowed:false,reason:'IP_LIMIT' as const,remainingAttempts:Math.max(0,maxAttempts-failures)};

  return {allowed:true,reason:null,remainingAttempts:Math.max(0,maxAttempts-failures),ipId};
}

export async function recordChallengeFailure(req:Request,purpose:string,jti:string,userId?:string|null,maxAttempts=5){
  const ipId=key('challenge-ip-'+purpose,clientIp(req));
  await Promise.all([
    logRate('AUTH_CHALLENGE_FAILURE',jti,userId,{purpose}),
    logRate('AUTH_CHALLENGE_FAILURE_IP',ipId,userId,{purpose})
  ]);
  const failures=await db.auditLog.count({where:{action:'AUTH_CHALLENGE_FAILURE',entityType:'AuthSecurity',entityId:jti}});
  if(failures>=maxAttempts){
    await logRate('AUTH_CHALLENGE_INVALIDATED',jti,userId,{purpose,reason:'MAX_ATTEMPTS'});
  }
  return {failures,remainingAttempts:Math.max(0,maxAttempts-failures),invalidated:failures>=maxAttempts};
}

export async function markChallengeUsed(purpose:string,jti:string,userId?:string|null){
  await logRate('AUTH_CHALLENGE_USED',jti,userId,{purpose});
}
