import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { encryptPrivateCode, hashSecret, randomCode } from '@/lib/security';
import { writeAudit } from '@/lib/audit';

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

export async function POST(){
  return NextResponse.json({error:'Öğrenci kaydı koç tarafından oluşturulamaz. Öğrenci kendi başvurusunu yapıp koçunu seçmelidir.'},{status:405});
}
