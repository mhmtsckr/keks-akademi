import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildTrackPlans,detectEducationBand } from '@/lib/taskEvaluation';

const schema=z.discriminatedUnion('action',[
  z.object({action:z.literal('assign')}),
  z.object({action:z.literal('approve'),assignmentId:z.string()}),
  z.object({action:z.literal('reopen'),assignmentId:z.string()}),
  z.object({action:z.literal('revoke'),assignmentId:z.string()})
]);

function dateOnlyUtc(v:string){
  const d=new Date(v);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d).split('-').map(Number);
  return new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true,gradeLevel:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const educationBand=detectEducationBand(student.gradeLevel);
  const [activeForm,assignments]=await Promise.all([
    db.preInterviewForm.findFirst({where:{active:true,educationBand},orderBy:{createdAt:'desc'},include:{questions:{orderBy:{orderNo:'asc'}}}}),
    db.preInterviewAssignment.findMany({
      where:{studentId:id,coachId:user.coachProfile.id},
      orderBy:{assignedAt:'desc'},
      include:{form:{include:{questions:{orderBy:{orderNo:'asc'}}}},attempt:true}
    })
  ]);
  return NextResponse.json({ok:true,student,educationBand,activeForm,assignments});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true,gradeLevel:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const input=schema.parse(await req.json());
  const educationBand=detectEducationBand(student.gradeLevel);

  if(input.action==='assign'){
    const form=await db.preInterviewForm.findFirst({where:{active:true,educationBand},orderBy:{createdAt:'desc'}});
    if(!form)return NextResponse.json({error:'Bu eğitim düzeyi için aktif ön görüşme formu bulunamadı.'},{status:400});
    await db.preInterviewAssignment.updateMany({
      where:{studentId:id,coachId:user.coachProfile.id,status:{in:['ASSIGNED','COMPLETED']},revokedAt:null},
      data:{status:'REVOKED',revokedAt:new Date()}
    });
    const assignment=await db.preInterviewAssignment.create({data:{
      studentId:id,formId:form.id,coachId:user.coachProfile.id,status:'ASSIGNED'
    }});
    return NextResponse.json({ok:true,assignment});
  }

  const assignment=await db.preInterviewAssignment.findFirst({
    where:{id:input.assignmentId,studentId:id,coachId:user.coachProfile.id},
    include:{attempt:true,form:true}
  });
  if(!assignment)return NextResponse.json({error:'Atama bulunamadı.'},{status:404});

  if(input.action==='revoke'){
    const row=await db.preInterviewAssignment.update({where:{id:assignment.id},data:{status:'REVOKED',revokedAt:new Date()}});
    return NextResponse.json({ok:true,assignment:row});
  }

  if(input.action==='reopen'){
    if(!assignment.attempt)return NextResponse.json({error:'Tamamlanmış ön görüşme yok.'},{status:400});
    await db.preInterviewAttempt.update({where:{id:assignment.attempt.id},data:{assignmentId:null,reviewStatus:'REVISION_REQUESTED'}});
    const row=await db.preInterviewAssignment.update({where:{id:assignment.id},data:{status:'ASSIGNED',completedAt:null,approvedAt:null,approvedByUserId:null}});
    return NextResponse.json({ok:true,assignment:row});
  }

  if(!assignment.attempt)return NextResponse.json({error:'Öğrenci henüz formu tamamlamadı.'},{status:400});
  if(assignment.status==='APPROVED')return NextResponse.json({ok:true,alreadyApproved:true});

  const scores=assignment.attempt.scores as Record<string,number>;
  const assessment=await db.assessment.findFirst({where:{studentId:id},orderBy:{completedAt:'desc'}});
  const plans=buildTrackPlans(
    assignment.attempt.academicTrack,
    scores,
    new Date(),
    assignment.form.educationBand as any,
    assessment?.scores
  );

  await db.$transaction(async tx=>{
    await tx.studyPlan.createMany({data:[
      {studentId:id,title:'Ön Görüşme · Günlük Plan',payload:{assignmentId:assignment.id,track:assignment.attempt!.academicTrack,days:plans.daily} as any,active:true},
      {studentId:id,title:'Ön Görüşme · Haftalık Plan',payload:{assignmentId:assignment.id,...plans.weekly} as any,active:true},
      {studentId:id,title:'Ön Görüşme · Aylık Plan',payload:{assignmentId:assignment.id,...plans.monthly} as any,active:true}
    ]});

    for(const item of plans.daily){
      const taskDate=dateOnlyUtc(item.date);
      const periodEnd=new Date(taskDate);periodEnd.setUTCDate(periodEnd.getUTCDate()+1);
      await tx.coachingAction.create({data:{
        studentId:id,createdByUserId:user.id,
        title:item.title,
        description:item.method+' · Destek alanı: '+item.supportDimension,
        metricType:'QUESTIONS',targetValue:item.questions,currentValue:0,cadence:'DAILY',
        periodStart:taskDate,periodEnd,subject:item.subject,topic:null,taskDate,
        planSource:'PRE_INTERVIEW'
      }});
    }

    await tx.preInterviewAttempt.update({where:{id:assignment.attempt!.id},data:{reviewStatus:'APPROVED',publishedAt:new Date()}});
    await tx.preInterviewAssignment.update({where:{id:assignment.id},data:{status:'APPROVED',approvedAt:new Date(),approvedByUserId:user.id}});
    await tx.studentReport.updateMany({
      where:{studentId:id,title:'Ön Görüşme Değerlendirme Raporu',createdAt:{gte:new Date(assignment.attempt!.completedAt.getTime()-30000)}},
      data:{visibleToStudent:true}
    });
  });

  return NextResponse.json({ok:true,approved:true,days:plans.daily.length});
}
