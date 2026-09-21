import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildTrackPlans,detectEducationBand,scoreMotivationSignals } from '@/lib/taskEvaluation';
import { writeAudit } from '@/lib/audit';

const schema=z.object({action:z.literal('approve'),assignmentId:z.string()});

function dateOnlyUtc(v:string){
  const d=new Date(v);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d).split('-').map(Number);
  return new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
}
function obj(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};}

async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true,gradeLevel:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const educationBand=detectEducationBand(student.gradeLevel);
  const assignments=await db.preInterviewAssignment.findMany({
    where:{studentId:id,coachId:user.coachProfile.id},
    orderBy:{assignedAt:'desc'},
    include:{form:{include:{questions:{orderBy:{orderNo:'asc'}}}},attempt:true}
  });
  return NextResponse.json({ok:true,student,educationBand,assignments});
}

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true,gradeLevel:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const input=await readJson(req,schema);

  const assignment=await db.preInterviewAssignment.findFirst({
    where:{id:input.assignmentId,studentId:id,coachId:user.coachProfile.id},
    include:{attempt:true,form:{include:{questions:{orderBy:{orderNo:'asc'}}}}}
  });
  if(!assignment)return NextResponse.json({error:'Atama bulunamadı.'},{status:404});
  if(assignment.status==='APPROVED')return NextResponse.json({ok:true,alreadyApproved:true});
  if(assignment.status!=='ADMIN_APPROVED'||!assignment.attempt||assignment.attempt.reviewStatus!=='ADMIN_APPROVED'){
    return NextResponse.json({error:'Bu plan henüz yönetici tarafından onaylanıp koça gönderilmedi.'},{status:403});
  }

  const scores=assignment.attempt.scores as Record<string,number>;
  const attemptReport=obj(assignment.attempt.report);
  const assessmentId=typeof attemptReport.screeningAssessmentId==='string'?attemptReport.screeningAssessmentId:null;
  const assessment=assessmentId
    ?await db.assessment.findUnique({where:{id:assessmentId}})
    :await db.assessment.findFirst({where:{studentId:id},orderBy:{completedAt:'desc'}});
  const motivationSignals=scoreMotivationSignals(
    assignment.form.questions.map(q=>({id:q.id,motivationKey:q.motivationKey,reverse:q.reverse})),
    assignment.attempt.answers as Record<string,unknown>
  );
  const fallback=buildTrackPlans(
    assignment.attempt.academicTrack,
    scores,
    new Date(),
    assignment.form.educationBand as any,
    assessment?.scores,
    motivationSignals
  );
  const draft=obj(attemptReport.planDraft);
  const plans={
    annual:draft.annual||fallback.annual,
    monthly:draft.monthly||fallback.monthly,
    weekly:draft.weekly||fallback.weekly,
    daily:Array.isArray(draft.daily)?draft.daily:fallback.daily
  };

  await db.$transaction(async tx=>{
    await tx.studyPlan.createMany({data:[
      {studentId:id,title:'KEKS Onaylı · 1 Yıllık Plan',payload:{assignmentId:assignment.id,track:assignment.attempt!.academicTrack,...plans.annual} as any,active:true},
      {studentId:id,title:'KEKS Onaylı · Aylık Plan',payload:{assignmentId:assignment.id,track:assignment.attempt!.academicTrack,...plans.monthly} as any,active:true},
      {studentId:id,title:'KEKS Onaylı · Haftalık Plan',payload:{assignmentId:assignment.id,track:assignment.attempt!.academicTrack,...plans.weekly} as any,active:true},
      {studentId:id,title:'KEKS Onaylı · Günlük Plan',payload:{assignmentId:assignment.id,track:assignment.attempt!.academicTrack,days:plans.daily} as any,active:true}
    ]});

    for(const item of plans.daily.slice(0,28)){
      const taskDate=dateOnlyUtc(item.date);
      const periodEnd=new Date(taskDate);periodEnd.setUTCDate(periodEnd.getUTCDate()+1);
      await tx.coachingAction.create({data:{
        studentId:id,createdByUserId:user.id,
        title:item.title,
        description:item.method+' · Destek alanı: '+item.supportDimension,
        metricType:'QUESTIONS',targetValue:Number(item.questions)||0,currentValue:0,cadence:'DAILY',
        periodStart:taskDate,periodEnd,subject:item.subject||null,topic:null,taskDate,
        planSource:'KEKS_ADMIN_APPROVED'
      }});
    }

    await tx.preInterviewAttempt.update({where:{id:assignment.attempt!.id},data:{reviewStatus:'APPROVED',publishedAt:new Date()}});
    await tx.preInterviewAssignment.update({where:{id:assignment.id},data:{status:'APPROVED',approvedAt:new Date(),approvedByUserId:user.id}});
    await tx.studentReport.updateMany({
      where:{studentId:id,title:'KEKS Birleşik Değerlendirme ve Gelişim Raporu',createdAt:{gte:new Date(assignment.attempt!.completedAt.getTime()-30000)}},
      data:{visibleToStudent:true}
    });
    await tx.coachAlert.updateMany({where:{studentId:id,kind:'ADMIN_APPROVED_PLAN:'+assignment.attempt!.id,resolved:false},data:{resolved:true,resolvedAt:new Date()}});
    await tx.coachTask.updateMany({where:{studentId:id,sourceType:'ADMIN_APPROVED_PLAN',sourceId:assignment.attempt!.id,status:'OPEN'},data:{status:'DONE',completedAt:new Date()}});
    if(assessment){
      const ar=obj(assessment.report);
      await tx.assessment.update({where:{id:assessment.id},data:{report:{
        ...ar,
        workflowStatus:'COMPLETED',
        administration:{...(ar.administration||{}),coachActivatedAt:new Date().toISOString(),coachActivatedByUserId:user.id}
      } as any}});
    }
  });

  await writeAudit({
    actorUserId:user.id,
    action:'ADMIN_APPROVED_PLAN_ACTIVATED',
    entityType:'PreInterviewAssignment',
    entityId:assignment.id,
    summary:'Koç, yönetici onaylı yıllık/aylık/haftalık/günlük KEKS planını öğrenci için aktifleştirdi.',
    metadata:{studentId:id,attemptId:assignment.attempt.id}
  });

  return NextResponse.json({ok:true,approved:true,days:plans.daily.length});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
