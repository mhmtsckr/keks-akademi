import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildReport, scoreAssessment } from '@/lib/scoring';
import { sendAssessmentReport } from '@/lib/mailer';
import { keksMonthlyProduct,productKeyFromReport } from '@/lib/monthlyProduct';
import { detectEducationBand } from '@/lib/taskEvaluation';
import { getScreeningForm } from '@/lib/screeningForms';
import { readJson, withApiErrors } from '@/lib/apiGuard';
import { writeAudit } from '@/lib/audit';
import { encryptPrivateCode, hashSecret, randomCode } from '@/lib/security';

const SCORING_VERSION='keks-scoring-v1';
const REPORT_VERSION='keks-report-v1';

const schema=z.object({
  formVersion:z.string().min(1),
  educationBand:z.string().min(1),
  answers:z.array(z.object({questionId:z.string().min(1),value:z.number().int().min(1).max(5)})).min(1).max(140)
});

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const body=await readJson(req,schema);
  const access=await db.testAccess.findFirst({
    where:{studentId:user.student.id,status:'READY'},
    orderBy:{createdAt:'asc'}
  });
  if(!access)return NextResponse.json({error:'Aktif KEKS test ürünü erişimi bulunmuyor. Aylık ürün için kod kullanın veya satın alın.'},{status:403});

  let acquiredAt=access.createdAt;
  if(access.source==='PAID'&&access.paymentId){
    const payment=await db.payment.findUnique({where:{id:access.paymentId},select:{createdAt:true}});
    if(payment?.createdAt)acquiredAt=payment.createdAt;
  }
  const product=keksMonthlyProduct(acquiredAt);
  const latestAssessment=await db.assessment.findFirst({
    where:{studentId:user.student.id},
    orderBy:{completedAt:'desc'},
    select:{completedAt:true,report:true}
  });
  if(latestAssessment&&productKeyFromReport(latestAssessment.report,latestAssessment.completedAt)===product.key){
    return NextResponse.json({error:'Bu aylık KEKS test ürünü daha önce tamamlandı. Aynı ürün ikinci kez çözülemez.',product},{status:409});
  }

  const educationBand=detectEducationBand(user.student.gradeLevel);
  const form=getScreeningForm(educationBand);
  if(body.formVersion!==form.version||body.educationBand!==educationBand){
    return NextResponse.json({error:'Tarama formu güncellendi. Sayfayı yenileyip yeniden deneyin.'},{status:409});
  }

  const answerMap=new Map(body.answers.map(a=>[a.questionId,a.value]));
  if(answerMap.size!==form.questions.length||body.answers.length!==form.questions.length){
    return NextResponse.json({error:'Tüm tarama maddeleri cevaplanmalıdır.'},{status:400});
  }
  for(const q of form.questions){
    if(!answerMap.has(q.id))return NextResponse.json({error:'Tüm tarama maddeleri cevaplanmalıdır.'},{status:400});
  }

  const scores=scoreAssessment(form.questions,body.answers);
  const baseReport=buildReport(scores,form.questions,body.answers);
  const studentMeta=await db.student.findUnique({
    where:{id:user.student.id},
    select:{coachId:true}
  });
  const preInterviewForm=await db.preInterviewForm.findFirst({
    where:{active:true,educationBand},
    orderBy:{createdAt:'desc'}
  })||await db.preInterviewForm.findFirst({
    where:{active:true,educationBand:'GENERAL'},
    orderBy:{createdAt:'desc'}
  });
  const canAutoAssign=Boolean(studentMeta?.coachId&&preInterviewForm);
  const submittedAt=new Date().toISOString();
  const coachAccessCode=randomCode('KOC');
  const coachAccessCodeExpiresAt=new Date(Date.now()+30*24*60*60*1000);
  const report={
    ...baseReport,
    educationBand,
    questionCount:form.questions.length,
    source:'KEKS_NATIVE',
    product:{
      ...product,
      acquiredAt:acquiredAt.toISOString(),
      accessId:access.id,
      source:access.source
    },
    workflowStatus:canAutoAssign?'PRE_INTERVIEW_ASSIGNED':'ADMIN_REVIEW',
    administration:{
      status:'PENDING',
      screeningReviewStatus:'PENDING_REVIEW',
      submittedAt,
      preInterviewAutoAssigned:canAutoAssign,
      coachAccessCodeHint:coachAccessCode.slice(-4),
      coachAccessCodeExpiresAt:coachAccessCodeExpiresAt.toISOString(),
      nextStep:canAutoAssign
        ?'Eğitim ve gelişim düzeyine uygun ön görüşme otomatik açıldı. Koç erişim kodunuzu koçunuza iletin.'
        :'Tarama yönetici incelemesine gönderildi. Koç erişim kodunuzu koçunuza iletin.'
    }
  };

  const result=await db.$transaction(async tx=>{
    const claimed=await tx.testAccess.updateMany({
      where:{id:access.id,studentId:user.student!.id,status:'READY'},
      data:{status:'USED',usedAt:new Date()}
    });
    if(claimed.count!==1)throw new Error('TEST_ACCESS_ALREADY_USED');

    const assessment=await tx.assessment.create({data:{
      studentId:user.student!.id,
      formVersion:form.version,
      scoringVersion:SCORING_VERSION,
      reportVersion:REPORT_VERSION,
      answers:body.answers as any,
      scores:scores as any,
      report:report as any
    }});

    await tx.coachAccessCode.updateMany({
      where:{studentId:user.student!.id,active:true},
      data:{active:false}
    });
    await tx.coachAccessCode.create({data:{
      studentId:user.student!.id,
      codeHash:await hashSecret(coachAccessCode),
      codeHint:coachAccessCode.slice(-4),
      codeCiphertext:encryptPrivateCode(coachAccessCode),
      expiresAt:coachAccessCodeExpiresAt,
      assessmentId:assessment.id
    }});

    let assignmentId:string|null=null;
    if(canAutoAssign&&preInterviewForm&&studentMeta?.coachId){
      await tx.preInterviewAssignment.updateMany({
        where:{studentId:user.student!.id,status:{in:['ASSIGNED','COMPLETED','ADMIN_APPROVED']},revokedAt:null},
        data:{status:'REVOKED',revokedAt:new Date()}
      });
      const assignment=await tx.preInterviewAssignment.create({data:{
        studentId:user.student!.id,
        formId:preInterviewForm.id,
        coachId:studentMeta.coachId,
        status:'ASSIGNED'
      }});
      assignmentId=assignment.id;
      await tx.assessment.update({
        where:{id:assessment.id},
        data:{report:{
          ...report,
          administration:{
            ...report.administration,
            preInterviewAssignmentId:assignment.id,
            preInterviewAutoAssignedAt:new Date().toISOString()
          }
        } as any}
      });
    }
    return {assessment,assignmentId};
  });
  const assessment=result.assessment;

  await writeAudit({
    actorUserId:user.id,
    action:'SCREENING_SUBMITTED',
    entityType:'Assessment',
    entityId:assessment.id,
    summary:result.assignmentId
      ?'KEKS eğilim taraması tamamlandı; ön görüşme eğitim düzeyine göre otomatik açıldı ve tarama yönetici incelemesine gönderildi.'
      :'KEKS eğilim taraması tamamlandı ve yönetici incelemesine gönderildi.',
    metadata:{studentId:user.student.id,educationBand,questionCount:form.questions.length,preInterviewAssignmentId:result.assignmentId,coachAccessCodeHint:coachAccessCode.slice(-4)}
  });

  try{
    await sendAssessmentReport({
      studentCode:user.student.studentCode,
      studentName:user.student.fullName,
      assessmentId:assessment.id,
      report
    });
    await db.assessment.update({where:{id:assessment.id},data:{emailedAt:new Date()}});
  }catch(error){
    console.error('SCREENING_ADMIN_EMAIL_FAILED',error);
  }

  return NextResponse.json({
    ok:true,
    assessmentId:assessment.id,
    pendingAdminApproval:true,
    preInterviewAutoAssigned:Boolean(result.assignmentId),
    workflowStatus:result.assignmentId?'PRE_INTERVIEW_ASSIGNED':'ADMIN_REVIEW',
    coachAccessCode,
    coachAccessCodeExpiresAt:coachAccessCodeExpiresAt.toISOString(),
    message:result.assignmentId
      ?'Tarama tamamlandı. Koç erişim kodunuz oluşturuldu. Kodu koçunuza iletiniz; ön görüşmeniz de otomatik açıldı.'
      :'Tarama tamamlandı. Koç erişim kodunuz oluşturuldu. Kodu koçunuza iletiniz.'
  });
}

export const POST=withApiErrors(POST__handler);
