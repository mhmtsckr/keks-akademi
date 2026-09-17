import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashSecret, randomCode } from '@/lib/security';

export async function POST(req: Request) {
  const admin = await requireRole(['ADMIN']);
  const { assignedStudentId, maxUses = 1, expiresAt } = await req.json();
  const raw = randomCode('KEKS');
  const code = await db.academyCode.create({ data: { codeHash: await hashSecret(raw), codeHint: raw.slice(-4), assignedStudentId: assignedStudentId || null, maxUses, expiresAt: expiresAt ? new Date(expiresAt) : null, createdByUserId: admin.id } });
  return NextResponse.json({ id: code.id, code: raw, codeHint: code.codeHint });
}
