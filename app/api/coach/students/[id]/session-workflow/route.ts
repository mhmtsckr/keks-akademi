import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

const postSchema=z.discriminatedUnion('action',[
  z.object({action:z.literal('prepare'),sessionId:z.string()}),
  z.object({
    action:z.literal('complete'),
    sessionId:z.string(),
    outcome:z.string().min(2).max(5000),
    decisions:z.array(z.string().min(1).max(500)).max(20).default([]),
    nextStep:z.string().max(1000).optional(),
    followUpAt:z.string().optional(),
    createFollowUpTask:z.boolean().default(true)
  })
]);

async function buildBrief(studentId:string){
  const now=new Date();
  const sevenDaysAgo=new Date(now.getTime()-7*86400000);
  const [practice,alerts,actions,reviews,lastExam,lastSession]=await Promise.all([
    db.practiceLog.findMany({where:{studentId,date:{gte:sevenDaysAgo}},orderBy:{date:'desc'},take:80}),
    db.coachAlert.findMany({where:{studentId,resolved:false},orderBy:{createdAt:'desc'},take:8}),
    db.coachingAction.findMany({where:{studentId,status:'ACTIVE'},orderBy:{periodEnd:'asc'},take:12}),
    db.reviewQueueItem.findMany({where:{studentId,status:{in:['DUE','PENDING']},dueAt:{lte:now}},orderBy:{dueAt:'asc'},take:20}),
    db.examResult.findFirst({where:{studentId},orderBy:{createdAt:'desc'}}),
    db.coachingSession.findFirst({where:{studentId,status:'COMPLETED'},orderBy:{startsAt:'desc'}})
  ]);
  const subjectMap=new Map<string,{q:number;c:number;w:number;net:number;n:number}>();
  for(const p of practice){
    const x=subjectMap.get(p.subject)||{q:0,c:0,w:0,net:0,n:0};
    x.q+=p.total;x.c+=p.correct;x.w+=p.wrong;x.net+=p.net;x.n++;
    subjectMap.set(p.subject,x);
  }
  const subjects=[...subjectMap.entries()].map(([subject,x])=>({
    subject,
    accuracy:x.q?Math.round(x.c/x.q*100):0,
    avgNet:x.n?Number((x.net/x.n).toFixed(2)):0,
    questions:x.q
  })).sort((a,b)=>a.accuracy-b.accuracy);
  const overdueActions=actions.filter(x=>x.periodEnd<now);
  const agenda:string[]=[];
  if(alerts[0]) agenda.push('Uyarı: '+alerts[0].title);
  if(subjects[0]) agenda.push(subjects[0].subject+' doğruluğu %'+subjects[0].accuracy+'; hata nedenini görüş.');
  if(overdueActions[0]) agenda.push('Geciken aksiyon: '+overdueActions[0].title);
  if(reviews.length) agenda.push(reviews.length+' yanlış soru tekrarı bekliyor.');
  if(lastSession?.nextStep) agenda.push('Önceki seans sonraki adımı: '+lastSession.nextStep);
  return {
    generatedAt:now.toISOString(),
    last7Days:{practiceEntries:practice.length,totalQuestions:practice.reduce((n,p)=>n+p.total,0)},
    weakSubjects:subjects.slice(0,3),
    activeAlerts:alerts.map(x=>({severity:x.severity,title:x.title,message:x.message})),
    overdueActions:overdueActions.map(x=>({id:x.id,title:x.title,currentValue:x.currentValue,targetValue:x.targetValue,periodEnd:x.periodEnd})),
    dueReviews:reviews.length,
    latestExam:lastExam?{examType:lastExam.examType,createdAt:lastExam.createdAt,payload:lastExam.payload}:null,
    previousSession:lastSession?{startsAt:lastSession.startsAt,outcome:lastSession.outcome,nextStep:lastSession.nextStep}:null,
    agenda
  };
}

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  return NextResponse.json({ok:true,student,brief:await buildBrief(id)});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const input=postSchema.parse(await req.json());
  const session=await db.coachingSession.findFirst({where:{id:input.sessionId,studentId:id,coachId:user.coachProfile.id}});
  if(!session)return NextResponse.json({error:'Seans bulunamadı.'},{status:404});

  if(input.action==='prepare'){
    const brief=await buildBrief(id);
    const updated=await db.coachingSession.update({where:{id:session.id},data:{prepSummary:brief}});
    return NextResponse.json({ok:true,brief,session:updated});
  }

  const followUpAt=input.followUpAt?new Date(input.followUpAt):null;
  const updated=await db.coachingSession.update({where:{id:session.id},data:{
    status:'COMPLETED',
    completedAt:new Date(),
    outcome:input.outcome,
    decisions:input.decisions,
    nextStep:input.nextStep||null,
    followUpAt
  }});
  if(followUpAt&&input.createFollowUpTask){
    await db.coachTask.create({data:{
      coachId:user.coachProfile.id,
      studentId:id,
      title:input.nextStep||student.fullName+' seans takibi',
      description:'Koçluk seansı sonrası otomatik takip görevi.',
      priority:'MEDIUM',
      dueAt:followUpAt,
      sourceType:'SESSION',
      sourceId:session.id
    }});
  }
  return NextResponse.json({ok:true,session:updated});
}
