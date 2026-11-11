import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {requireRole} from '@/lib/auth';
import {withApiErrors,HttpError} from '@/lib/apiGuard';
import {approvedPlanAdherence} from '@/lib/approvedPlanAdherenceService';
import {isFeatureEnabled} from '@/lib/systemConfig';

async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)throw new HttpError(403,'Koç profili bulunamadı.');
  const {id}=await params;
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    select:{id:true,studentCode:true}
  });
  if(!student)throw new HttpError(404,'Öğrenci bulunamadı.');
  if(!(await isFeatureEnabled('SMART_COACH',student.studentCode)))
    throw new HttpError(403,'Akıllı Koç bu öğrenci için etkin değil.');
  const result=await approvedPlanAdherence(student.id);
  return NextResponse.json(result,{headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
