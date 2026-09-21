import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildReport, scoreAssessment } from '@/lib/scoring';
import { sendAssessmentReport } from '@/lib/mailer';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';
import { detectEducationBand } from '@/lib/taskEvaluation';
import { getScreeningForm } from '@/lib/screeningForms';
import { readJson, withApiErrors } from '@/lib/apiGuard';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  formVersion:z.string().min(1),
  educationBand:z.string().min(1),
  answers:z.array(z.object({questionId:z.string().min(1),value:z.number().int().min(1).max(5)})).min(1).max(140)
});

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const body=await readJson(req,schema);
  const month=turkeyMonthWindow();
  const access=await db.testAccess.findFirst({
    where:{
      studentId:user.student.id,
      status:'READY',
      OR:[
        {source:{not:'ACADEMY_CODE'}},
        {source:'ACADEMY_CODE',createdAt:{gte:month.start,lt:month.end}}
      ]
    },
    orderBy:{createdAt:'asc'}
  });
  if(!access)return NextResponse.json({error:'Bu ay için aktif tarama erişimi bulunmuyor. Aylık KEKS Akademi kodunuzu kullanın.'},{status:403});

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
  const report={
    ...baseReport,
    educationBand,
    questionCount:form.questions.length,
    source:'KEKS_NATIVE',
    workflowStatus:'ADMIN_REVIEW',
    administration:{
      status:'PENDING',
      submittedAt:new Date().toISOString(),
      nextStep:'Yönetici ayrıntılı değerlendirme ve gelişim raporunu inceleyip onayladığında ön görüşme açılır.'
    }
  };

  const assessment=await db.$transaction(async tx=>{
    const claimed=await tx.testAccess.updateMany({
      where:{id:access.id,studentId:user.student!.id,status:'READY'},
      data:{status:'USED',usedAt:new Date()}
    });
    if(claimed.count!==1)throw new Error('TEST_ACCESS_ALREADY_USED');
    return tx.assessment.create({data:{
      studentId:user.student!.id,
      formVersion:form.version,
      answers:body.answers as any,
      scores:scores as any,
      report:report as any
    }});
  });

  await writeAudit({
    actorUserId:user.id,
    action:'SCREENING_SUBMITTED',
    entityType:'Assessment',
    entityId:assessment.id,
    summary:'KEKS eğilim taraması tamamlandı ve yönetici incelemesine gönderildi.',
    metadata:{studentId:user.student.id,educationBand,questionCount:form.questions.length}
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
    workflowStatus:'ADMIN_REVIEW',
    message:'Tarama tamamlandı. Ayrıntılı değerlendirme ve gelişim raporu yönetici onayına gönderildi.'
  });
}

export const POST=withApiErrors(POST__handler);
