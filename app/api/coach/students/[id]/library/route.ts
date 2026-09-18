import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireRole(['COACH','ADMIN']);
  const { id } = await context.params;
  if (!user.coachProfile) return NextResponse.json({ error: 'Koç profili yok.' }, { status: 400 });
  const student = await db.student.findFirst({ where: { id, coachId: user.coachProfile.id } });
  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı veya yetkiniz yok.' }, { status: 404 });

  const form = await req.formData();
  const title = String(form.get('title') || '').trim();
  const note = String(form.get('note') || '').trim();
  const file = form.get('file');
  if (!title) return NextResponse.json({ error: 'Başlık gerekli.' }, { status: 400 });

  let fileName: string | null = null;
  let mimeType: string | null = null;
  let fileSize: number | null = null;
  let fileData: Buffer | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Dosya en fazla 5 MB olabilir.' }, { status: 413 });
    fileName = file.name;
    mimeType = file.type || 'application/octet-stream';
    fileSize = file.size;
    fileData = Buffer.from(await file.arrayBuffer());
  }

  const row = await db.libraryItem.create({
    data: { studentId: student.id, title, note: note || null, fileName, mimeType, fileSize, fileData, createdByUserId: user.id },
  });
  return NextResponse.json({ ok: true, row: { id: row.id, title: row.title, fileName: row.fileName } });
}
