import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifySecret } from '@/lib/security';

export async function POST(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });
  const { code } = await req.json();
  const candidates = await db.academyCode.findMany({ where: { active: true, useCount: { lt: 10 } } });
  const now = new Date();
  for (const c of candidates) {
    if (c.expiresAt && c.expiresAt < now) continue;
    if (c.assignedStudentId && c.assignedStudentId !== user.student.id) continue;
    if (c.useCount >= c.maxUses) continue;
    if (!(await verifySecret(code, c.codeHash))) continue;
    await db.$transaction([
      db.academyCode.update({ where: { id: c.id }, data: { useCount: { increment: 1 }, usedAt: now, active: c.useCount + 1 < c.maxUses } }),
      db.testAccess.create({ data: { studentId: user.student.id, source: 'ACADEMY_CODE', academyCodeId: c.id } })
    ]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Kod geçersiz, kullanılmış veya bu öğrenciye ait değil.' }, { status: 400 });
}
