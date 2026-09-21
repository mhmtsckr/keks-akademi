import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { hashSecret, randomCode } from '@/lib/security';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('plan'), title: z.string().min(2).max(160), payload: z.any().optional() }),
  z.object({ action: z.literal('log'), date: z.string(), payload: z.any() }),
  z.object({ action: z.literal('technique'), title: z.string().min(2).max(160), description: z.string().max(4000).optional() }),
  z.object({ action: z.literal('exam'), examType: z.string().min(2).max(120), payload: z.any() }),
  z.object({ action: z.literal('profile'), goal: z.string().max(2000).optional(), profile: z.any().optional() }),
  z.object({ action: z.literal('report'), title: z.string().min(2).max(160), summary: z.string().max(2000).optional(), content: z.string().min(2).max(20000), visibleToStudent: z.boolean().default(true), visibleToParent: z.boolean().default(true) }),
  z.object({ action: z.literal('parentCode'), parentName: z.string().min(2).max(120).optional() }),
]);

async function ownedStudent(user: any, studentId: string) {
  if (!user.coachProfile) return null;
  return db.student.findFirst({ where: { id: studentId, coachId: user.coachProfile.id } });
}

async function POST__handler(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['COACH','ADMIN']);
  const { id } = await context.params;
  const student = await ownedStudent(user, id);
  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı veya yetkiniz yok.' }, { status: 404 });

  const input = await readJson(req, actionSchema);

  if (input.action === 'plan') {
    const row = await db.studyPlan.create({ data: { studentId: student.id, title: input.title, payload: input.payload ?? {}, active: true } });
    return NextResponse.json({ ok: true, row });
  }
  if (input.action === 'log') {
    const row = await db.dailyLog.create({ data: { studentId: student.id, date: new Date(input.date), payload: input.payload } });
    return NextResponse.json({ ok: true, row });
  }
  if (input.action === 'technique') {
    const row = await db.studyTechnique.create({ data: { studentId: student.id, title: input.title, description: input.description || null } });
    return NextResponse.json({ ok: true, row });
  }
  if (input.action === 'exam') {
    const row = await db.examResult.create({ data: { studentId: student.id, examType: input.examType, payload: input.payload } });
    return NextResponse.json({ ok: true, row });
  }
  if (input.action === 'profile') {
    const row = await db.student.update({ where: { id: student.id }, data: { goal: input.goal || null, profile: input.profile ?? undefined } });
    return NextResponse.json({ ok: true, row });
  }
  if (input.action === 'report') {
    const row = await db.studentReport.create({ data: { studentId: student.id, title: input.title, summary: input.summary || null, content: input.content, createdByUserId: user.id, visibleToStudent: input.visibleToStudent, visibleToParent: input.visibleToParent } });
    return NextResponse.json({ ok: true, row });
  }

  const raw = randomCode('VELI');
  const existing = await db.parentProfile.findFirst({ where: { studentId: student.id, active: true }, include: { user: true } });
  if (existing) {
    await db.parentProfile.update({ where: { id: existing.id }, data: { accessCodeHash: await hashSecret(raw), codeHint: raw.slice(-4) } });
    if (input.parentName) await db.user.update({ where: { id: existing.userId }, data: { name: input.parentName } });
    return NextResponse.json({ ok: true, code: raw, studentCode: student.studentCode, parentUserId: existing.userId });
  }
  const parentUser = await db.user.create({
    data: {
      name: input.parentName || ('Veli - ' + student.fullName),
      role: 'PARENT',
      status: 'ACTIVE',
      parentProfile: { create: { studentId: student.id, accessCodeHash: await hashSecret(raw), codeHint: raw.slice(-4), active: true } },
    },
  });
  return NextResponse.json({ ok: true, code: raw, studentCode: student.studentCode, parentUserId: parentUser.id });
}

export const POST = withApiErrors(POST__handler);
