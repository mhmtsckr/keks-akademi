import {db} from '@/lib/db';
import {buildCapacityProfile,ensureTodayLearningPlan,rebalanceMissedTasksCapacityAware} from '@/lib/learningEngine';

type RecordLike=Record<string,any>;
function record(value:unknown):RecordLike{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as RecordLike:{};
}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}
function startOfIstanbulDay(date=new Date()){
  const key=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  return new Date(key+'T00:00:00+03:00');
}

export type NextBestAction={
  id:string;
  source:string;
  title:string;
  subject:string|null;
  topic:string|null;
  why:string;
  estimatedMinutes:number;
  targetValue:number;
  metricType:string;
  priority:'CRITICAL'|'HIGH'|'NORMAL';
  badge:string;
  ctaLabel:string;
  executionTarget:'#miza-orkestrator';
};

export function selectNextBestAction(plan:any[]):NextBestAction|null{
  const remaining=(Array.isArray(plan)?plan:[])
    .filter((item:any)=>item?.inTodayPlan!==false&&!item?.completed)
    .sort((a:any,b:any)=>Number(a.order||999)-Number(b.order||999));

  const item=remaining[0];
  if(!item)return null;

  const source=String(item.source||'');
  const priority:NextBestAction['priority']=source==='ACTION'?'CRITICAL':source==='REVIEW_BATCH'?'HIGH':'NORMAL';
  const badge=source==='ACTION'?'KOÇ ÖNCELİĞİ'
    :source==='REVIEW_BATCH'?'GECİKMİŞ TEKRAR'
    :source==='ROUTINE'?'TEMEL RUTİN'
    :source==='TOPIC'?'KONU AÇIĞI'
    :source==='PRACTICE'?'ÖLÇÜMLÜ SORU'
    :'KISA AKSİYON';
  const ctaLabel=source==='REVIEW_BATCH'?'Tekrarı Başlat'
    :source==='PRACTICE'?'Soruları Çöz'
    :source==='TOPIC'?'Konu Çalışmasını Başlat'
    :'Şimdi Başla';

  return {
    id:String(item.id),
    source,
    title:String(item.title||'Bugünkü görevi başlat'),
    subject:typeof item.subject==='string'?item.subject:null,
    topic:typeof item.topic==='string'?item.topic:null,
    why:String(item.why||'Bugünkü KEKS sıralamasında en yüksek öncelikli tamamlanmamış görev.'),
    estimatedMinutes:Math.max(1,Number(item.estimatedMinutes||5)),
    targetValue:Math.max(0,Number(item.targetValue||0)),
    metricType:String(item.metricType||'COUNT'),
    priority,
    badge,
    ctaLabel,
    executionTarget:'#miza-orkestrator'
  };
}

