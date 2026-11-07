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
import {REMEDIATION_REASONS,isRemediationReason} from '@/lib/wrongQuestionRemediation';
import {levelAwareErrorRecovery} from '@/lib/levelAwareErrorRecovery';
import {buildAdvancedRecoveryProgram} from '@/lib/advancedRecoveryProgram';
import {summarizeParagrafCoachEvidence} from '@/lib/paragrafCoachRemediation';
import {summarizeAllLevelQuizCoachEvidence} from '@/lib/allLevelQuizCoachEvidence';
import {loadTopicTransferEvidence} from '@/lib/topicTransferService';

const simulationSchema=z.object({
  dailyMinutes:z.number().int().min(30).max(480),
  studyDaysPerWeek:z.number().int().min(1).max(7),
  examsPerWeek:z.number().int().min(0).max(4)
});

async function ownedStudent(id:string,coachId:string){
  return db.student.findFirst({where:{id,coachId},select:{id:true,fullName:true,studentCode:true,gradeLevel:true,academicTrack:true}});
}

async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await ownedStudent(id,user.coachProfile.id);
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});

  const [capacity,mastery,subjects,goal,impact,timeline,examReport,examMap,alignment,resources,indicators,topicTransfer]=await Promise.all([
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
    buildStudentIndicators(id),
    loadTopicTransferEvidence(id)
  ]);

  const recentLogs=await db.dailyLog.findMany({
    where:{studentId:id,date:{gte:new Date(Date.now()-30*86400000)}},
    select:{date:true,payload:true},orderBy:{date:'desc'},take:500
  });
  const remediationMap=new Map<string,{
    subject:string;topic:string;examType:string|null;wrongCount:number;blankCount:number;totalReviews:number;
    guidedAttempts:number;guidedCorrect:number;
    lastDifficultyAt:string;reasonCounts:Record<string,number>;
  }>();
  for(const log of recentLogs){
    const p=(log.payload&&typeof log.payload==='object'&&!Array.isArray(log.payload))
      ?log.payload as Record<string,unknown>:{};
    if(!['REVIEW_RESULT','GUIDED_PRACTICE_RESULT'].includes(String(p.type))
      ||typeof p.subject!=='string'||typeof p.topic!=='string')continue;
    const key=p.subject+'|'+p.topic;
    const row=remediationMap.get(key)||{
      subject:p.subject,topic:p.topic,examType:null,wrongCount:0,blankCount:0,totalReviews:0,
      guidedAttempts:0,guidedCorrect:0,
      lastDifficultyAt:'',reasonCounts:{} as Record<string,number>
    };
    if(p.type==='REVIEW_RESULT'&&typeof p.examType==='string'&&p.examType.trim())
      row.examType=p.examType;
    if(p.type==='GUIDED_PRACTICE_RESULT'){
      row.guidedAttempts++;
      if(p.correct===true)row.guidedCorrect++;
      remediationMap.set(key,row);
      continue;
    }
    row.totalReviews++;
    if(p.correct===false){
      if(p.outcome==='BLANK'||p.blank===true)row.blankCount++;
      else row.wrongCount++;
      if(!row.lastDifficultyAt)row.lastDifficultyAt=log.date.toISOString();
      if(isRemediationReason(p.errorReason))row.reasonCounts[p.errorReason]=(row.reasonCounts[p.errorReason]||0)+1;
    }
    remediationMap.set(key,row);
  }
  const remediationPriorities=[...remediationMap.values()]
    .filter(x=>x.wrongCount+x.blankCount>0)
    .sort((a,b)=>(b.wrongCount+b.blankCount)-(a.wrongCount+a.blankCount)||b.lastDifficultyAt.localeCompare(a.lastDifficultyAt))
    .slice(0,5).map(x=>{
      const strongest=Object.entries(x.reasonCounts).sort((a,b)=>b[1]-a[1])[0];
      const code=strongest&&isRemediationReason(strongest[0])?strongest[0]:null;
      const reason=code?REMEDIATION_REASONS[code]:null;
      const band=levelAwareErrorRecovery({
        gradeLevel:student.gradeLevel,examType:x.examType,
        bankReason:x.blankCount>x.wrongCount?'BLANK':'WRONG'
      }).band;
      const advancedProgram=buildAdvancedRecoveryProgram({
        band,reason:code,examType:x.examType,academicTrack:student.academicTrack,
        subject:x.subject,topic:x.topic,bankReason:x.blankCount>x.wrongCount?'BLANK':'WRONG'
      });
      return {...x,advancedProgram,
        primaryReason:reason?.label||'Henüz sınıflandırılmadı',
        recommendedAction:reason?.instruction||(
          x.blankCount>x.wrongCount
           ?'Boş bırakma nedenini (bilgi, süre, yöntem, soru kökü veya kararsızlık) öğrenciyle belirle; kısa bir örnekten sonra yeni onaylı soruda kontrol et.'
           :'Öğrencinin çözüm adımlarını kontrol et, konuyu kısa çalıştır ve yeni onaylı soru ile ölç.'
        )};
    });

  // The print-optical first attempt is stored as DailyLog.kind (not type).
  // Keep these signals separate from general REVIEW_RESULT priorities.
  const [opticalLogs,printQueues]=await Promise.all([
    db.dailyLog.findMany({
      where:{studentId:id,date:{gte:new Date(Date.now()-90*86400000)},OR:[
        {legacyId:{startsWith:'PARAGRAF_OPTIK_FIRST:'+id+':'}},
        {legacyId:{startsWith:'PARAGRAF_INDEPENDENT_FOLLOWUP:'+id+':'}},
        {payload:{path:['type'],equals:'REVIEW_RESULT'}}
      ]},
      select:{date:true,payload:true},orderBy:{date:'desc'},take:1501
    }),
    db.reviewQueueItem.findMany({
      where:{studentId:id,questionId:{startsWith:'KEKS_PRINT_A3_V1_Q'}},
      select:{questionId:true,dueAt:true,status:true}
    })
  ]);
  const paragrafCoachEvidence={
    ...summarizeParagrafCoachEvidence(opticalLogs.slice(0,1500),printQueues),
    truncated:opticalLogs.length>1500
  };

  // Re-grade only the coach's student from immutable PracticeQuizAttempt rows.
  // Never trust a free-form DailyLog for correctness or coaching decisions.
  const recentAttempts=await db.practiceQuizAttempt.findMany({
    where:{studentId:id,createdAt:{gte:new Date(Date.now()-60*86400000)}},
    include:{quiz:{select:{questionIds:true}}},take:151,
    orderBy:{createdAt:'desc'}
  });
  const ids=[...new Set(recentAttempts.flatMap(a=>
    Array.isArray(a.quiz.questionIds)?a.quiz.questionIds.filter(
      (x):x is string=>typeof x==='string'&&x.length>0
    ):[]
  ))];
  const quizQuestions=ids.length?await db.questionBankItem.findMany({
    where:{id:{in:ids}},select:{
      id:true,subject:true,topic:true,sourceKind:true,correctAnswer:true
    }
  }):[];
  const allLevelWrongBlankEvidence=summarizeAllLevelQuizCoachEvidence(
    recentAttempts.slice(0,150),quizQuestions,id,
    {truncated:recentAttempts.length>150}
  );

  const resourceSummary={
    total:resources.length,
    review:resources.filter((x:any)=>x.efficiency?.status==='REVIEW'),
    watch:resources.filter((x:any)=>x.efficiency?.status==='WATCH'),
    normal:resources.filter((x:any)=>x.efficiency?.status==='NORMAL'),
    resources
  };

  return NextResponse.json({ok:true,student,capacity,mastery,subjects,goal,impact,timeline,examReport,examMap,alignment,indicators,remediationPriorities,paragrafCoachEvidence,allLevelWrongBlankEvidence,topicTransfer,resourceTracking:resourceSummary});
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
