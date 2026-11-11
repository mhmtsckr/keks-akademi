import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {HttpError,withApiErrors} from '@/lib/apiGuard';
import {readAcademicPerformance} from '@/lib/academicPerformanceService';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(404,'Öğrenci profili bulunamadı.');
  const result=await readAcademicPerformance(user.student.id);
  return NextResponse.json({ok:true,report:result},
    {headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
