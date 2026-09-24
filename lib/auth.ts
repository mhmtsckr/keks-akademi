import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import { AuthError } from './apiGuard';
import { writeAudit } from './audit';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const secretString=()=>process.env.AUTH_SECRET||'';
const COOKIE = 'keks_session';

function sessionStamp(updatedAt:Date){
  return updatedAt.getTime().toString(36);
}

function sidHash(sid:string){
  return crypto.createHmac('sha256',secretString()).update('session|'+sid).digest('hex').slice(0,40);
}

function ipHash(req?:Request){
  if(!req)return null;
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ||req.headers.get('x-real-ip')?.trim()
    ||req.headers.get('cf-connecting-ip')?.trim()
    ||'unknown';
  return crypto.createHmac('sha256',secretString()).update('ip|'+ip).digest('hex').slice(0,40);
}

function deviceLabel(req?:Request){
  const ua=(req?.headers.get('user-agent')||'').slice(0,500);
  if(!ua)return 'Bilinmeyen cihaz';
  const os=/Windows/i.test(ua)?'Windows'
    :/Android/i.test(ua)?'Android'
    :/iPhone|iPad/i.test(ua)?'iOS/iPadOS'
    :/Mac OS X|Macintosh/i.test(ua)?'macOS'
    :/Linux/i.test(ua)?'Linux':'Diğer';
  const browser=/Edg\//i.test(ua)?'Edge'
    :/Firefox\//i.test(ua)?'Firefox'
    :/Chrome\//i.test(ua)?'Chrome'
    :/Safari\//i.test(ua)?'Safari':'Tarayıcı';
  return os+' · '+browser;
}

type SessionClaims={
  userId:string;
  sid:string;
  sidHash:string;
  stamp:string;
  remember:boolean;
  expiresAt:Date|null;
};

async function readSessionClaims():Promise<SessionClaims|null>{
  const jar=await cookies();
  const token=jar.get(COOKIE)?.value;
  if(!token)return null;
  try{
    const {payload}=await jwtVerify(token,secret());
    if(!payload.sub||typeof payload.ss!=='string'||typeof payload.sid!=='string')return null;
    return {
      userId:String(payload.sub),
      sid:payload.sid,
      sidHash:sidHash(payload.sid),
      stamp:payload.ss,
      remember:Boolean(payload.rm),
      expiresAt:typeof payload.exp==='number'?new Date(payload.exp*1000):null
    };
  }catch{return null}
}

export async function createSession(userId:string,remember=false,req?:Request){
  const user=await db.user.findUnique({where:{id:userId},select:{id:true,status:true,updatedAt:true}});
  if(!user||user.status!=='ACTIVE')throw new AuthError(403,'Hesap aktif değil.');

  const sid=crypto.randomUUID();
  const maxAge=remember?60*60*24*30:60*60*24;
  const expiresAt=new Date(Date.now()+maxAge*1000);
  const token=await new SignJWT({
    ss:sessionStamp(user.updatedAt),
    rm:remember,
    sid
  })
    .setProtectedHeader({alg:'HS256'})
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(remember?'30d':'1d')
    .sign(secret());

  const jar=await cookies();
  jar.set(COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge});

  await writeAudit({
    actorUserId:userId,
    action:'SESSION_CREATED',
    entityType:'UserSession',
    entityId:userId,
    summary:'Yeni kullanıcı oturumu oluşturuldu.',
    metadata:{
      sidHash:sidHash(sid),
      device:deviceLabel(req),
      ipHash:ipHash(req),
      remember,
      expiresAt:expiresAt.toISOString()
    }
  });
}

export async function destroySession(){
  const jar=await cookies();
  jar.delete(COOKIE);
}

export async function endCurrentSession(reason='LOGOUT'){
  const claims=await readSessionClaims();
  if(claims){
    await writeAudit({
      actorUserId:claims.userId,
      action:'SESSION_ENDED',
      entityType:'UserSession',
      entityId:claims.userId,
      summary:'Kullanıcı oturumu sonlandırıldı.',
      metadata:{sidHash:claims.sidHash,reason}
    });
  }
  await destroySession();
}

export async function currentSessionClaims(){
  return readSessionClaims();
}

export async function revokeAllSessions(userId:string){
  return db.user.update({
    where:{id:userId},
    data:{updatedAt:new Date()},
    select:{id:true,updatedAt:true}
  });
}

export async function currentUser(){
  const claims=await readSessionClaims();
  if(!claims)return null;
  try{
    const user=await db.user.findUnique({where:{id:claims.userId},include:{coachProfile:true,student:true,parentProfile:true}});
    if(!user||user.status!=='ACTIVE')return null;
    if(claims.stamp!==sessionStamp(user.updatedAt))return null;
    return user;
  }catch{return null}
}

export async function requireRole(roles:Array<'ADMIN'|'COACH'|'STUDENT'|'PARENT'>){
  const user=await currentUser();
  if(!user)throw new AuthError(401,'Oturum açmanız gerekiyor.');
  if(!roles.includes(user.role))throw new AuthError(403,'Bu işlem için yetkiniz yok.');
  return user;
}
