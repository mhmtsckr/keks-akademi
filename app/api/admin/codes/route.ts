import { readJsonBody, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashSecret, randomCode } from '@/lib/security';
import { writeAudit } from '@/lib/audit';

async function POST__handler(req: Request) {
  const admin = await requireRole(['ADMIN']);
  const { assignedStudentId, maxUses = 1, expiresAt } = await readJsonBody(req);
  const raw = randomCode('KEKS');
  const code = await db.academyCode.create({ data: { codeHash: await hashSecret(raw), codeHint: raw.slice(-4), assignedStudentId: assignedStudentId || null, maxUses, expiresAt: expiresAt ? new Date(expiresAt) : null, createdByUserId: admin.id } });
  await writeAudit({actorUserId:admin.id,action:'ACADEMY_CODE_CREATE',entityType:'AcademyCode',entityId:code.id,summary:'Yeni KEKS erişim kodu oluşturuldu.',metadata:{codeHint:code.codeHint,assignedStudentId:code.assignedStudentId,maxUses:code.maxUses,expiresAt:code.expiresAt}});
  return NextResponse.json({ id: code.id, code: raw, codeHint: code.codeHint });
}

export const POST = withApiErrors(POST__handler);
