import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { scoreInterview,scoreMotivationSignals,buildInterviewReport,buildTrackPlans } from '@/lib/taskEvaluation';
import { writeAudit } from '@/lib/audit';

const submitSchema=z.object({
  academicTrack:z.enum(['GENERAL','SAYISAL','ESIT_AGIRLIK','SOZEL']),
  answers:z.record(z.string(),z.unknown())
});

function reportObject(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};}

function combineProgramScores(interviewScores:Record<string,number>,habitScores:unknown){
  const habits=reportObject(habitScores);
  const map:Record<string,string[]>={
    'Başlama ve Süreklilik':['Başlama','Görev Tamamlama'],
    'Görev Yapısı ve Planlama':['Planlama','Öz İzleme'],
    'Motivasyon ve Pekiştirme':['Görev Tamamlama','Öz İzleme'],
    'Odak ve Çalışma Ortamı':['Odak'],
    'Aktif Hatırlama ve Tekrar':['Aktif Hatırlama','Aralıklı Tekrar'],
    'Soru Çözme ve Hata Analizi':['Soru Uygulama','Hata Analizi'],
    'Sınav ve Zaman Yönetimi':['Başlama','Odak','Görev Tamamlama'],
    'Koçluk Bağımsızlığı':['Yardım İsteme','Öz İzleme']
  };
  const out={...interviewScores};
  for(const [dimension,keys] of Object.entries(map)){
    const values=keys.map(k=>Number(habits[k])).filter(Number.isFinite);
    if(!values.length)continue;
    const habitAverage=values.reduce((a,b)=>a+b,0)/values.length;
    const interview=Number(interviewScores[dimension]);
    out[dimension]=Number((Number.isFinite(interview)?interview*0.65+habitAverage*0.35:habitAverage).toFixed(2));
  }
  return out;
}

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const assessment=await db.assessment.findFirst({where:{studentId:user.student.id},orderBy:{completedAt:'desc'}});
  if(!assessment)return NextResponse.json({ok:true,locked:true,reason:'Önce KEKS eğilim taramasını tamamlamalısınız.'});
  const workflow=reportObject(assessment.report).workflowStatus;
  if(workflow==='ADMIN_REVIEW')return NextResponse.json({ok:true,locked:true,reason:'Eğilim taraması ayrıntılı değerlendirme ve gelişim raporu yönetici incelemesinde. Yönetici onayından sonra ön görüşme otomatik açılacak.'});
  if(workflow==='SCREENING_RETAKE_REQUIRED')return NextResponse.json({ok:true,locked:true,reason:'Yönetici eğilim taramasının yeniden çözülmesini istedi. Önce yeni taramayı tamamlayın.'});

  const assignment=await db.preInterviewAssignment.findFirst({
    where:{studentId:user.student.id,status:{in:['ASSIGNED','COMPLETED','ADMIN_APPROVED','APPROVED']},revokedAt:null},
    orderBy:{assignedAt:'desc'},
    include:{form:{include:{questions:{orderBy:{orderNo:'asc'}}}},attempt:true}
  });
  if(!assignment)return NextResponse.json({ok:true,locked:true,reason:'Yönetici onayından sonra ön görüşme formunuz burada açılacak.'});
  return NextResponse.json({
    ok:true,
    locked:false,
    form:assignment.form,
    assignment:{id:assignment.id,status:assignment.status},
    latest:assignment.attempt||null,
    workflowStatus:workflow
  });
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const assessment=await db.assessment.findFirst({where:{studentId:user.student.id},orderBy:{completedAt:'desc'}});
  if(!assessment)return NextResponse.json({error:'Önce KEKS eğilim taramasını tamamlayın.'},{status:403});
  const assessmentReport=reportObject(assessment.report);
  if(assessmentReport.workflowStatus!=='PRE_INTERVIEW_ASSIGNED'){
    return NextResponse.json({error:'Ön görüşme henüz yönetici tarafından açılmadı veya bu aşama tamamlandı.'},{status:403});
  }

  const input=await readJson(req,submitSchema);
  const assignment=await db.preInterviewAssignment.findFirst({
    where:{studentId:user.student.id,status:'ASSIGNED',revokedAt:null},
    orderBy:{assignedAt:'desc'},
    include:{form:{include:{questions:{orderBy:{orderNo:'asc'}}}}}
  });
  if(!assignment)return NextResponse.json({error:'Yönetici tarafından açık bir ön görüşme formu bulunmuyor.'},{status:403});
  const form=assignment.form;

  for(const q of form.questions){
    if(q.required&&(input.answers[q.id]===undefined||input.answers[q.id]===null||input.answers[q.id]==='')){
      return NextResponse.json({error:'Tüm zorunlu soruları cevaplayın.'},{status:400});
    }
  }

  const interviewScores=scoreInterview(form.questions.map(q=>({id:q.id,dimension:q.dimension,reverse:q.reverse})),input.answers);
  const screeningHabitScores=reportObject(assessmentReport.habitScores);
  const scores=combineProgramScores(interviewScores,screeningHabitScores);
  const motivationSignals=scoreMotivationSignals(form.questions.map(q=>({id:q.id,motivationKey:q.motivationKey,reverse:q.reverse})),input.answers);
  const requiresTrack=['LISE_11_12','YETISKIN_MEZUN'].includes(form.educationBand);
  const academicTrack=requiresTrack?input.academicTrack:'GENERAL';
  if(requiresTrack&&academicTrack==='GENERAL')return NextResponse.json({error:'Hazırlık alanınızı seçin.'},{status:400});

  const interviewReport=buildInterviewReport(scores,academicTrack,assessment.scores,form.educationBand as any,motivationSignals);
  const plans=buildTrackPlans(academicTrack,scores,new Date(),form.educationBand as any,assessment.scores,motivationSignals);
  const combinedReport={
    ...interviewReport,
    screeningAssessmentId:assessment.id,
    screeningSummary:{
      leadingDimensions:assessmentReport.leadingDimensions||[],
      dominance:assessmentReport.dominance||null,
      developmentFocus:assessmentReport.developmentFocus||[],
      habitScores:assessmentReport.habitScores||{},
      habitDevelopment:assessmentReport.habitDevelopment||[],
      developmentSummary:assessmentReport.developmentSummary||null
    },
    rawInterviewScores:interviewScores,
    combinedProgramScores:scores,
    planDraft:{annual:plans.annual,monthly:plans.monthly,weekly:plans.weekly,daily:plans.daily},
    workflowStatus:'ADMIN_REVIEW'
  };

  const answerLines=form.questions.map(q=>'S'+q.orderNo+' — '+q.prompt+'\nCevap: '+String(input.answers[q.id]??'')).join('\n\n');
  const scoreLines=Object.entries(scores).map(([k,v])=>k+': '+v+'/5').join('\n');
  const reportText=[
    'KEKS BİRLEŞİK DEĞERLENDİRME VE GELİŞİM RAPORU',
    'Program alanı: '+academicTrack.replaceAll('_',' '),
    '',
    'BİRLEŞİK PROGRAMLAMA PUANLARI',
    scoreLines,
    '',
    'EĞİLİM TARAMASI ÇALIŞMA ALIŞKANLIKLARI',
    Object.entries(screeningHabitScores).map(([k,v])=>k+': '+v+'/5').join('\n'),
    '',
    'ÖNCELİKLİ GELİŞİM ALANLARI',
    interviewReport.weakest.map(x=>x.dimension+' ('+x.score+'/5)').join(', '),
    '',
    'PROGRAMLAMA ÖNERİLERİ',
    interviewReport.recommendations.map((x,i)=>(i+1)+'. '+x).join('\n'),
    '',
    '1 YILLIK PLAN',
    plans.annual.phases.map((x:any)=>x.phase+'. '+x.name+' · Aylar '+x.months.join('-')).join('\n'),
    '',
    'AYLIK PLAN',
    plans.monthly.weeks.join('\n'),
    '',
    'SORU - CEVAP DÖKÜMÜ',
    answerLines
  ].join('\n');

  const attempt=await db.$transaction(async tx=>{
    const created=await tx.preInterviewAttempt.create({data:{
      studentId:user.student!.id,
      formId:form.id,
      assignmentId:assignment.id,
      academicTrack,
      answers:input.answers as any,
      scores:scores as any,
      report:combinedReport as any,
      reviewStatus:'ADMIN_REVIEW'
    }});
    await tx.preInterviewAssignment.update({where:{id:assignment.id},data:{status:'COMPLETED',completedAt:new Date()}});
    await tx.student.update({where:{id:user.student!.id},data:{academicTrack}});
    await tx.assessment.update({where:{id:assessment.id},data:{report:{
      ...assessmentReport,
      workflowStatus:'PLAN_ADMIN_REVIEW',
      preInterviewAttemptId:created.id,
      administration:{
        ...(assessmentReport.administration||{}),
        preInterviewCompletedAt:new Date().toISOString(),
        planStatus:'PENDING'
      }
    } as any}});
    await tx.studentReport.create({data:{
      studentId:user.student!.id,
      title:'KEKS Birleşik Değerlendirme ve Gelişim Raporu',
      summary:'Yönetici onayı bekliyor · Program alanı: '+academicTrack.replaceAll('_',' ')+' · Öncelikler: '+interviewReport.weakest.map(x=>x.dimension).join(', '),
      content:reportText,
      createdByUserId:user.id,
      visibleToStudent:false,
      visibleToParent:false
    }});
    return created;
  });

  await writeAudit({
    actorUserId:user.id,
    action:'PRE_INTERVIEW_SUBMITTED',
    entityType:'PreInterviewAttempt',
    entityId:attempt.id,
    summary:'Ön görüşme tamamlandı; yıllık/aylık/haftalık/günlük plan taslağı yönetici onayına gönderildi.',
    metadata:{studentId:user.student.id,assessmentId:assessment.id}
  });

  return NextResponse.json({
    ok:true,
    attemptId:attempt.id,
    report:combinedReport,
    planDraft:combinedReport.planDraft,
    pendingAdminApproval:true,
    message:'Ön görüşme tamamlandı. Birleşik değerlendirme ve çalışma planınız yönetici onayına gönderildi.'
  });
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
