import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { scoreInterview,buildInterviewReport,buildTrackPlans } from '@/lib/taskEvaluation';

const submitSchema=z.object({
  academicTrack:z.enum(['SAYISAL','ESIT_AGIRLIK','SOZEL']),
  answers:z.record(z.string(),z.unknown())
});

function dateOnlyUtc(v:string){
  const d=new Date(v);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d).split('-').map(Number);
  return new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
}

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const assessment=await db.assessment.findFirst({where:{studentId:user.student.id},orderBy:{completedAt:'desc'}});
  if(!assessment)return NextResponse.json({ok:true,locked:true,reason:'Önce KEKS eğilim taramasını tamamlamalısınız.'});
  const form=await db.preInterviewForm.findFirst({
    where:{active:true},
    orderBy:{createdAt:'desc'},
    include:{questions:{orderBy:{orderNo:'asc'}}}
  });
  const latest=await db.preInterviewAttempt.findFirst({
    where:{studentId:user.student.id},
    orderBy:{completedAt:'desc'}
  });
  return NextResponse.json({ok:true,locked:false,form,latest});
}

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const assessment=await db.assessment.findFirst({where:{studentId:user.student.id},orderBy:{completedAt:'desc'}});
  if(!assessment)return NextResponse.json({error:'Önce KEKS eğilim taramasını tamamlayın.'},{status:403});
  const input=submitSchema.parse(await req.json());
  const form=await db.preInterviewForm.findFirst({
    where:{active:true},
    orderBy:{createdAt:'desc'},
    include:{questions:{orderBy:{orderNo:'asc'}}}
  });
  if(!form)return NextResponse.json({error:'Aktif ön görüşme formu bulunmuyor.'},{status:404});

  for(const q of form.questions){
    if(q.required&&(input.answers[q.id]===undefined||input.answers[q.id]===null||input.answers[q.id]==='')){
      return NextResponse.json({error:'Tüm zorunlu soruları cevaplayın.'},{status:400});
    }
  }

  const scores=scoreInterview(form.questions.map(q=>({id:q.id,dimension:q.dimension,reverse:q.reverse})),input.answers);
  const report=buildInterviewReport(scores,input.academicTrack);
  const plans=buildTrackPlans(input.academicTrack,scores,new Date());

  const attempt=await db.preInterviewAttempt.create({data:{
    studentId:user.student.id,
    formId:form.id,
    academicTrack:input.academicTrack,
    answers:input.answers as any,
    scores:scores as any,
    report:report as any
  }});

  await db.student.update({where:{id:user.student.id},data:{academicTrack:input.academicTrack}});

  await db.studyPlan.createMany({data:[
    {studentId:user.student.id,title:'Ön Görüşme · Günlük Plan',payload:{track:input.academicTrack,days:plans.daily} as any,active:true},
    {studentId:user.student.id,title:'Ön Görüşme · Haftalık Plan',payload:plans.weekly as any,active:true},
    {studentId:user.student.id,title:'Ön Görüşme · Aylık Plan',payload:plans.monthly as any,active:true}
  ]});

  for(const item of plans.daily){
    const taskDate=dateOnlyUtc(item.date);
    const periodStart=taskDate;
    const periodEnd=new Date(taskDate);periodEnd.setUTCDate(periodEnd.getUTCDate()+1);
    await db.coachingAction.create({data:{
      studentId:user.student.id,
      title:item.title,
      description:item.method+' · Destek alanı: '+item.supportDimension,
      metricType:'QUESTIONS',
      targetValue:item.questions,
      currentValue:0,
      cadence:'DAILY',
      periodStart,
      periodEnd,
      subject:item.subject,
      topic:null,
      taskDate,
      planSource:'PRE_INTERVIEW'
    }});
  }

  const answerLines=form.questions.map(q=>'S'+q.orderNo+' — '+q.prompt+'\nCevap: '+String(input.answers[q.id]??'')).join('\n\n');
  const scoreLines=Object.entries(scores).map(([k,v])=>k+': '+v+'/5').join('\n');
  const reportText=[
    'Alan: '+input.academicTrack.replace('_',' '),
    '',
    'BOYUT PUANLARI',
    scoreLines,
    '',
    'ÖNCELİKLİ GELİŞİM ALANLARI',
    report.weakest.map(x=>x.dimension+' ('+x.score+'/5)').join(', '),
    '',
    'ÖNERİLER',
    report.recommendations.map((x,i)=>(i+1)+'. '+x).join('\n'),
    '',
    'SORU - CEVAP DÖKÜMÜ',
    answerLines
  ].join('\n');

  await db.studentReport.create({data:{
    studentId:user.student.id,
    title:'Ön Görüşme Değerlendirme Raporu',
    summary:'Alan: '+input.academicTrack.replace('_',' ')+' · Gelişim öncelikleri: '+report.weakest.map(x=>x.dimension).join(', '),
    content:reportText,
    createdByUserId:user.id,
    visibleToStudent:true,
    visibleToParent:false
  }});

  await db.coachAlert.create({data:{
    studentId:user.student.id,
    kind:'PRE_INTERVIEW:'+attempt.id,
    severity:'MEDIUM',
    title:'Ön görüşme tamamlandı',
    message:'Ön görüşme raporu, tüm soru-cevaplar ve alan bazlı günlük/haftalık/aylık plan hazırlandı.'
  }});

  return NextResponse.json({ok:true,attempt,report,plans});
}
