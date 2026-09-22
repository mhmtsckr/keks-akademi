import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withApiErrors } from '@/lib/apiGuard';
import { keksMonthlyProduct,productKeyFromReport } from '@/lib/monthlyProduct';
import { detectEducationBand } from '@/lib/taskEvaluation';
import { getScreeningForm } from '@/lib/screeningForms';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});

  const currentProduct=keksMonthlyProduct();
  const latest=await db.assessment.findFirst({
    where:{studentId:user.student.id},
    orderBy:{completedAt:'desc'},
    select:{id:true,completedAt:true,formVersion:true,report:true}
  });

  if(latest){
    const report=(latest.report||{}) as any;
    const workflow=String(report.workflowStatus||'');
    const latestProductKey=productKeyFromReport(report,latest.completedAt);
    const activeWorkflow=['ADMIN_REVIEW','SCREENING_RETAKE_REQUIRED','PRE_INTERVIEW_ASSIGNED','PLAN_ADMIN_REVIEW','PLAN_ADMIN_APPROVED'].includes(workflow);
    if(activeWorkflow||latestProductKey===currentProduct.key){
      return NextResponse.json({
        ok:true,
        status:'COMPLETED',
        product:report.product||keksMonthlyProduct(latest.completedAt),
        assessment:{id:latest.id,completedAt:latest.completedAt,formVersion:latest.formVersion},
        workflowStatus:workflow||'ADMIN_REVIEW'
      });
    }
  }

  const access=await db.testAccess.findFirst({
    where:{studentId:user.student.id,status:'READY'},
    orderBy:{createdAt:'asc'}
  });

  if(!access){
    return NextResponse.json({ok:true,status:'NO_ACCESS',product:currentProduct});
  }

  let acquiredAt=access.createdAt;
  if(access.source==='PAID'&&access.paymentId){
    const payment=await db.payment.findUnique({where:{id:access.paymentId},select:{createdAt:true}});
    if(payment?.createdAt)acquiredAt=payment.createdAt;
  }
  const product=keksMonthlyProduct(acquiredAt);
  const educationBand=detectEducationBand(user.student.gradeLevel);
  const form=getScreeningForm(educationBand);
  return NextResponse.json({
    ok:true,
    status:'READY',
    accessId:access.id,
    product,
    form:{
      title:form.title,
      version:form.version,
      educationBand:form.educationBand,
      disclaimer:form.disclaimer,
      instruction:form.instruction,
      scale:form.scale,
      questionCount:form.questions.length,
      questions:form.questions.map(q=>({
        id:q.id,orderNo:q.orderNo,prompt:q.prompt,kind:q.kind,dimension:q.dimension
      }))
    }
  });
}

export const GET=withApiErrors(GET__handler);
