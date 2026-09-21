import { readJsonBody, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildReport, scoreAssessment } from '@/lib/scoring';
import { sendAssessmentReport } from '@/lib/mailer';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';

async function POST__handler(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });
  const body = await readJsonBody(req);
  const month=turkeyMonthWindow();
  const access = await db.testAccess.findFirst({
    where:{
      studentId:user.student.id,
      status:'READY',
      OR:[
        {source:{not:'ACADEMY_CODE'}},
        {source:'ACADEMY_CODE',createdAt:{gte:month.start,lt:month.end}}
      ]
    },
    orderBy:{createdAt:'asc'}
  });
  if (!access) return NextResponse.json({ error: 'Bu ay için aktif test erişimi bulunmuyor. Aylık KEKS Akademi kodunuzu kullanın.' }, { status: 403 });
  const questions = await db.testQuestion.findMany({ where: { formVersion: body.formVersion, ageBand: body.ageBand, active: true }, orderBy: { orderNo: 'asc' } });
  if (!questions.length) return NextResponse.json({ error: 'Bu form için soru bulunamadı.' }, { status: 400 });
  if (body.answers.length !== questions.length) return NextResponse.json({ error: 'Tüm sorular cevaplanmalıdır.' }, { status: 400 });
  const scores = scoreAssessment(questions, body.answers);
  const report = buildReport(scores);
  const assessment = await db.$transaction(async tx => {
    const created = await tx.assessment.create({ data: { studentId: user.student!.id, formVersion: body.formVersion, answers: body.answers, scores, report } });
    await tx.testAccess.update({ where: { id: access.id }, data: { status: 'USED', usedAt: new Date() } });
    return created;
  });
  try {
    await sendAssessmentReport({ studentCode: user.student.studentCode, studentName: user.student.fullName, assessmentId: assessment.id, report });
    await db.assessment.update({ where: { id: assessment.id }, data: { emailedAt: new Date() } });
  } catch (error) {
    console.error('REPORT_EMAIL_FAILED', error);
  }
  return NextResponse.json({ ok: true, message: 'Test tamamlandı. Rapor KEKS Akademi değerlendirme sistemine iletildi.' });
}

export const POST = withApiErrors(POST__handler);
