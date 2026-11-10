import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {withApiErrors,HttpError} from '@/lib/apiGuard';
import {buildLearningDiagnostics} from '@/lib/learningDiagnostics';
import {buildLearningFollowUps} from '@/lib/learningFollowUp';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(400,'Öğrenci profili bulunamadı.');
  const now=new Date();
  const rows=await db.practiceLog.findMany({
    where:{studentId:user.student.id,date:{gte:new Date(now.getTime()-35*86400000),lte:now}},
    orderBy:{date:'desc'},take:500,
    select:{subject:true,topic:true,date:true,total:true,correct:true,wrong:true,blank:true,taskSubmissionId:true}
  });
  const topics=buildLearningDiagnostics(rows,now,8);
  return NextResponse.json({
    ok:true,
    generatedAt:now.toISOString(),
    windowDays:35,
    limitedRows:rows.length===500,
    description:'Farklı günlerdeki soru performansından elde edilen eğilimlerdir; kalıcı öğrenmenin kesin kanıtı değildir.',
    topics,
    followUps:buildLearningFollowUps(topics,now,6),
    actionPolicy:'COACH_APPROVAL_REQUIRED_NO_AUTOMATIC_STUDENT_TASKS'
  },{headers:{'Cache-Control':'private, no-store'}});
}

export const GET=withApiErrors(GET__handler);
