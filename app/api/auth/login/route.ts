import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret, verifySecret } from '@/lib/security';
import { createSession } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export async function POST(req: Request) {
  const input = schema.parse(await req.json());
  const email = input.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Giriş bilgileri hatalı.' }, { status: 401 });

  if (!user.passwordHash) {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || '';
    const canBootstrap = user.role === 'ADMIN' && email === adminEmail && initialPassword && safeEqual(input.password, initialPassword);
    if (!canBootstrap) return NextResponse.json({ error: 'Giriş bilgileri hatalı.' }, { status: 401 });
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashSecret(input.password), status: 'ACTIVE' } });
  } else if (!(await verifySecret(input.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Giriş bilgileri hatalı.' }, { status: 401 });
  }

  if (user.status !== 'ACTIVE') return NextResponse.json({ error: 'Hesap henüz aktif değil.' }, { status: 403 });
  await createSession(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
