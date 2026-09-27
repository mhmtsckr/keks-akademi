import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { withApiErrors } from '@/lib/apiGuard';
import { ensureTodayLearningPlan,readTodayLearningPlan,rebalanceMissedTasksCapacityAware } from '@/lib/learningEngine';
import { isFeatureEnabled } from '@/lib/systemConfig';

function publicTodayPlan(today:any){
  return {
    date:today.date,
    generatedAt:today.generatedAt,
    plannedMinutes:today.plannedMinutes,
    plan:today.plan.map((item:any)=>({
      id:item.id,
      order:item.order,
      source:item.source,
      title:item.title,
      targetValue:item.targetValue,
      metricType:item.metricType,
      estimatedMinutes:item.estimatedMinutes,
      completed:item.completed
    }))
  };
}

async function studentContext():Promise<{studentId:string;studentCode:string}|Response>{
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode))){
    return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});
  }
  return {studentId:user.student.id,studentCode:user.student.studentCode};
}

// GET is read-only. It never generates or mutates the daily plan.
async function GET__handler(){
  const context=await studentContext();
  if(context instanceof Response)return context;
  const today=await readTodayLearningPlan(context.studentId);
  if(!today)return NextResponse.json({error:'Bugünün planı henüz hazırlanmadı.'},{status:404});
  return NextResponse.json({ok:true,today:publicTodayPlan(today)});
}

// POST idempotently creates today's snapshot once, then returns the stable daily order.
async function POST__handler(){
  const context=await studentContext();
  if(context instanceof Response)return context;
  await rebalanceMissedTasksCapacityAware(context.studentId);
  const today=await ensureTodayLearningPlan(context.studentId);
  return NextResponse.json({ok:true,today:publicTodayPlan(today)});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
