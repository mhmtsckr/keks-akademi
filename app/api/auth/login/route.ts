import { readJson, withApiErrors } from '@/lib/apiGuard';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret, verifySecret } from '@/lib/security';
import { createSession } from '@/lib/auth';

const schema = z.object({
  email:z.string().email(),
  password:z.string().min(1),
  remember:z.boolean().optional().default(false)
});

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

async function POST__handler(req: Request) {
  const input = await readJson(req, schema);
  const email = input.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });

  if (!user.passwordHash) {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || '';
    const canBootstrap = user.role === 'ADMIN' && email === adminEmail && initialPassword && safeEqual(input.password, initialPassword);
    if (!canBootstrap) {
      return NextResponse.json({
        error:user.role==='STUDENT'
          ?'Bu eski öğrenci hesabında henüz şifre oluşturulmamış. Şifremi unuttum bağlantısını kullanarak şifre oluşturun.'
          :'E-posta veya şifre hatalı.'
      }, { status: 401 });
    }
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashSecret(input.password), status: 'ACTIVE' } });
  } else if (!(await verifySecret(input.password, user.passwordHash))) {
    return NextResponse.json({ error: 'E-posta veya şifre hatalı.' }, { status: 401 });
  }

  if (user.status === 'SUSPENDED') return NextResponse.json({ error: 'Bu hesap askıya alınmış durumda.' }, { status: 403 });
  if (user.status !== 'ACTIVE') return NextResponse.json({ error: 'Hesap henüz aktif değil.' }, { status: 403 });
  await createSession(user.id,input.remember);
  return NextResponse.json({ ok: true, role: user.role });
}

export const POST = withApiErrors(POST__handler);
