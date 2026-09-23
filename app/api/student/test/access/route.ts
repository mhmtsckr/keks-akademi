import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifySecret } from '@/lib/security';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';
import { keksMonthlyProduct,productKeyFromReport } from '@/lib/monthlyProduct';
import { currentKeksCodeHintPrefix,hasBlockingNonPaidTestAccess,keksCodeHashInput } from '@/lib/keksAccessCode';

const schema = z.object({ code: z.string().max(128) });

async function POST__handler(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });
  const { code } = await readJson(req, schema);
  const now = new Date();
  const month=turkeyMonthWindow(now);
  const product=keksMonthlyProduct(now);
  const pendingCutoff=new Date(Math.max(month.start.getTime(),now.getTime()-45*60*1000));

  const [existingAccess,existingPayment,latestAssessment]=await Promise.all([
    hasBlockingNonPaidTestAccess(user.student.id,month.start,month.end),
    db.payment.findFirst({
      where:{
        studentId:user.student.id,
        OR:[
          {status:'PAID',createdAt:{gte:month.start,lt:month.end}},
          {status:'PENDING',createdAt:{gte:pendingCutoff,lt:month.end}}
        ]
      },
      orderBy:{createdAt:'desc'}
    }),
    db.assessment.findFirst({
      where:{studentId:user.student.id},
      orderBy:{completedAt:'desc'},
      select:{completedAt:true,report:true}
    })
  ]);

  if(existingAccess||existingPayment){
    return NextResponse.json({error:'Bu ayın KEKS test ürünü bu kullanıcı için zaten tanımlandı veya ödeme süreci başlatıldı. Her aylık ürün yalnızca bir kez kullanılabilir.',product},{status:409});
  }
  if(latestAssessment&&productKeyFromReport(latestAssessment.report,latestAssessment.completedAt)===product.key){
    return NextResponse.json({error:'Bu ayın KEKS test ürünü daha önce tamamlandı. Aynı kullanıcı aynı aylık ürünü ikinci kez çözemez.',product},{status:409});
  }

  const candidates = await db.academyCode.findMany({ where: { active: true, codeHint:{startsWith:currentKeksCodeHintPrefix()} } });

  for (const c of candidates) {
    if (c.expiresAt && c.expiresAt < now) continue;
    if (c.assignedStudentId && c.assignedStudentId !== user.student.id) continue;
    if (!(await verifySecret(keksCodeHashInput(code), c.codeHash))) continue;

    if (c.monthlyRecurring) {
      const already=await db.testAccess.findFirst({
        where:{
          studentId:user.student.id,
          academyCodeId:c.id,
          createdAt:{gte:month.start,lt:month.end}
        }
      });
      if(already) return NextResponse.json({error:'Bu KEKS Akademi kodu bu ay için zaten kullanıldı. Yeni ayda yeni ürün için tekrar kullanılabilir.',product},{status:409});

      await db.$transaction([
        db.academyCode.update({where:{id:c.id},data:{usedAt:now,useCount:{increment:1},active:true}}),
        db.testAccess.create({data:{studentId:user.student.id,source:'ACADEMY_CODE',academyCodeId:c.id,status:'READY'}})
      ]);
      return NextResponse.json({ok:true,monthly:true,month:month.key,product});
    }

    if (c.useCount >= c.maxUses) continue;
    await db.$transaction([
      db.academyCode.update({ where: { id: c.id }, data: { useCount: { increment: 1 }, usedAt: now, active: c.useCount + 1 < c.maxUses } }),
      db.testAccess.create({ data: { studentId: user.student.id, source: 'ACADEMY_CODE', academyCodeId: c.id } })
    ]);
    return NextResponse.json({ ok: true, product });
  }
  return NextResponse.json({ error: 'Kod geçersiz veya bu öğrenciye ait değil.' }, { status: 400 });
}

export const POST = withApiErrors(POST__handler);
