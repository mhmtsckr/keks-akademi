import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySecret } from '@/lib/security';
import { createSession } from '@/lib/auth';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(req: Request) {
  const input = schema.parse(await req.json());
  const user = await db.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user?.passwordHash || !(await verifySecret(input.password, user.passwordHash))) return NextResponse.json({ error: 'Giriş bilgileri hatalı.' }, { status: 401 });
  if (user.status !== 'ACTIVE') return NextResponse.json({ error: 'Hesap henüz aktif değil.' }, { status: 403 });
  await createSession(user.id);
  return NextResponse.json({ ok: true, role: user.role });
}
