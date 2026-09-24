import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import { AuthError } from './apiGuard';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = 'keks_session';

function sessionStamp(updatedAt:Date){
  return updatedAt.getTime().toString(36);
}

export async function createSession(userId: string, remember=false) {
  const user=await db.user.findUnique({where:{id:userId},select:{id:true,status:true,updatedAt:true}});
  if(!user||user.status!=='ACTIVE')throw new AuthError(403,'Hesap aktif değil.');

  const maxAge=remember?60*60*24*30:60*60*24;
  const token = await new SignJWT({
    ss:sessionStamp(user.updatedAt),
    rm:remember
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(remember?'30d':'1d')
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function revokeAllSessions(userId:string){
  return db.user.update({
    where:{id:userId},
    data:{updatedAt:new Date()},
    select:{id:true,updatedAt:true}
  });
}

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.ss!=='string') return null;
    const user=await db.user.findUnique({ where: { id: payload.sub }, include: { coachProfile: true, student: true, parentProfile: true } });
    if(!user||user.status!=='ACTIVE')return null;
    if(payload.ss!==sessionStamp(user.updatedAt))return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireRole(roles: Array<'ADMIN'|'COACH'|'STUDENT'|'PARENT'>) {
  const user = await currentUser();
  if (!user) throw new AuthError(401, 'Oturum açmanız gerekiyor.');
  if (!roles.includes(user.role)) throw new AuthError(403, 'Bu işlem için yetkiniz yok.');
  return user;
}
