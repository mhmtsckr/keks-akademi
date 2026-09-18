import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashSecret, verifySecret } from '@/lib/security';
import { createSession } from '@/lib/auth';

const schema = z.object({
  studentCode: z.string().min(2).max(32),
  accessKey: z.string().min(4).max(128),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const input = schema.parse(await req.json());
  const student = await db.student.findUnique({ where: { studentCode: input.studentCode.trim() }, include: { user: true } });
  if (!student || !(await verifySecret(input.accessKey, student.accessKeyHash))) {
    return NextResponse.json({ error: 'Öğrenci kodu veya giriş anahtarı hatalı.' }, { status: 401 });
  }

  const email = input.email.toLowerCase();
  const emailOwner = await db.user.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== student.userId) {
    return NextResponse.json({ error: 'Bu e-posta başka bir hesapta kullanılıyor.' }, { status: 409 });
  }

  const passwordHash = await hashSecret(input.password);
  let user = student.user;
  if (user) {
    user = await db.user.update({ where: { id: user.id }, data: { email, passwordHash, status: 'ACTIVE', name: student.fullName } });
  } else {
    user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: student.fullName,
        role: 'STUDENT',
        status: 'ACTIVE',
        student: { connect: { id: student.id } },
      },
    });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, role: 'STUDENT' });
}
