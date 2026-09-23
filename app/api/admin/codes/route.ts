import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { encryptPrivateCode, hashSecret, randomCode } from '@/lib/security';
import { writeAudit } from '@/lib/audit';

// Ücretli test erişimi üreten uç nokta; girdi doğrulanmadan Prisma'ya
// geçirilmemeli. Arayüz yalnızca {maxUses:1} gönderiyor, diğer alanlar isteğe
// bağlı tutuldu.
const schema = z.object({
  assignedStudentId: z.string().min(1).nullish(),
  maxUses: z.number().int().min(1).max(1000).default(1),
  expiresAt: z
    .string()
    .refine(v => !Number.isNaN(Date.parse(v)), 'Geçerli bir son kullanma tarihi gerekli.')
    .nullish(),
});

async function POST__handler(req: Request) {
  const admin = await requireRole(['ADMIN']);
  const input = await readJson(req, schema);

  if (input.assignedStudentId) {
    const student = await db.student.findUnique({
      where: { id: input.assignedStudentId },
      select: { id: true },
    });
    if (!student) return NextResponse.json({ error: 'Atanacak öğrenci bulunamadı.' }, { status: 404 });
  }

  const raw = randomCode('KEKS');
  const code = await db.academyCode.create({ data: { codeHash: await hashSecret(raw), codeHint: raw.slice(-4), codeCiphertext: encryptPrivateCode(raw), assignedStudentId: input.assignedStudentId ?? null, maxUses: input.maxUses, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null, createdByUserId: admin.id } });
  await writeAudit({actorUserId:admin.id,action:'ACADEMY_CODE_CREATE',entityType:'AcademyCode',entityId:code.id,summary:'Yeni KEKS erişim kodu oluşturuldu.',metadata:{codeHint:code.codeHint,assignedStudentId:code.assignedStudentId,maxUses:code.maxUses,expiresAt:code.expiresAt}});
  return NextResponse.json({ id: code.id, code: raw, codeHint: code.codeHint });
}

export const POST = withApiErrors(POST__handler);
