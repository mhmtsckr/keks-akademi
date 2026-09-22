import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { detectEducationBand,type EducationBand } from '@/lib/taskEvaluation';
import { getScreeningForm,SCREENING_FORM_LABELS } from '@/lib/screeningForms';
import { writeAudit } from '@/lib/audit';

const schema=z.discriminatedUnion('action',[
  z.object({action:z.literal('approve_screening'),assessmentId:z.string()}),
  z.object({action:z.literal('retake_screening'),assessmentId:z.string()}),
  z.object({action:z.literal('approve_plan'),attemptId:z.string()}),
  z.object({action:z.literal('return_plan'),attemptId:z.string()})
]);

function obj(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};}

async function GET__handler(){
  await requireRole(['ADMIN']);
  const bands:EducationBand[]=['ILKOKUL_1_2','ILKOKUL_3_4','ORTAOKUL_5_6','ORTAOKUL_7_8','LISE_9_10','LISE_11_12','YETISKIN_MEZUN'];
  const forms=bands.map(band=>{
    const form=getScreeningForm(band);
    return {
      educationBand:band,
      label:SCREENING_FORM_LABELS[band],
      title:form.title,
      version:form.version,
      disclaimer:form.disclaimer,
      instruction:form.instruction,
      scale:form.scale,
      questionCount:form.questions.length,
      questions:form.questions.map(q=>({
        id:q.id,
        orderNo:q.orderNo,
        prompt:q.prompt,
        dimension:q.dimension,
        kind:q.kind
      }))
    };
  });
  const [assessments,attempts,preInterviewForms]=await Promise.all([
    db.assessment.findMany({
      orderBy:{completedAt:'desc'},take:100,
      include:{student:{select:{id:true,fullName:true,studentCode:true,gradeLevel:true,coachId:true,coach:{select:{user:{select:{name:true,email:true}}}}}}}
    }),
    db.preInterviewAttempt.findMany({
      where:{reviewStatus:'ADMIN_REVIEW'},
      orderBy:{completedAt:'desc'},take:100,
      include:{
        student:{select:{id:true,fullName:true,studentCode:true,gradeLevel:true,coachId:true,coach:{select:{user:{select:{name:true,email:true}}}}}},
        form:{include:{questions:{orderBy:{orderNo:'asc'}}}},
        assignment:true
      }
    }),
    db.preInterviewForm.findMany({
      where:{active:true},
      orderBy:[{educationBand:'asc'},{createdAt:'desc'}],
      include:{questions:{orderBy:{orderNo:'asc'}}}
    })
  ]);

  const screenings=assessments.filter(a=>{
    const report=obj(a.report);
    const administration=obj(report.administration);
    return report.workflowStatus==='ADMIN_REVIEW'||administration.screeningReviewStatus==='PENDING_REVIEW';
  }).map(a=>{
    const band=detectEducationBand(a.student.gradeLevel);
    const form=getScreeningForm(band);
    return {
      id:a.id,completedAt:a.completedAt,formVersion:a.formVersion,scores:a.scores,answers:a.answers,report:a.report,student:a.student,
      form:{
        educationBand:band,
        label:SCREENING_FORM_LABELS[band],
        title:form.title,
        instruction:form.instruction,
        scale:form.scale,
        questionCount:form.questions.length,
        questions:form.questions.map(q=>({
          id:q.id,
          orderNo:q.orderNo,
          prompt:q.prompt,
          dimension:q.dimension,
          kind:q.kind
        }))
      }
    };
  });
  const plans=attempts.map(a=>({
    id:a.id,completedAt:a.completedAt,academicTrack:a.academicTrack,scores:a.scores,answers:a.answers,report:a.report,
    student:a.student,form:a.form,assignment:a.assignment
  }));
  const openEndedForms=preInterviewForms.map(form=>({
    id:form.id,title:form.title,version:form.version,educationBand:form.educationBand,
    questionCount:form.questions.length,
    questions:form.questions.map(q=>({id:q.id,orderNo:q.orderNo,dimension:q.dimension,prompt:q.prompt,responseType:q.responseType}))
  }));
  return NextResponse.json({ok:true,forms,preInterviewForms:openEndedForms,screenings,plans,counts:{screenings:screenings.length,plans:plans.length}});
}

