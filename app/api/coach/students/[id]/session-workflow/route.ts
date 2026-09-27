import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildExamNetChange,previousSessionDecisions,summarizeSessionActions,summarizeSessionReviews } from '@/lib/coachSessionPrep';
import { classifyCoachDecision } from '@/lib/coachInterventionImpact';

const postSchema=z.discriminatedUnion('action',[
  z.object({action:z.literal('prepare'),sessionId:z.string()}),
  z.object({
    action:z.literal('complete'),
    sessionId:z.string(),
    outcome:z.string().min(2).max(5000),
    decisions:z.array(z.string().min(1).max(500)).max(20).default([]),
    nextStep:z.string().max(1000).optional(),
    followUpAt:z.string().optional(),
    createFollowUpTask:z.boolean().default(false)
  })
]);

async function buildBrief(studentId:string){
  const now=new Date();
  const sevenDaysAgo=new Date(now.getTime()-7*86400000);
  const fourteenDaysAgo=new Date(now.getTime()-14*86400000);
  const tomorrow=new Date(now.getTime()+86400000);

  const [practice,previousPractice,alerts,actions,reviews,recentExams,lastSession,submissions,previousSubmissions,techniqueSessions,previousTechniqueSessions]=await Promise.all([
    db.practiceLog.findMany({where:{studentId,date:{gte:sevenDaysAgo}},orderBy:{date:'desc'},take:160}),
    db.practiceLog.findMany({where:{studentId,date:{gte:fourteenDaysAgo,lt:sevenDaysAgo}},orderBy:{date:'desc'},take:160}),
    db.coachAlert.findMany({where:{studentId,resolved:false},orderBy:{createdAt:'desc'},take:8}),
    db.coachingAction.findMany({
      where:{studentId,OR:[{periodEnd:{gte:sevenDaysAgo}},{updatedAt:{gte:sevenDaysAgo}},{status:'ACTIVE'}]},
      select:{id:true,title:true,status:true,periodEnd:true,updatedAt:true,submission:{select:{id:true,submittedAt:true}}},
      orderBy:{periodEnd:'asc'},take:80
    }),
    db.reviewQueueItem.findMany({
      where:{studentId,OR:[{updatedAt:{gte:sevenDaysAgo}},{dueAt:{lte:tomorrow}}]},
      select:{id:true,status:true,dueAt:true,completedAt:true,lastCorrect:true,question:{select:{subject:true,topic:true}}},
      orderBy:{dueAt:'asc'},take:120
    }),
    db.examResult.findMany({where:{studentId},orderBy:{createdAt:'desc'},take:12,select:{examType:true,createdAt:true,payload:true}}),
    db.coachingSession.findFirst({where:{studentId,status:'COMPLETED'},orderBy:{startsAt:'desc'},select:{startsAt:true,outcome:true,decisions:true,nextStep:true}}),
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
  const previousBySubject=new Map(previousPracticeSummary.subjects.map(x=>[x.subject,x]));
  const subjectChanges=currentPractice.subjects.map(x=>({
    subject:x.subject,current:x.accuracy,previous:previousBySubject.get(x.subject)?.accuracy??null,
    delta:previousBySubject.has(x.subject)?x.accuracy-(previousBySubject.get(x.subject)?.accuracy||0):null
  })).filter(x=>x.delta!=null).sort((a,b)=>(b.delta||0)-(a.delta||0));
  const developedArea=subjectChanges.find(x=>(x.delta||0)>0)||null;
  const regressedArea=[...subjectChanges].reverse().find(x=>(x.delta||0)<0)||null;

  const currentCompletion=submissions.length?Math.round(submissions.reduce((n,x)=>n+x.completionRate,0)/submissions.length):0;
  const previousCompletion=previousSubmissions.length?Math.round(previousSubmissions.reduce((n,x)=>n+x.completionRate,0)/previousSubmissions.length):0;
  const currentFocus=Math.round(techniqueSessions.reduce((n,x)=>n+(x.activeSeconds||0),0)/60);
  const previousFocus=Math.round(previousTechniqueSessions.reduce((n,x)=>n+(x.activeSeconds||0),0)/60);
  const netChange=buildExamNetChange(recentExams);
  const actionSummary=summarizeSessionActions(actions,now);
  const reviewSummary=summarizeSessionReviews(reviews,now);
  const priorDecisions=previousSessionDecisions(lastSession?.decisions);

  const agenda:string[]=[];
  if(priorDecisions.length)agenda.push('Geçen görüşme kararı: '+priorDecisions[0]);
  else if(lastSession?.nextStep)agenda.push('Geçen görüşmenin sonraki adımı: '+lastSession.nextStep);
  if(actionSummary.notCompletedCount)agenda.push(actionSummary.notCompletedCount+' görev yapılmadı/gecikti.');
  if(regressedArea)agenda.push(regressedArea.subject+' doğruluğu önceki haftaya göre '+Math.abs(regressedArea.delta||0)+' puan geriledi.');
  if(reviewSummary.overdueCount)agenda.push(reviewSummary.overdueCount+' tekrar gecikti.');
  if(reviewSummary.dueTodayCount)agenda.push(reviewSummary.dueTodayCount+' tekrar bugün tamamlanmalı.');

  const questions=[
    priorDecisions.length
      ? 'Geçen görüşmede aldığımız “'+priorDecisions[0]+'” kararını ne ölçüde uygulayabildin?'
      : 'Geçen görüşmeden bu yana en önemli değişiklik ne oldu?',
    actionSummary.completedCount
      ? 'Bu hafta tamamladığın '+actionSummary.completedCount+' görev içinde sana en çok katkı sağlayan hangisiydi?'
      : 'Bu hafta planlanan çalışmalardan hangisini yapabildin?',
    actionSummary.notCompletedCount
      ? 'Tamamlanmayan '+actionSummary.notCompletedCount+' görevin önündeki temel engel neydi?'
      : 'Programın günlük kapasiten açısından gerçekçi miydi?',
    netChange?.delta!=null
      ? netChange.examType+' netindeki '+(netChange.delta>=0?'+'+netChange.delta:netChange.delta)+' değişimin sence ana nedeni neydi?'
      : 'Deneme performansını etkileyen en önemli faktör neydi?',
    reviewSummary.overdueCount||reviewSummary.dueTodayCount
      ? 'Tekrar sisteminde geciken veya bugün gelen konulardan hangisinde unutma daha belirgin?'
      : 'Tekrar sisteminde hangi bilgilerin daha sık karşısına çıkması gerekiyor?'
  ];

  const decisionSuggestions:string[]=[];
  if(actionSummary.notCompletedCount)decisionSuggestions.push('Görev hacmini gerçek kapasiteye göre yeniden dağıt.');
  if(regressedArea)decisionSuggestions.push(regressedArea.subject+' için 10–15 soruluk tanılayıcı kontrol seti uygula.');
  if(reviewSummary.overdueCount||reviewSummary.dueTodayCount)decisionSuggestions.push('Tekrar kuyruğunu günlük planda önceliklendir.');
  if(netChange?.delta!=null&&netChange.delta<0)decisionSuggestions.push(netChange.examType+' denemesi sonrası yanlış nedeni analizi yap.');
  if(!decisionSuggestions.length)decisionSuggestions.push('Mevcut planı bir hafta daha sürdür ve aynı ölçütlerle yeniden değerlendir.');

  return {
    generatedAt:now.toISOString(),
    previousSession:lastSession?{
      startsAt:lastSession.startsAt,
      outcome:lastSession.outcome,
      decisions:priorDecisions,
      nextStep:lastSession.nextStep
    }:null,
    week:{
      completedActions:actionSummary.completed,
      notCompletedActions:actionSummary.notCompleted,
      completedCount:actionSummary.completedCount,
      notCompletedCount:actionSummary.notCompletedCount
    },
    netChange,
    reviews:reviewSummary,
    weeklyChange:{
      questions:{current:currentPractice.totalQuestions,previous:previousPracticeSummary.totalQuestions,delta:currentPractice.totalQuestions-previousPracticeSummary.totalQuestions},
      accuracy:{current:currentPractice.accuracy,previous:previousPracticeSummary.accuracy,delta:currentPractice.accuracy-previousPracticeSummary.accuracy},
      taskCompletion:{current:currentCompletion,previous:previousCompletion,delta:currentCompletion-previousCompletion},
      focusMinutes:{current:currentFocus,previous:previousFocus,delta:currentFocus-previousFocus},
      developedArea,regressedArea
    },
    activeAlerts:alerts.map(x=>({severity:x.severity,title:x.title,message:x.message})),
    agenda:agenda.slice(0,5),
    questions,
    decisionSuggestions
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
  const derivedNextStep=input.nextStep||input.decisions[0]||null;
  const completedAt=new Date();
  const updated=await db.$transaction(async tx=>{
    const saved=await tx.coachingSession.update({where:{id:session.id},data:{
      status:'COMPLETED',
      completedAt,
      outcome:input.outcome,
      decisions:input.decisions,
      nextStep:derivedNextStep,
      followUpAt
    }});
    for(let index=0;index<input.decisions.length;index++){
      const decision=input.decisions[index];
      const classified=classifyCoachDecision(decision);
      await tx.dailyLog.create({data:{
        studentId:id,
        date:completedAt,
        payload:{
          type:'COACH_INTERVENTION',
          sessionId:session.id,
          decisionIndex:index,
          decision,
          kind:classified.kind,
          subject:classified.subject,
          outcome:input.outcome,
          at:completedAt.toISOString()
        }
      }});
    }
    return saved;
  });
  if(followUpAt&&input.createFollowUpTask){
    await db.coachTask.create({data:{
      coachId:user.coachProfile.id,
      studentId:id,
      title:derivedNextStep||student.fullName+' seans takibi',
      description:'Koçluk seansı sonrası otomatik takip görevi.',
      priority:'MEDIUM',
      dueAt:followUpAt,
      sourceType:'SESSION',
      sourceId:session.id
    }});
  }
  return NextResponse.json({ok:true,session:updated,interventionsRecorded:input.decisions.length});
}

export const GET = withApiErrors(GET__handler);
export const POST = withApiErrors(POST__handler);
