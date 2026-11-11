import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors,HttpError} from '@/lib/apiGuard';
import {approvedPlanAdherence} from '@/lib/approvedPlanAdherenceService';
import {isFeatureEnabled} from '@/lib/systemConfig';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(404,'Öğrenci profili bulunamadı.');
  if(!(await isFeatureEnabled('SMART_COACH',user.student.studentCode)))
    throw new HttpError(403,'Akıllı Koç bu hesap için etkin değil.');
  const result=await approvedPlanAdherence(user.student.id);
  return NextResponse.json(result,{headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
