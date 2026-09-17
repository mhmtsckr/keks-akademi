import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { hashSecret, randomCode } from '@/lib/security';

const createSchema = z.object({
  fullName: z.string().min(2).max(120),
  gradeLevel: z.string().max(80).optional(),
});

async function uniqueStudentCode() {
  for (let i = 0; i < 20; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!(await db.student.findUnique({ where: { studentCode: code } }))) return code;
  }
  throw new Error('STUDENT_CODE_EXHAUSTED');
}

export async function GET() {
  const user = await requireRole(['COACH', 'ADMIN']);
  if (!user.coachProfile) return NextResponse.json({ error: 'Koç profili yok.' }, { status: 400 });
  const students = await db.student.findMany({
    where: { coachId: user.coachProfile.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, studentCode: true, fullName: true, gradeLevel: true, createdAt: true },
  });
  return NextResponse.json({ students });
}

export async function POST(req: Request) {
  const user = await requireRole(['COACH', 'ADMIN']);
  if (!user.coachProfile) return NextResponse.json({ error: 'Koç profili yok.' }, { status: 400 });
  const input = createSchema.parse(await req.json());
  const studentCode = await uniqueStudentCode();
  const accessKey = randomCode('STD');

  const student = await db.student.create({
    data: {
      studentCode,
      accessKeyHash: await hashSecret(accessKey),
      fullName: input.fullName,
      gradeLevel: input.gradeLevel || null,
      coachId: user.coachProfile.id,
    },
  });

  return NextResponse.json({
    ok: true,
    student: { id: student.id, fullName: student.fullName, studentCode },
    accessKey,
    warning: 'Giriş anahtarı yalnızca bu yanıtta açık olarak gösterilir. Öğrenciye güvenli biçimde iletin.',
  });
}
