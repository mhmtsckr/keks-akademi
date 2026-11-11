import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {HttpError,withApiErrors} from '@/lib/apiGuard';
import {readAcademicPerformance} from '@/lib/academicPerformanceService';

async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
  const {id}=await params;
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},select:{id:true}
  });
  if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
  const report=await readAcademicPerformance(student.id);
  return NextResponse.json({ok:true,report},
    {headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