async function POST__handler(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);

  if(input.action==='approve_screening'||input.action==='retake_screening'){
    const assessment=await db.assessment.findUnique({
      where:{id:input.assessmentId},
      include:{student:{select:{id:true,fullName:true,studentCode:true,gradeLevel:true,coachId:true}}}
    });
    if(!assessment)return NextResponse.json({error:'Tarama kaydı bulunamadı.'},{status:404});
    const report=obj(assessment.report);
    const administration=obj(report.administration);
    const screeningPending=report.workflowStatus==='ADMIN_REVIEW'||administration.screeningReviewStatus==='PENDING_REVIEW';
    if(!screeningPending)return NextResponse.json({error:'Bu tarama artık yönetici incelemesi beklemiyor.'},{status:409});

    if(input.action==='retake_screening'){
      await db.$transaction(async tx=>{
        await tx.preInterviewAssignment.updateMany({
          where:{studentId:assessment.studentId,status:{in:['ASSIGNED','COMPLETED','ADMIN_APPROVED']},revokedAt:null},
          data:{status:'REVOKED',revokedAt:new Date()}
        });
        const ready=await tx.testAccess.findFirst({where:{studentId:assessment.studentId,status:'READY'}});
        if(!ready)await tx.testAccess.create({data:{studentId:assessment.studentId,source:'ADMIN_GRANT',status:'READY'}});
        await tx.assessment.update({where:{id:assessment.id},data:{report:{
          ...report,
          workflowStatus:'SCREENING_RETAKE_REQUIRED',
          administration:{...(report.administration||{}),status:'RETAKE_REQUESTED',reviewedAt:new Date().toISOString(),reviewedByUserId:user.id}
        } as any}});
      });
      await writeAudit({actorUserId:user.id,action:'SCREENING_RETAKE_REQUESTED',entityType:'Assessment',entityId:assessment.id,summary:'Yönetici KEKS eğilim taramasının yeniden çözülmesini istedi.',metadata:{studentId:assessment.studentId}});
      return NextResponse.json({ok:true,status:'SCREENING_RETAKE_REQUIRED'});
    }

    if(!assessment.student.coachId)return NextResponse.json({error:'Öğrenciye atanmış koç bulunmuyor.'},{status:400});
    let assignment=await db.preInterviewAssignment.findFirst({
      where:{studentId:assessment.studentId,status:{in:['ASSIGNED','COMPLETED','ADMIN_APPROVED','APPROVED']},revokedAt:null},
      orderBy:{assignedAt:'desc'}
    });

    if(!assignment){
      const educationBand=detectEducationBand(assessment.student.gradeLevel);
      const form=await db.preInterviewForm.findFirst({where:{active:true,educationBand},orderBy:{createdAt:'desc'}})
        ||await db.preInterviewForm.findFirst({where:{active:true,educationBand:'GENERAL'},orderBy:{createdAt:'desc'}});
      if(!form)return NextResponse.json({error:'Bu öğrenci için aktif ön görüşme formu bulunamadı.'},{status:400});
      assignment=await db.preInterviewAssignment.create({data:{
        studentId:assessment.studentId,
        formId:form.id,
        coachId:assessment.student.coachId,
        status:'ASSIGNED'
      }});
    }

    await db.assessment.update({where:{id:assessment.id},data:{report:{
      ...report,
      workflowStatus:report.workflowStatus==='ADMIN_REVIEW'?'PRE_INTERVIEW_ASSIGNED':report.workflowStatus,
      administration:{
        ...administration,
        status:'SCREENING_APPROVED',
        screeningReviewStatus:'APPROVED',
        reviewedAt:new Date().toISOString(),
        reviewedByUserId:user.id,
        preInterviewAssignmentId:assignment.id
      }
    } as any}});
    await writeAudit({actorUserId:user.id,action:'SCREENING_APPROVED',entityType:'Assessment',entityId:assessment.id,summary:'Yönetici eğilim taraması incelemesini onayladı. Açık uçlu ön görüşme otomatik atama üzerinden devam ediyor.',metadata:{studentId:assessment.studentId,assignmentId:assignment.id}});
    return NextResponse.json({ok:true,status:'PRE_INTERVIEW_ASSIGNED',assignmentId:assignment.id});
  }

  const attempt=await db.preInterviewAttempt.findUnique({
    where:{id:input.attemptId},
    include:{assignment:true,student:{select:{id:true,fullName:true,coachId:true}}}
  });
  if(!attempt||!attempt.assignment)return NextResponse.json({error:'Ön görüşme / atama kaydı bulunamadı.'},{status:404});
  const attemptReport=obj(attempt.report);
  const assessmentId=typeof attemptReport.screeningAssessmentId==='string'?attemptReport.screeningAssessmentId:null;
  const assessment=assessmentId
    ?await db.assessment.findUnique({where:{id:assessmentId}})
    :await db.assessment.findFirst({where:{studentId:attempt.studentId},orderBy:{completedAt:'desc'}});
  if(!assessment)return NextResponse.json({error:'Bağlı eğilim taraması bulunamadı.'},{status:404});
  const screeningReport=obj(assessment.report);

  if(input.action==='return_plan'){
    if(attempt.reviewStatus!=='ADMIN_REVIEW')return NextResponse.json({error:'Bu plan yönetici incelemesinde değil.'},{status:409});
    await db.$transaction([
      db.preInterviewAttempt.update({where:{id:attempt.id},data:{assignmentId:null,reviewStatus:'REVISION_REQUESTED'}}),
      db.preInterviewAssignment.update({where:{id:attempt.assignment.id},data:{status:'ASSIGNED',completedAt:null,approvedAt:null,approvedByUserId:null}}),
      db.assessment.update({where:{id:assessment.id},data:{report:{
        ...screeningReport,
        workflowStatus:'PRE_INTERVIEW_ASSIGNED',
        administration:{...(screeningReport.administration||{}),planStatus:'REVISION_REQUESTED',planReviewedAt:new Date().toISOString(),planReviewedByUserId:user.id}
      } as any}})
    ]);
    await writeAudit({actorUserId:user.id,action:'PLAN_REVISION_REQUESTED',entityType:'PreInterviewAttempt',entityId:attempt.id,summary:'Yönetici ön görüşme ve çalışma planı taslağını yeniden doldurma/düzenleme için öğrenciye döndürdü.',metadata:{studentId:attempt.studentId}});
    return NextResponse.json({ok:true,status:'REVISION_REQUESTED'});
  }

  if(attempt.reviewStatus!=='ADMIN_REVIEW'||attempt.assignment.status!=='COMPLETED')return NextResponse.json({error:'Bu plan yönetici onayı beklemiyor.'},{status:409});
  if(!attempt.student.coachId)return NextResponse.json({error:'Öğrenciye atanmış koç bulunmuyor.'},{status:400});

  await db.$transaction(async tx=>{
    await tx.preInterviewAttempt.update({where:{id:attempt.id},data:{reviewStatus:'ADMIN_APPROVED'}});
    await tx.preInterviewAssignment.update({where:{id:attempt.assignment!.id},data:{status:'ADMIN_APPROVED',approvedAt:new Date(),approvedByUserId:user.id}});
    await tx.assessment.update({where:{id:assessment.id},data:{report:{
      ...screeningReport,
      workflowStatus:'PLAN_ADMIN_APPROVED',
      administration:{
        ...(screeningReport.administration||{}),
        status:'APPROVED',
        screeningReviewStatus:'APPROVED',
        planStatus:'APPROVED',
        reviewedAt:(screeningReport.administration as any)?.reviewedAt||new Date().toISOString(),
        reviewedByUserId:(screeningReport.administration as any)?.reviewedByUserId||user.id,
        planReviewedAt:new Date().toISOString(),
        planReviewedByUserId:user.id,
        approvedAttemptId:attempt.id
      }
    } as any}});
    await tx.coachAlert.create({data:{
      studentId:attempt.studentId,
      kind:'ADMIN_APPROVED_PLAN:'+attempt.id,
      severity:'MEDIUM',
      title:'Yönetici onaylı KEKS planı hazır',
      message:'Eğilim taraması ve ön görüşme birlikte değerlendirildi. Yönetici 1 yıllık, aylık, haftalık ve günlük plan taslağını onayladı. Öğrenciye aktifleştirmek için inceleyin.'
    }});
    await tx.coachTask.create({data:{
      coachId:attempt.student.coachId!,
      studentId:attempt.studentId,
      title:'Yönetici onaylı KEKS planını aktifleştir',
      description:'Eğilim taraması + ön görüşme sonucunda hazırlanan 1 yıllık, aylık, haftalık ve günlük plan yönetici tarafından onaylandı.',
      priority:'HIGH',
      status:'OPEN',
      sourceType:'ADMIN_APPROVED_PLAN',
      sourceId:attempt.id
    }});
  });

  await writeAudit({actorUserId:user.id,action:'PLAN_ADMIN_APPROVED',entityType:'PreInterviewAttempt',entityId:attempt.id,summary:'Yönetici birleşik değerlendirme ve çalışma planını onaylayarak koça gönderdi.',metadata:{studentId:attempt.studentId,coachId:attempt.student.coachId,assessmentId:assessment.id}});
  return NextResponse.json({ok:true,status:'PLAN_ADMIN_APPROVED'});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
