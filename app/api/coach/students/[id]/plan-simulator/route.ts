import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {withApiErrors} from '@/lib/apiGuard';
import {buildCapacityProfile,buildTopicMastery} from '@/lib/learningEngine';
import {simulatePlanOptions} from '@/lib/planSimulator';

const schema=z.object({
  dailyMinutes:z.number().int().min(30).max(480),
  studyDays:z.number().int().min(1).max(7),
  examsPerWeek:z.number().int().min(0).max(4)
});

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    select:{id:true,fullName:true}
  });
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});

  const input=schema.parse(await req.json());
  const [capacity,mastery]=await Promise.all([
    buildCapacityProfile(id),
    buildTopicMastery(id)
  ]);

  const simulation=simulatePlanOptions({
    ...input,
    focusBlockMinutes:capacity.recommendedFocusBlockMinutes,
    topics:mastery.map(x=>({
      subject:x.subject,
      topic:x.topic,
      status:x.status,
      score:x.score,
      accuracy:x.latestTestAccuracy??x.accuracy,
      overdueReviews:x.overdueReviews
    }))
  });

  return NextResponse.json({
    ok:true,
    student:{id:student.id,fullName:student.fullName},
    baseline:{
      observedDailyMinutes:capacity.actualAverageMinutes,
      suggestedDailyMinutes:capacity.suggestedDailyMinutes,
      focusBlockMinutes:capacity.recommendedFocusBlockMinutes
    },
    simulation
  });
}

export const POST=withApiErrors(POST__handler);
