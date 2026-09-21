import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';

const schema = z.object({
  userId: z.string().min(1),
  status: z.enum(['ACTIVE','SUSPENDED']),
});

async function GET__handler() {
  await requireRole(['ADMIN']);
  const coaches = await db.user.findMany({
    where: { role: 'COACH' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  });
  return NextResponse.json({ coaches });
}

async function PATCH__handler(req: Request) {
  const admin = await requireRole(['ADMIN']);
  const input = await readJson(req, schema);
  const coach = await db.user.findFirst({ where: { id: input.userId, role: 'COACH' } });
  if (!coach) return NextResponse.json({ error: 'Koç bulunamadı.' }, { status: 404 });
  const updated = await db.user.update({ where: { id: coach.id }, data: { status: input.status } });
  await writeAudit({actorUserId:admin.id,action:'COACH_STATUS_UPDATE',entityType:'User',entityId:updated.id,summary:updated.name+' koç hesabı '+updated.status+' durumuna alındı.',metadata:{before:coach.status,after:updated.status}});
  return NextResponse.json({ ok: true, coach: { id: updated.id, status: updated.status } });
}

export const GET = withApiErrors(GET__handler);
export const PATCH = withApiErrors(PATCH__handler);
