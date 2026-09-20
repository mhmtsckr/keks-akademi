import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { scoreInterview,buildInterviewReport,buildTrackPlans } from '@/lib/taskEvaluation';

const submitSchema=z.object({
  academicTrack:z.enum(['GENERAL','SAYISAL','ESIT_AGIRLIK','SOZEL']),
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
  const assignment=await db.preInterviewAssignment.findFirst({
    where:{studentId:user.student.id,status:{in:['ASSIGNED','COMPLETED','APPROVED']},revokedAt:null},
    orderBy:{assignedAt:'desc'},
    include:{form:{include:{questions:{orderBy:{orderNo:'asc'}}}},attempt:true}
  });
  if(!assignment)return NextResponse.json({ok:true,locked:true,reason:'Koçunuz henüz ön görüşme formunu size açmadı.'});
  const latest=assignment.attempt||null;
  return NextResponse.json({ok:true,locked:false,form:assignment.form,assignment:{id:assignment.id,status:assignment.status},latest});
}

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const assessment=await db.assessment.findFirst({where:{studentId:user.student.id},orderBy:{completedAt:'desc'}});
  if(!assessment)return NextResponse.json({error:'Önce KEKS eğilim taramasını tamamlayın.'},{status:403});
  const input=submitSchema.parse(await req.json());
  const assignment=await db.preInterviewAssignment.findFirst({
    where:{studentId:user.student.id,status:'ASSIGNED',revokedAt:null},
    orderBy:{assignedAt:'desc'},
    include:{form:{include:{questions:{orderBy:{orderNo:'asc'}}}}}
  });
  if(!assignment)return NextResponse.json({error:'Koçunuz tarafından açık bir ön görüşme formu bulunmuyor.'},{status:403});
  const form=assignment.form;

  for(const q of form.questions){
    if(q.required&&(input.answers[q.id]===undefined||input.answers[q.id]===null||input.answers[q.id]==='')){
      return NextResponse.json({error:'Tüm zorunlu soruları cevaplayın.'},{status:400});
    }
  }

  const scores=scoreInterview(form.questions.map(q=>({id:q.id,dimension:q.dimension,reverse:q.reverse})),input.answers);
  const requiresTrack=['LISE_11_12','YETISKIN_MEZUN'].includes(form.educationBand);
  const academicTrack=requiresTrack?input.academicTrack:'GENERAL';
  if(requiresTrack&&academicTrack==='GENERAL')return NextResponse.json({error:'Hazırlık alanınızı seçin.'},{status:400});
  const report=buildInterviewReport(scores,academicTrack,assessment.scores,form.educationBand as any);
  const plans=buildTrackPlans(academicTrack,scores,new Date(),form.educationBand as any,assessment.scores);

  const attempt=await db.preInterviewAttempt.create({data:{
    studentId:user.student.id,
    formId:form.id,
    assignmentId:assignment.id,
    academicTrack,
    answers:input.answers as any,
    scores:scores as any,
    report:report as any,
    reviewStatus:'PENDING'
  }});
  await db.preInterviewAssignment.update({where:{id:assignment.id},data:{status:'COMPLETED',completedAt:new Date()}});

  await db.student.update({where:{id:user.student.id},data:{academicTrack}});

  // Plan taslağı bu aşamada yalnız koç incelemesi için hesaplanır.
  // Öğrenciye görev olarak aktarım koç onayından sonra yapılır.

  const answerLines=form.questions.map(q=>'S'+q.orderNo+' — '+q.prompt+'\nCevap: '+String(input.answers[q.id]??'')).join('\n\n');
  const scoreLines=Object.entries(scores).map(([k,v])=>k+': '+v+'/5').join('\n');
  const reportText=[
    'Program alanı: '+academicTrack.replace('_',' '),
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
    summary:'Program alanı: '+academicTrack.replace('_',' ')+' · Programlama öncelikleri: '+report.weakest.map(x=>x.dimension).join(', '),
    content:reportText,
    createdByUserId:user.id,
    visibleToStudent:false,
    visibleToParent:false
  }});

  await db.coachAlert.create({data:{
    studentId:user.student.id,
    kind:'PRE_INTERVIEW:'+attempt.id,
    severity:'MEDIUM',
    title:'Ön görüşme tamamlandı',
    message:'Ön görüşme tamamlandı. Tüm soru-cevaplar, değerlendirme ve alan bazlı plan taslağı koç onayı bekliyor.'
  }});

  return NextResponse.json({ok:true,attempt,report,plans,pendingCoachApproval:true});
}
