import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { db } from '@/lib/db';
import {
  buildCapacityProfile,
  buildGoalDistance,
  buildInterventionImpact,
  buildPlanSimulation,
  buildStudentTimeline,
  buildSubjectLearningModels,
  buildTopicMastery,
  buildExamKnowledgeMap,
  buildCoachStudentAlignmentSignals
} from '@/lib/learningEngine';
import { buildLatestExamInterventionReport } from '@/lib/examIntervention';
import { listResourceTracking } from '@/lib/resourceTracking';
import { buildStudentIndicators } from '@/lib/studentIndicators';

const simulationSchema=z.object({
  dailyMinutes:z.number().int().min(30).max(480),
  studyDaysPerWeek:z.number().int().min(1).max(7),
  examsPerWeek:z.number().int().min(0).max(4)
});

async function ownedStudent(id:string,coachId:string){
  return db.student.findFirst({where:{id,coachId},select:{id:true,fullName:true,studentCode:true}});
}

async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await ownedStudent(id,user.coachProfile.id);
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});

  const [capacity,mastery,subjects,goal,impact,timeline,examReport,examMap,alignment,resources,indicators]=await Promise.all([
    buildCapacityProfile(id),
    buildTopicMastery(id),
    buildSubjectLearningModels(id),
    buildGoalDistance(id),
    buildInterventionImpact(id),
    buildStudentTimeline(id),
    buildLatestExamInterventionReport(id),
    buildExamKnowledgeMap(id),
    buildCoachStudentAlignmentSignals(id),
    listResourceTracking(id),
    buildStudentIndicators(id)
  ]);

  const resourceSummary={
    total:resources.length,
    review:resources.filter((x:any)=>x.efficiency?.status==='REVIEW'),
    watch:resources.filter((x:any)=>x.efficiency?.status==='WATCH'),
    normal:resources.filter((x:any)=>x.efficiency?.status==='NORMAL'),
    resources
  };

  return NextResponse.json({ok:true,student,capacity,mastery,subjects,goal,impact,timeline,examReport,examMap,alignment,indicators,resourceTracking:resourceSummary});
}

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await ownedStudent(id,user.coachProfile.id);
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const input=await readJson(req,simulationSchema);
  return NextResponse.json({ok:true,student,simulation:await buildPlanSimulation(id,input)});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