export async function buildFirstSevenDayProgress(studentId:string,now=new Date()){
  const student=await db.student.findUnique({
    where:{id:studentId},
    select:{profile:true}
  });
  const onboarding=record(record(student?.profile).onboarding);
  const completedAtRaw=typeof onboarding.completedAt==='string'?onboarding.completedAt:null;
  if(!completedAtRaw)return {
    active:false,
    day:0,
    status:'NOT_STARTED' as const,
    taskCompletionRate:0,
    observedStudyDays:0,
    actualAverageMinutes:0,
    plannedDailyMinutes:0,
    message:'İlk 7 Gün başlangıç verisi henüz oluşmadı.'
  };

  const completedAt=new Date(completedAtRaw);
  const start=startOfIstanbulDay(completedAt);
  const today=startOfIstanbulDay(now);
  const elapsedDays=Math.max(0,Math.floor((today.getTime()-start.getTime())/86400000));
  const day=clamp(elapsedDays+1,1,7);
  const end=new Date(Math.min(start.getTime()+7*86400000,now.getTime()+1));

  const [actions,sessions]=await Promise.all([
    db.coachingAction.findMany({
      where:{
        studentId,
        planSource:'ONBOARDING_V1',
        taskDate:{gte:start,lt:new Date(start.getTime()+7*86400000)}
      },
      select:{status:true,submission:{select:{id:true}}}
    }),
    db.techniquePracticeSession.findMany({
      where:{studentId,createdAt:{gte:start,lt:end}},
      select:{createdAt:true,activeSeconds:true}
    })
  ]);

  const completedTasks=actions.filter(x=>x.status==='COMPLETED'||Boolean(x.submission)).length;
  const taskCompletionRate=actions.length?Math.round(completedTasks/actions.length*100):0;
  const byDay=new Map<string,number>();
  for(const session of sessions){
    const key=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(session.createdAt);
    byDay.set(key,(byDay.get(key)||0)+Math.max(0,Math.round(Number(session.activeSeconds||0)/60)));
  }
  const studyMinutes=[...byDay.values()].filter(x=>x>0);
  const actualAverageMinutes=studyMinutes.length?Math.round(studyMinutes.reduce((a,b)=>a+b,0)/studyMinutes.length):0;
  const plannedDailyMinutes=Math.max(0,Number(record(student?.profile).plannedDailyMinutes||0));
  const finished=elapsedDays>=7;

  return {
    active:!finished,
    day:finished?7:day,
    status:finished?'CALIBRATED' as const:'LEARNING_CAPACITY' as const,
    taskCompletionRate,
    observedStudyDays:studyMinutes.length,
    actualAverageMinutes,
    plannedDailyMinutes,
    message:finished
      ?'İlk 7 günlük davranış verisi oluştu. Bundan sonraki günlük plan gözlenen kapasite ve tamamlama davranışını esas alır.'
      :'KEKS '+day+'. gün verisini topluyor; planlanan süre yerine gerçek çalışma davranışın giderek daha fazla ağırlık kazanıyor.'
  };
}

export async function buildStudentActionHub(studentId:string,now=new Date()){
  const rebalance=await rebalanceMissedTasksCapacityAware(studentId,now);
  const [today,firstSevenDays,capacity,wrongCount]=await Promise.all([
    ensureTodayLearningPlan(studentId,now),
    buildFirstSevenDayProgress(studentId,now),
    buildCapacityProfile(studentId,now),
    db.questionBankItem.count({
      where:{sourceKind:'STUDENT_WRONG:'+studentId,reviewStatus:'STUDENT_PRIVATE'}
    })
  ]);

  const plan=Array.isArray(today.plan)?today.plan:[];
  const nextAction=selectNextBestAction(plan);
  const remaining=plan.filter((x:any)=>!x.completed);
  const completed=plan.filter((x:any)=>x.completed);
  const dueReviews=remaining
    .filter((x:any)=>x.source==='REVIEW_BATCH')
    .reduce((sum:number,x:any)=>sum+Number(x.targetValue||0),0);

  return {
    engineVersion:'NEXT_BEST_ACTION_V1',
    generatedAt:now.toISOString(),
    date:today.date,
    nextAction,
    today:{
      remainingTasks:remaining.length,
      completedTasks:completed.length,
      totalTasks:plan.length,
      remainingMinutes:remaining.reduce((sum:number,x:any)=>sum+Number(x.estimatedMinutes||0),0),
      dueReviews,
      wrongQuestionCount:wrongCount
    },
    capacity:{
      plannedMinutes:capacity.plannedMinutes,
      actualAverageMinutes:capacity.actualAverageMinutes,
      suggestedDailyMinutes:capacity.suggestedDailyMinutes,
      recommendedFocusBlockMinutes:capacity.recommendedFocusBlockMinutes
    },
    firstSevenDays,
    rebalance:{
      redistributedTasks:rebalance.created.length,
      deferredTasks:rebalance.deferred.length,
      deferredUnits:rebalance.deferred.reduce((sum:number,x:any)=>sum+Number(x.unallocated||0),0)
    },
    principle:'Tek ekranda tek sonraki aksiyon. MİZA bu aksiyonu açıklar ve sonucu kaydeder; koçun planını tek başına değiştirmez.'
  };
}
