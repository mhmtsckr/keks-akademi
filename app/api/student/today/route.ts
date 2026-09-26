import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { withApiErrors } from '@/lib/apiGuard';
import { getTodayLearningPlan } from '@/lib/learningEngine';
import { isFeatureEnabled } from '@/lib/systemConfig';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode)))return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});

  const today=await getTodayLearningPlan(user.student.id);

  return NextResponse.json({
    ok:true,
    today:{
      date:today.date,
      morningGeneratedAt:today.morningGeneratedAt,
      refreshedAt:today.refreshedAt,
      plannedMinutes:today.plannedMinutes,
      plan:today.plan.map(item=>({
        id:item.id,
        order:item.order,
        source:item.source,
        title:item.title,
        targetValue:item.targetValue,
        metricType:item.metricType,
        estimatedMinutes:item.estimatedMinutes,
        completed:item.completed
      }))
    }
  });
}

export const GET=withApiErrors(GET__handler);
