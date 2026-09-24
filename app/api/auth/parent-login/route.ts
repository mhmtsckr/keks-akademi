import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifySecret } from '@/lib/security';

const schema = z.object({
  studentCode: z.string().min(2).max(32),
  parentCode: z.string().min(4).max(128),
});

async function POST__handler(req: Request) {
  const input = await readJson(req, schema);
  const student = await db.student.findUnique({
    where: { studentCode: input.studentCode.trim() },
    include: { parentProfiles: { where: { active: true }, include: { user: true } } },
  });
  if (!student) return NextResponse.json({ error: 'Öğrenci veya veli kodu hatalı.' }, { status: 401 });

  for (const profile of student.parentProfiles) {
    if (await verifySecret(input.parentCode, profile.accessCodeHash)) {
      if(!profile.consentRecordedAt)return NextResponse.json({error:'Veli izni doğrulanmadı. Koçunuzdan yeni bir veli bağlantısı isteyin.'},{status:403});
      if (profile.user.status !== 'ACTIVE') return NextResponse.json({ error: 'Veli hesabı aktif değil.' }, { status: 403 });
      await createSession(profile.userId,false,req);
      return NextResponse.json({ ok: true, role: 'PARENT' });
    }
  }
  return NextResponse.json({ error: 'Öğrenci veya veli kodu hatalı.' }, { status: 401 });
}

export const POST = withApiErrors(POST__handler);
