import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {ensureTodayLearningPlan,readTodayLearningPlan,rebalanceMissedTasksCapacityAware} from '@/lib/learningEngine';
import {buildMizaTodayOrchestration,formatMizaTodayReply} from '@/lib/mizaOrchestrator';
import {isFeatureEnabled} from '@/lib/systemConfig';
import {recordMizaDailySummary} from '@/lib/mizaLearningService';
import {ensureMizaCapacityCoachAlert} from '@/lib/mizaCapacityEscalation';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  if(!(await isFeatureEnabled('MIZA_ORCHESTRATOR',user.student.studentCode)))return NextResponse.json({error:'MİZA Öğrenme Orkestratörü bu hesap için etkin değil.'},{status:403});
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode)))return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});

  const today=await readTodayLearningPlan(user.student.id);
  if(!today)return NextResponse.json({error:'MİZA günlük planı henüz hazırlanmadı.'},{status:404});
  const orchestration=buildMizaTodayOrchestration(today);
  return NextResponse.json({
    ok:true,
    mode:'TODAY_ORCHESTRATION',
    orchestration,
    reply:formatMizaTodayReply(orchestration)
  });
}

async function POST__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  if(!(await isFeatureEnabled('MIZA_ORCHESTRATOR',user.student.studentCode)))return NextResponse.json({error:'MİZA Öğrenme Orkestratörü bu hesap için etkin değil.'},{status:403});
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode)))return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});

  const rebalance=await rebalanceMissedTasksCapacityAware(user.student.id);
  await ensureMizaCapacityCoachAlert(user.student.id,rebalance);
  const today=await ensureTodayLearningPlan(user.student.id);
  const orchestration=buildMizaTodayOrchestration(today,rebalance);
  await recordMizaDailySummary(user.student.id,orchestration);

  return NextResponse.json({
    ok:true,
    mode:'TODAY_ORCHESTRATION',
    orchestration,
    reply:formatMizaTodayReply(orchestration)
  });
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
