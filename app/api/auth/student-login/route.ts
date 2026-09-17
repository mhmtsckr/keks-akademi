import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifySecret } from '@/lib/security';

const schema = z.object({
  studentCode: z.string().min(2).max(32),
  accessKey: z.string().min(4).max(128),
});

export async function POST(req: Request) {
  const input = schema.parse(await req.json());
  const student = await db.student.findUnique({
    where: { studentCode: input.studentCode.trim() },
    include: { user: true },
  });
  if (!student || !(await verifySecret(input.accessKey, student.accessKeyHash))) {
    return NextResponse.json({ error: 'Öğrenci kodu veya giriş anahtarı hatalı.' }, { status: 401 });
  }

  let user = student.user;
  if (!user) {
    user = await db.user.create({
      data: {
        name: student.fullName,
        role: 'STUDENT',
        status: 'ACTIVE',
        student: { connect: { id: student.id } },
      },
    });
  }
  if (user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Hesap aktif değil.' }, { status: 403 });
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true, role: 'STUDENT' });
}
