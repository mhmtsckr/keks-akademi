import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema = z.object({
  userId: z.string().min(1),
  status: z.enum(['ACTIVE','SUSPENDED']),
});

export async function GET() {
  await requireRole(['ADMIN']);
  const coaches = await db.user.findMany({
    where: { role: 'COACH' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  });
  return NextResponse.json({ coaches });
}

export async function PATCH(req: Request) {
  await requireRole(['ADMIN']);
  const input = schema.parse(await req.json());
  const coach = await db.user.findFirst({ where: { id: input.userId, role: 'COACH' } });
  if (!coach) return NextResponse.json({ error: 'Koç bulunamadı.' }, { status: 404 });
  const updated = await db.user.update({ where: { id: coach.id }, data: { status: input.status } });
  return NextResponse.json({ ok: true, coach: { id: updated.id, status: updated.status } });
}
