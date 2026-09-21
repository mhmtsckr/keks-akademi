import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withApiErrors } from '@/lib/apiGuard';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';
import { detectEducationBand } from '@/lib/taskEvaluation';
import { getScreeningForm } from '@/lib/screeningForms';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});

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

  if(!access){
    const latest=await db.assessment.findFirst({
      where:{studentId:user.student.id},
      orderBy:{completedAt:'desc'},
      select:{id:true,completedAt:true,formVersion:true,report:true}
    });
    if(latest){
      const report=(latest.report||{}) as any;
      const workflow=String(report.workflowStatus||'');
      const inCurrentMonth=latest.completedAt>=month.start&&latest.completedAt<month.end;
      const activeWorkflow=['ADMIN_REVIEW','SCREENING_RETAKE_REQUIRED','PRE_INTERVIEW_ASSIGNED','PLAN_ADMIN_REVIEW','PLAN_ADMIN_APPROVED'].includes(workflow);
      if(activeWorkflow||inCurrentMonth){
        return NextResponse.json({
          ok:true,
          status:'COMPLETED',
          assessment:{id:latest.id,completedAt:latest.completedAt,formVersion:latest.formVersion},
          workflowStatus:workflow||'ADMIN_REVIEW'
        });
      }
    }
    return NextResponse.json({ok:true,status:'NO_ACCESS'});
  }

  const educationBand=detectEducationBand(user.student.gradeLevel);
  const form=getScreeningForm(educationBand);
  return NextResponse.json({
    ok:true,
    status:'READY',
    accessId:access.id,
    form:{
      title:form.title,
      version:form.version,
      educationBand:form.educationBand,
      disclaimer:form.disclaimer,
      questionCount:form.questions.length,
      questions:form.questions.map(q=>({
        id:q.id,orderNo:q.orderNo,prompt:q.prompt,kind:q.kind,dimension:q.kind==='HABIT'?'Çalışma alışkanlığı':'Eğilim maddesi'
      }))
    }
  });
}

export const GET=withApiErrors(GET__handler);
