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

export async function POST(req: Request) {
  const user = await requireRole(['COACH', 'ADMIN']);
  if (!user.coachProfile) return NextResponse.json({ error: 'Koç profili yok.' }, { status: 400 });
  const input = createSchema.parse(await req.json());
  const studentCode = await uniqueStudentCode();
  const accessKey = randomCode('STD');

  const monthlyCode = randomCode('KEKS');
  const student = await db.$transaction(async tx => {
    const created = await tx.student.create({
      data: {
        studentCode,
        accessKeyHash: await hashSecret(accessKey),
        fullName: input.fullName,
        gradeLevel: input.gradeLevel || null,
        coachId: user.coachProfile!.id,
      },
    });
    await tx.academyCode.create({
      data:{
        codeHash:await hashSecret(monthlyCode),
        codeHint:monthlyCode.slice(-4),
        codeCiphertext:encryptPrivateCode(monthlyCode),
        assignedStudentId:created.id,
        maxUses:1,
        useCount:0,
        active:true,
        monthlyRecurring:true,
        createdByUserId:user.id
      }
    });
    return created;
  });

  await writeAudit({
    actorUserId:user.id,
    action:'STUDENT_CREATE',
    entityType:'Student',
    entityId:student.id,
    summary:student.fullName+' öğrencisi oluşturuldu; aylık KEKS test kodu yönetici erişimine kaydedildi.',
    metadata:{studentCode:student.studentCode,gradeLevel:student.gradeLevel}
  });

  return NextResponse.json({
    ok: true,
    student: { id: student.id, fullName: student.fullName, studentCode },
    accessKey,
    warning: 'Koça yalnız öğrenci kodu ve giriş anahtarı gösterilir. Aylık KEKS test kodu yalnız yönetici panelinde görüntülenir.',
  });
}
