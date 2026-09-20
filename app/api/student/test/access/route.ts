import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifySecret } from '@/lib/security';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';

export async function POST(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });
  const { code } = await req.json();
  const candidates = await db.academyCode.findMany({ where: { active: true } });
  const now = new Date();
  const month=turkeyMonthWindow(now);

  for (const c of candidates) {
    if (c.expiresAt && c.expiresAt < now) continue;
    if (c.assignedStudentId && c.assignedStudentId !== user.student.id) continue;
    if (!(await verifySecret(code, c.codeHash))) continue;

    if (c.monthlyRecurring) {
      const already=await db.testAccess.findFirst({
        where:{
          studentId:user.student.id,
          academyCodeId:c.id,
          createdAt:{gte:month.start,lt:month.end}
        }
      });
      if(already) return NextResponse.json({error:'Bu KEKS Akademi kodu bu ay için zaten kullanıldı. Yeni ayda tekrar aktif olacaktır.'},{status:400});

      await db.$transaction([
        db.academyCode.update({where:{id:c.id},data:{usedAt:now,useCount:{increment:1},active:true}}),
        db.testAccess.create({data:{studentId:user.student.id,source:'ACADEMY_CODE',academyCodeId:c.id,status:'READY'}})
      ]);
      return NextResponse.json({ok:true,monthly:true,month:month.key});
    }

    if (c.useCount >= c.maxUses) continue;
    await db.$transaction([
      db.academyCode.update({ where: { id: c.id }, data: { useCount: { increment: 1 }, usedAt: now, active: c.useCount + 1 < c.maxUses } }),
      db.testAccess.create({ data: { studentId: user.student.id, source: 'ACADEMY_CODE', academyCodeId: c.id } })
    ]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Kod geçersiz veya bu öğrenciye ait değil.' }, { status: 400 });
}
