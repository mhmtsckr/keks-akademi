import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { withApiErrors } from '@/lib/apiGuard';
import {
  buildCapacityProfile,
  buildGoalDistance,
  buildSubjectLearningModels,
  buildTodayLearningPlan,
  buildTopicMastery,
  buildStudentTimeline,
  buildExamKnowledgeMap
} from '@/lib/learningEngine';
import { buildLatestExamInterventionReport } from '@/lib/examIntervention';
import { isFeatureEnabled } from '@/lib/systemConfig';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode)))return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});

  const [today,mastery,subjects,goal,timeline,examReport,examMap]=await Promise.all([
    buildTodayLearningPlan(user.student.id),
    buildTopicMastery(user.student.id),
    buildSubjectLearningModels(user.student.id),
    buildGoalDistance(user.student.id),
    buildStudentTimeline(user.student.id),
    buildLatestExamInterventionReport(user.student.id),
    buildExamKnowledgeMap(user.student.id)
  ]);

  return NextResponse.json({
    ok:true,
    today,
    capacity:today.capacity,
    mastery,
    subjects,
    goal,
    timeline,
    examReport,
    examMap
  });
}
export const GET=withApiErrors(GET__handler);
