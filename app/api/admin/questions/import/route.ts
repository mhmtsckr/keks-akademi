import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

const item = z.object({
  formVersion: z.string().min(1).max(50),
  ageBand: z.string().min(1).max(50),
  orderNo: z.number().int().positive(),
  dimension: z.string().min(1).max(80),
  reverse: z.boolean().default(false),
  prompt: z.string().min(3).max(1000),
  active: z.boolean().default(true),
});
const schema = z.object({ questions: z.array(item).min(1).max(500) });

export async function POST(req: Request) {
  const admin=await requireRole(['ADMIN']);
  const input = schema.parse(await req.json());
  for (const q of input.questions) {
    await db.testQuestion.upsert({
      where: { formVersion_ageBand_orderNo: { formVersion: q.formVersion, ageBand: q.ageBand, orderNo: q.orderNo } },
      update: q,
      create: q,
    });
  }
  await writeAudit({actorUserId:admin.id,action:'SCREENING_QUESTION_IMPORT',entityType:'TestQuestion',summary:input.questions.length+' tarama sorusu içe aktarıldı.',metadata:{count:input.questions.length}});
  return NextResponse.json({ ok: true, imported: input.questions.length });
}
