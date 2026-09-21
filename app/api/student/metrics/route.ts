import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { computeGoalProgress } from '@/lib/smartCoach';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const [goal,exams]=await Promise.all([
    computeGoalProgress(user.student.id),
    db.examResult.findMany({where:{studentId:user.student.id},orderBy:{createdAt:'asc'},take:50})
  ]);
  const series=exams.map(x=>({date:x.createdAt.toISOString(),examType:x.examType,payload:x.payload}));
  return NextResponse.json({ok:true,goal,series});
}

export const GET = withApiErrors(GET__handler);
