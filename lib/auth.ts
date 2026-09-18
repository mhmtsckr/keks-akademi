import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE = 'keks_session';

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
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
    return db.user.findUnique({ where: { id: payload.sub }, include: { coachProfile: true, student: true, parentProfile: true } });
  } catch {
    return null;
  }
}

export async function requireRole(roles: Array<'ADMIN'|'COACH'|'STUDENT'|'PARENT'>) {
  const user = await currentUser();
  if (!user || !roles.includes(user.role)) throw new Error('UNAUTHORIZED');
  return user;
}
