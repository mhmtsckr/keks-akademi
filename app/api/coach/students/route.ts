import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireRole(['COACH', 'ADMIN']);
  if (!user.coachProfile) return NextResponse.json({ error: 'Koç profili yok.' }, { status: 400 });
  const students = await db.student.findMany({
    where: { coachId: user.coachProfile.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, studentCode: true, fullName: true, gradeLevel: true, createdAt: true },
  });
  return NextResponse.json({ students });
}

export async function POST(){
  return NextResponse.json({error:'Öğrenci kaydı koç tarafından oluşturulamaz. Öğrenci kendi başvurusunu yapıp koçunu seçmelidir.'},{status:405});
}
