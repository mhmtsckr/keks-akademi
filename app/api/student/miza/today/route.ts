import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {ensureTodayLearningPlan} from '@/lib/learningEngine';
import {buildMizaTodayOrchestration,formatMizaTodayReply} from '@/lib/mizaOrchestrator';
import {isFeatureEnabled} from '@/lib/systemConfig';
import {recordMizaDailySummary} from '@/lib/mizaLearningService';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  if(!(await isFeatureEnabled('MIZA_ORCHESTRATOR',user.student.studentCode)))return NextResponse.json({error:'MİZA Öğrenme Orkestratörü bu hesap için etkin değil.'},{status:403});
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode)))return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});

  const today=await ensureTodayLearningPlan(user.student.id);
  const orchestration=buildMizaTodayOrchestration(today);
  await recordMizaDailySummary(user.student.id,orchestration);
  return NextResponse.json({
    ok:true,
    mode:'TODAY_ORCHESTRATION',
    orchestration,
    reply:formatMizaTodayReply(orchestration)
  });
}

export const GET=withApiErrors(GET__handler);
