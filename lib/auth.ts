import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import { AuthError } from './apiGuard';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = 'keks_session';

export async function createSession(userId: string, remember=false) {
  const maxAge=remember?60*60*24*30:60*60*24;
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
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

export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user=await db.user.findUnique({ where: { id: payload.sub }, include: { coachProfile: true, student: true, parentProfile: true } });
    if(!user||user.status!=='ACTIVE')return null;
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
