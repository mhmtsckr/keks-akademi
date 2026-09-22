import { readJson, withApiErrors } from '@/lib/apiGuard';
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
  const fourteenDaysAgo=new Date(now.getTime()-14*86400000);
  const [practice,previousPractice,alerts,actions,reviews,recentExams,lastSession,submissions,previousSubmissions,techniqueSessions,previousTechniqueSessions]=await Promise.all([
    db.practiceLog.findMany({where:{studentId,date:{gte:sevenDaysAgo}},orderBy:{date:'desc'},take:120}),
    db.practiceLog.findMany({where:{studentId,date:{gte:fourteenDaysAgo,lt:sevenDaysAgo}},orderBy:{date:'desc'},take:120}),
    db.coachAlert.findMany({where:{studentId,resolved:false},orderBy:{createdAt:'desc'},take:8}),
    db.coachingAction.findMany({where:{studentId,status:'ACTIVE'},orderBy:{periodEnd:'asc'},take:12}),
    db.reviewQueueItem.findMany({where:{studentId,status:{in:['DUE','PENDING']},dueAt:{lte:now}},orderBy:{dueAt:'asc'},take:20}),
    db.examResult.findMany({where:{studentId},orderBy:{createdAt:'desc'},take:2}),
    db.coachingSession.findFirst({where:{studentId,status:'COMPLETED'},orderBy:{startsAt:'desc'}}),
    db.taskSubmission.findMany({where:{studentId,submittedAt:{gte:sevenDaysAgo}},orderBy:{submittedAt:'desc'}}),
    db.taskSubmission.findMany({where:{studentId,submittedAt:{gte:fourteenDaysAgo,lt:sevenDaysAgo}},orderBy:{submittedAt:'desc'}}),
    db.techniquePracticeSession.findMany({where:{studentId,createdAt:{gte:sevenDaysAgo}},select:{activeSeconds:true}}),
    db.techniquePracticeSession.findMany({where:{studentId,createdAt:{gte:fourteenDaysAgo,lt:sevenDaysAgo}},select:{activeSeconds:true}})
  ]);
  function practiceSummary(rows:typeof practice){
    const subjectMap=new Map<string,{q:number;c:number;w:number;net:number;n:number}>();
    for(const p of rows){
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
    const totalQuestions=rows.reduce((n,p)=>n+p.total,0);
    const totalCorrect=rows.reduce((n,p)=>n+p.correct,0);
    return {subjects,totalQuestions,accuracy:totalQuestions?Math.round(totalCorrect/totalQuestions*100):0};
  }
  const currentPractice=practiceSummary(practice);
  const previousPracticeSummary=practiceSummary(previousPractice);
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
  const previousBySubject=new Map(previousPracticeSummary.subjects.map(x=>[x.subject,x]));
  const subjectChanges=currentPractice.subjects.map(x=>({
    subject:x.subject,
    current:x.accuracy,
    previous:previousBySubject.get(x.subject)?.accuracy??null,
    delta:previousBySubject.has(x.subject)?x.accuracy-(previousBySubject.get(x.subject)?.accuracy||0):null
  })).filter(x=>x.delta!=null).sort((a,b)=>(b.delta||0)-(a.delta||0));
  const developedArea=subjectChanges.find(x=>(x.delta||0)>0)||null;
  const regressedArea=[...subjectChanges].reverse().find(x=>(x.delta||0)<0)||null;
  const currentCompletion=submissions.length?Math.round(submissions.reduce((n,x)=>n+x.completionRate,0)/submissions.length):0;
  const previousCompletion=previousSubmissions.length?Math.round(previousSubmissions.reduce((n,x)=>n+x.completionRate,0)/previousSubmissions.length):0;
  const currentFocus=Math.round(techniqueSessions.reduce((n,x)=>n+(x.activeSeconds||0),0)/60);
  const previousFocus=Math.round(previousTechniqueSessions.reduce((n,x)=>n+(x.activeSeconds||0),0)/60);
  const examValue=(x:any)=>{const p:any=x?.payload||{};const n=Number(p.net??p.score);return Number.isFinite(n)?n:null};
  const latestExamValue=examValue(recentExams[0]);
  const previousExamValue=examValue(recentExams[1]);
  const examDelta=latestExamValue!=null&&previousExamValue!=null?Number((latestExamValue-previousExamValue).toFixed(2)):null;
  const agenda:string[]=[];
  if(alerts[0]) agenda.push('Uyarı: '+alerts[0].title);
  if(subjects[0]) agenda.push(subjects[0].subject+' doğruluğu %'+subjects[0].accuracy+'; hata nedenini görüş.');
  if(overdueActions[0]) agenda.push('Geciken aksiyon: '+overdueActions[0].title);
  if(reviews.length) agenda.push(reviews.length+' yanlış soru tekrarı bekliyor.');
  if(lastSession?.nextStep) agenda.push('Önceki seans sonraki adımı: '+lastSession.nextStep);
  if(regressedArea)agenda.push(regressedArea.subject+' doğruluğu önceki haftaya göre '+Math.abs(regressedArea.delta||0)+' puan geriledi.');
  if(developedArea)agenda.push(developedArea.subject+' doğruluğu önceki haftaya göre '+Math.abs(developedArea.delta||0)+' puan gelişti; sürdürülebilirliği konuş.');
  const talkTopics=agenda.slice(0,3);
  return {
    generatedAt:now.toISOString(),
    last7Days:{practiceEntries:practice.length,totalQuestions:currentPractice.totalQuestions},
    weakSubjects:subjects.slice(0,3),
    weeklyChange:{
      questions:{current:currentPractice.totalQuestions,previous:previousPracticeSummary.totalQuestions,delta:currentPractice.totalQuestions-previousPracticeSummary.totalQuestions},
      accuracy:{current:currentPractice.accuracy,previous:previousPracticeSummary.accuracy,delta:currentPractice.accuracy-previousPracticeSummary.accuracy},
      taskCompletion:{current:currentCompletion,previous:previousCompletion,delta:currentCompletion-previousCompletion},
      focusMinutes:{current:currentFocus,previous:previousFocus,delta:currentFocus-previousFocus},
      exam:{current:latestExamValue,previous:previousExamValue,delta:examDelta},
      developedArea,
      regressedArea
    },
    activeAlerts:alerts.map(x=>({severity:x.severity,title:x.title,message:x.message})),
    overdueActions:overdueActions.map(x=>({id:x.id,title:x.title,currentValue:x.currentValue,targetValue:x.targetValue,periodEnd:x.periodEnd})),
    dueReviews:reviews.length,
    latestExam:recentExams[0]?{examType:recentExams[0].examType,createdAt:recentExams[0].createdAt,payload:recentExams[0].payload}:null,
    previousSession:lastSession?{startsAt:lastSession.startsAt,outcome:lastSession.outcome,nextStep:lastSession.nextStep}:null,
    agenda,
    talkTopics
  };
}

async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  return NextResponse.json({ok:true,student,brief:await buildBrief(id)});
}

async function POST__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},select:{id:true,fullName:true}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const input=await readJson(req, postSchema);
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

export const GET = withApiErrors(GET__handler);
export const POST = withApiErrors(POST__handler);
