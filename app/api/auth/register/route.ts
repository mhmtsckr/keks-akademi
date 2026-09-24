import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret } from '@/lib/security';
import { purgeSuspendedUserByEmail } from '@/lib/suspendedUserCleanup';

const schema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) });

async function POST__handler(req: Request) {
  const input = await readJson(req, schema);
  const email=input.email.toLowerCase();
  let exists = await db.user.findUnique({ where: { email } });
  if(exists?.status==='SUSPENDED'){
    await purgeSuspendedUserByEmail(email);
    exists=await db.user.findUnique({where:{email}});
  }
  if (exists) return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı.' }, { status: 409 });
  const user = await db.user.create({ data: { name: input.name, email, passwordHash: await hashSecret(input.password), role: 'COACH', status: 'PENDING', coachProfile: { create: {} } } });
  return NextResponse.json({ ok: true, userId: user.id, message: 'Koç hesabı oluşturuldu. Yönetici onayı bekleniyor.' });
}

export const POST = withApiErrors(POST__handler);
