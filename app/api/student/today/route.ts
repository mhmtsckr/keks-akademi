import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { withApiErrors } from '@/lib/apiGuard';
import {
  buildCapacityProfile,
  buildGoalDistance,
  buildSubjectLearningModels,
  buildTodayLearningPlan,
  buildTopicMastery,
  buildStudentTimeline
} from '@/lib/learningEngine';
import { buildLatestExamInterventionReport } from '@/lib/examIntervention';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});

  const [today,mastery,subjects,goal,timeline,examReport]=await Promise.all([
    buildTodayLearningPlan(user.student.id),
    buildTopicMastery(user.student.id),
    buildSubjectLearningModels(user.student.id),
    buildGoalDistance(user.student.id),
    buildStudentTimeline(user.student.id),
    buildLatestExamInterventionReport(user.student.id)
  ]);

  return NextResponse.json({
    ok:true,
    today,
    capacity:today.capacity,
    mastery,
    subjects,
    goal,
    timeline,
    examReport
  });
}
export const GET=withApiErrors(GET__handler);
