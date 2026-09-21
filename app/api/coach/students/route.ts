import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

async function GET__handler() {
  const user = await requireRole(['COACH', 'ADMIN']);
  if (!user.coachProfile) return NextResponse.json({ error: 'Koç profili yok.' }, { status: 400 });
  const students = await db.student.findMany({
    where: { coachId: user.coachProfile.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, studentCode: true, fullName: true, gradeLevel: true, createdAt: true },
  });
  return NextResponse.json({ students });
}

async function POST__handler(){
  return NextResponse.json({error:'Öğrenci kaydı koç tarafından oluşturulamaz. Öğrenci kendi başvurusunu yapıp koçunu seçmelidir.'},{status:405});
}

export const GET = withApiErrors(GET__handler);
export const POST = withApiErrors(POST__handler);
