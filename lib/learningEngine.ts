import { db } from '@/lib/db';
import { isFeatureEnabled } from '@/lib/systemConfig';

export type MasteryStatus='NEW'|'LEARNING'|'REINFORCING'|'DURABLE'|'RISKY';

export const ERROR_REASON_LABELS={
  BILGI_EKSIKLIGI:'Bilgi eksikliği',
  ISLEM_HATASI:'İşlem hatası',
  DIKKAT:'Dikkat',
  SORU_KOKU:'Soru kökünü yanlış okuma',
  SURE:'Süre',
  YONTEM_BILMEME:'Yöntem bilmeme',
  UNUTMA:'Unutma'
} as const;

export type ErrorReasonKey=keyof typeof ERROR_REASON_LABELS;

function record(value:unknown):Record<string,unknown>{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
}

function numberValue(value:unknown){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

function clamp(n:number,min:number,max:number){
  return Math.max(min,Math.min(max,n));
}

function average(values:number[]){
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
}

function trDateKey(date:Date){
  return new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(date);
}

function utcDateFromKey(key:string){
  const [y,m,d]=key.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d));
}

function addDays(date:Date,days:number){
  const d=new Date(date);
  d.setUTCDate(d.getUTCDate()+days);
  return d;
}

function weekdayKey(date:Date){
  return new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Istanbul',weekday:'short'}).format(date);
}

function localHour(date:Date){
  return Number(new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/Istanbul',hour:'2-digit',hour12:false
  }).format(date));
}

function readPlannedMinutes(profile:unknown){
  const p=record(profile);
  const keys=['plannedDailyMinutes','dailyMinutes','studyMinutes','dailyStudyMinutes','dailyCapacityMinutes'];
  for(const key of keys){
    const n=numberValue(p[key]);
    if(n!=null&&n>=20&&n<=720)return Math.round(n);
  }
  return null;
}

function subjectFamily(subject:string){
  const s=subject.toLocaleUpperCase('tr-TR');
  if(/MAT|PROBLEM|GEOMETR/.test(s))return 'MATHEMATICS';
  if(/TÜRKÇE|TURKCE|PARAGRAF|DİL BİLGİSİ|DIL BILGISI/.test(s))return 'TURKISH';
  if(/TARİH|TARIH/.test(s))return 'HISTORY';
  if(/EDEBİYAT|EDEBIYAT/.test(s))return 'LITERATURE';
  if(/FEN|FİZİK|FIZIK|KİMYA|KIMYA|BİYOLOJİ|BIYOLOJI/.test(s))return 'SCIENCE';
  return 'GENERAL';
}

function minutesPerQuestion(subject:string){
  const family=subjectFamily(subject);
  if(family==='MATHEMATICS')return 2.2;
  if(family==='TURKISH')return 1.45;
  if(family==='HISTORY'||family==='LITERATURE')return 1.15;
  if(family==='SCIENCE')return 1.8;
  return 1.5;
}

function estimatedTaskMinutes(input:{metricType?:string|null;targetValue:number;subject?:string|null}){
  if(input.metricType==='MINUTES')return Math.max(1,Math.round(input.targetValue));
  if(input.metricType==='QUESTIONS')return Math.max(3,Math.round(input.targetValue*minutesPerQuestion(input.subject||'')));
  return Math.max(5,Math.round(input.targetValue*5));
}

export type TodayPlanSource='ROUTINE'|'REVIEW_BATCH'|'TOPIC'|'PRACTICE'|'ACTION'|'MICRO';

function normalizedPlanText(value:string|null|undefined){
  return (value||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
}

export function todayPlanSequenceRank(item:{source:TodayPlanSource|string;title?:string|null;subject?:string|null;metricType?:string|null}){
  const text=normalizedPlanText((item.title||'')+' '+(item.subject||''));
  if(item.source==='ROUTINE'||item.source==='ACTION'){
    if(/PARAGRAF/.test(text))return 10;
    if(/PROBLEM/.test(text))return 20;
  }
  if(item.source==='ROUTINE')return 25;
  if(item.source==='REVIEW_BATCH')return 30;
  if(item.source==='TOPIC')return 40;
  if(item.source==='PRACTICE')return 50;
  if(item.source==='ACTION'&&item.metricType==='MINUTES')return 45;
  if(item.source==='ACTION'&&item.metricType==='QUESTIONS')return 55;
  if(item.source==='ACTION')return 60;
  return 70;
}

export function dailyPracticeQuestionTarget(input:{questionCapacity:number|null;accuracy:number|null}){
  if(input.accuracy!=null&&input.accuracy<55)return 10;
  if(input.questionCapacity!=null&&input.questionCapacity<30)return 10;
  if(input.questionCapacity!=null&&input.questionCapacity<50)return 15;
  return 20;
}

function routineDisplayTitle(title:string,value:number){
  const text=normalizedPlanText(title);
  if(/PARAGRAF/.test(text))return Math.round(value)+' paragraf';
  if(/PROBLEM/.test(text))return Math.round(value)+' problem';
  return title;
}

export function normalizedReason(value:string|null|undefined):ErrorReasonKey|null{
  if(!value)return null;
  if(value in ERROR_REASON_LABELS)return value as ErrorReasonKey;
  // Eski kayıtları yeni yedi sınıflı veri sözlüğüne geriye uyumlu eşle.
  if(value==='SORUYU_ANLAMA')return 'SORU_KOKU';
  if(value==='STRATEJI')return 'YONTEM_BILMEME';
  return null;
}

export function inferPracticeErrorReason(input:{
  subject:string;
  correct:number;
  wrong:number;
  blank:number;
  durationSeconds?:number|null;
  problemType?:string|null;
  questionType?:string|null;
  activeRecallScore?:number|null;
  reviewSuccessScore?:number|null;
  conceptScore?:number|null;
  misconception?:string|null;
}):ErrorReasonKey|null{
  if(input.wrong<=0)return null;
  const total=Math.max(1,input.correct+input.wrong+input.blank);
  const accuracy=input.correct/total*100;
  const family=subjectFamily(input.subject);
  if(input.reviewSuccessScore!=null&&input.reviewSuccessScore<55)return 'UNUTMA';
  if((family==='HISTORY'||family==='LITERATURE')&&input.activeRecallScore!=null&&input.activeRecallScore<55)return 'UNUTMA';
  if(input.conceptScore!=null&&input.conceptScore<55)return 'BILGI_EKSIKLIGI';
  if(input.misconception?.trim())return 'BILGI_EKSIKLIGI';
  if(input.durationSeconds&&total>0){
    const secondsPerQuestion=input.durationSeconds/total;
    const limit=family==='MATHEMATICS'?150:family==='TURKISH'?105:120;
    if(secondsPerQuestion>limit)return 'SURE';
  }
  if(family==='MATHEMATICS'&&input.problemType&&accuracy<55)return 'YONTEM_BILMEME';
  return null;
}

export function buildErrorReasonBreakdown(rows:{wrong:number;errorReason:string|null}[]){
  const counts:Record<ErrorReasonKey,number>={
    BILGI_EKSIKLIGI:0,ISLEM_HATASI:0,DIKKAT:0,SORU_KOKU:0,SURE:0,YONTEM_BILMEME:0,UNUTMA:0
  };
  let totalWrong=0;
  let classifiedWrong=0;
  for(const row of rows){
    const wrong=Math.max(0,row.wrong||0);
    totalWrong+=wrong;
    const reason=normalizedReason(row.errorReason);
    if(reason&&wrong>0){
      counts[reason]+=wrong;
      classifiedWrong+=wrong;
    }
  }
  const items=(Object.keys(counts) as ErrorReasonKey[])
    .map(key=>({
      key,
      label:ERROR_REASON_LABELS[key],
      count:counts[key],
      percent:classifiedWrong?Math.round(counts[key]/classifiedWrong*100):0
    }))
    .filter(x=>x.count>0)
    .sort((a,b)=>b.count-a.count);
  return {
    totalWrong,
    classifiedWrong,
    unclassifiedWrong:Math.max(0,totalWrong-classifiedWrong),
    coveragePercent:totalWrong?Math.round(classifiedWrong/totalWrong*100):100,
    items
  };
}

export type CapacitySessionEvidence={
  startedAt:Date;
  completedAt?:Date|null;
  activeSeconds:number|null;
  durationMinutes:number;
};

export type CapacitySubmissionEvidence={
  submittedAt:Date;
  totalQuestions:number;
  accuracy:number;
};

function weightedAccuracy(rows:CapacitySubmissionEvidence[]){
  const total=rows.reduce((n,x)=>n+Math.max(0,x.totalQuestions),0);
  if(!total)return null;
  return rows.reduce((n,x)=>n+(Math.max(0,x.totalQuestions)*x.accuracy),0)/total;
}

export function inferEfficientStudyWindow(
  sessions:CapacitySessionEvidence[],
  submissions:CapacitySubmissionEvidence[]
){
  const hourMinutes=new Map<number,number>();
  for(const session of sessions){
    const h=localHour(session.startedAt);
    const minutes=Math.max(0,(session.activeSeconds||0)/60);
    hourMinutes.set(h,(hourMinutes.get(h)||0)+minutes);
  }

  const hourSubmissions=new Map<number,CapacitySubmissionEvidence[]>();
  for(const row of submissions){
    const h=localHour(row.submittedAt);
    const list=hourSubmissions.get(h)||[];
    list.push(row);
    hourSubmissions.set(h,list);
  }

  let best:{startHour:number;score:number;accuracy:number|null;questions:number;activeMinutes:number}|null=null;
  for(let h=0;h<24;h++){
    const rows=[...(hourSubmissions.get(h)||[]),...(hourSubmissions.get((h+1)%24)||[])];
    const questions=rows.reduce((n,x)=>n+x.totalQuestions,0);
    const accuracy=weightedAccuracy(rows);
    const activeMinutes=(hourMinutes.get(h)||0)+(hourMinutes.get((h+1)%24)||0);
    if(questions<10&&activeMinutes<20)continue;
    const startHourMinutes=hourMinutes.get(h)||0;
    const score=(accuracy??0)+(Math.min(questions,60)/12)+(Math.min(activeMinutes,120)/24)+(Math.min(startHourMinutes,60)/12);
    if(!best||score>best.score)best={startHour:h,score,accuracy,questions,activeMinutes};
  }

  if(!best)return {bestWindow:null,bestWindowAccuracy:null,bestWindowQuestions:0,bestWindowActiveMinutes:0};
  const end=(best.startHour+2)%24;
  return {
    bestWindow:String(best.startHour).padStart(2,'0')+'.00–'+String(end).padStart(2,'0')+'.00',
    bestWindowAccuracy:best.accuracy==null?null:Math.round(best.accuracy),
    bestWindowQuestions:best.questions,
    bestWindowActiveMinutes:Math.round(best.activeMinutes)
  };
}

export function inferFocusDrop(
  sessions:CapacitySessionEvidence[],
  submissions:CapacitySubmissionEvidence[]
){
  const paired:{minutes:number;submission:CapacitySubmissionEvidence}[]=[];

  for(const submission of submissions){
    let match:CapacitySessionEvidence|null=null;
    let matchEnd=-Infinity;
    for(const session of sessions){
      const start=session.startedAt.getTime();
      const active=Math.max(0,session.activeSeconds||session.durationMinutes*60);
      const end=(session.completedAt?.getTime()??(start+active*1000))+45*60000;
      const submitted=submission.submittedAt.getTime();
      if(submitted>=start&&submitted<=end&&end>matchEnd){
        match=session;
        matchEnd=end;
      }
    }
    if(match){
      const minutes=Math.max(1,Math.round((match.activeSeconds||match.durationMinutes*60)/60));
      paired.push({minutes,submission});
    }
  }

  for(const threshold of [30,45,60]){
    const short=paired.filter(x=>x.minutes<=threshold).map(x=>x.submission);
    const long=paired.filter(x=>x.minutes>threshold).map(x=>x.submission);
    const shortQuestions=short.reduce((n,x)=>n+x.totalQuestions,0);
    const longQuestions=long.reduce((n,x)=>n+x.totalQuestions,0);
    if(short.length<2||long.length<2||shortQuestions<20||longQuestions<20)continue;
    const shortAccuracy=weightedAccuracy(short);
    const longAccuracy=weightedAccuracy(long);
    if(shortAccuracy==null||longAccuracy==null)continue;
    const drop=shortAccuracy-longAccuracy;
    if(drop>=8){
      return {
        afterMinutes:threshold,
        beforeAccuracy:Math.round(shortAccuracy),
        afterAccuracy:Math.round(longAccuracy),
        dropPoints:Math.round(drop),
        matchedSubmissions:paired.length
      };
    }
  }
  return {
    afterMinutes:null,
    beforeAccuracy:null,
    afterAccuracy:null,
    dropPoints:null,
    matchedSubmissions:paired.length
  };
}

export function recommendedFocusBlockMinutes(focusDropAfterMinutes:number|null,sessionMinutes:number[]){
  if(focusDropAfterMinutes!=null)return Math.round(clamp(focusDropAfterMinutes-5,20,50));
  const usable=sessionMinutes.filter(x=>x>=10&&x<=120);
  if(!usable.length)return 35;
  return Math.round(clamp(average(usable),25,50));
}

export function capacityDayFactor(lowCompletionDays:{day:string;completionRate:number}[],date:Date){
  const row=lowCompletionDays.find(x=>x.day===weekdayKey(date));
  if(!row)return 1;
  if(row.completionRate<60)return .75;
  if(row.completionRate<75)return .9;
  return 1;
}

export async function buildCapacityProfile(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-35*86400000);
  const [student,sessions,submissions,actions]=await Promise.all([
    db.student.findUnique({where:{id:studentId},select:{profile:true}}),
    db.techniquePracticeSession.findMany({
      where:{studentId,createdAt:{gte:since}},
      select:{startedAt:true,completedAt:true,activeSeconds:true,durationMinutes:true,completed:true},
      orderBy:{startedAt:'asc'}
    }),
    db.taskSubmission.findMany({
      where:{studentId,submittedAt:{gte:since}},
      select:{submittedAt:true,totalQuestions:true,completionRate:true,accuracy:true}
    }),
    db.coachingAction.findMany({
      where:{studentId,taskDate:{gte:utcDateFromKey(trDateKey(since)),lte:addDays(utcDateFromKey(trDateKey(now)),1)}},
      select:{taskDate:true,status:true,submission:{select:{id:true}}}
    })
  ]);

  const plannedMinutes=readPlannedMinutes(student?.profile);
  const minutesByDay=new Map<string,number>();
  for(const session of sessions){
    const key=trDateKey(session.startedAt);
    const minutes=Math.max(0,(session.activeSeconds||0)/60);
    minutesByDay.set(key,(minutesByDay.get(key)||0)+minutes);
  }

  const questionsByDay=new Map<string,number>();
  for(const row of submissions){
    const key=trDateKey(row.submittedAt);
    questionsByDay.set(key,(questionsByDay.get(key)||0)+row.totalQuestions);
  }

  const observedMinutes=[...minutesByDay.values()].filter(x=>x>=5);
  const actualAverageMinutes=observedMinutes.length?Math.round(average(observedMinutes)):0;
  const questionDays=[...questionsByDay.values()].filter(x=>x>0);
  const questionCapacity=questionDays.length?Math.round(average(questionDays)):0;
  const efficientWindow=inferEfficientStudyWindow(sessions,submissions);
  const focusDrop=inferFocusDrop(sessions,submissions);
  const focusBlockMinutes=recommendedFocusBlockMinutes(
    focusDrop.afterMinutes,
    sessions.map(x=>Math.max(0,(x.activeSeconds||0)/60))
  );

  const weekdayStats=new Map<string,{total:number;completed:number}>();
  for(const action of actions){
    if(!action.taskDate)continue;
    const key=weekdayKey(action.taskDate);
    const x=weekdayStats.get(key)||{total:0,completed:0};
    x.total++;
    if(action.submission||action.status==='COMPLETED')x.completed++;
    weekdayStats.set(key,x);
  }
  const lowCompletionDays=[...weekdayStats.entries()]
    .filter(([,x])=>x.total>=2)
    .map(([day,x])=>({day,completionRate:Math.round(x.completed/x.total*100),total:x.total}))
    .sort((a,b)=>a.completionRate-b.completionRate)
    .slice(0,2);

  const evidenceDays=new Set([...minutesByDay.keys(),...questionsByDay.keys()]).size;
  const behavioralBase=actualAverageMinutes||plannedMinutes||90;
  const suggestedDailyMinutes=Math.round(clamp(
    actualAverageMinutes>0?actualAverageMinutes*1.1:behavioralBase,
    45,
    plannedMinutes?Math.max(60,plannedMinutes):240
  ));
  const actualVsPlannedDeltaMinutes=plannedMinutes!=null&&actualAverageMinutes>0
    ?actualAverageMinutes-plannedMinutes
    :null;

  return {
    plannedMinutes,
    actualAverageMinutes:actualAverageMinutes||null,
    actualVsPlannedDeltaMinutes,
    suggestedDailyMinutes,
    questionCapacity:questionCapacity||null,
    bestWindow:efficientWindow.bestWindow,
    bestWindowAccuracy:efficientWindow.bestWindowAccuracy,
    bestWindowQuestions:efficientWindow.bestWindowQuestions,
    bestWindowActiveMinutes:efficientWindow.bestWindowActiveMinutes,
    focusDropAfterMinutes:focusDrop.afterMinutes,
    focusDropPoints:focusDrop.dropPoints,
    focusDropBeforeAccuracy:focusDrop.beforeAccuracy,
    focusDropAfterAccuracy:focusDrop.afterAccuracy,
    focusDropEvidence:focusDrop.matchedSubmissions,
    recommendedFocusBlockMinutes:focusBlockMinutes,
    lowCompletionDays,
    evidenceDays,
    confidence:evidenceDays>=14?'HIGH':evidenceDays>=7?'MEDIUM':'LOW',
    measurementSource:observedMinutes.length?'ACTIVE_TIMER':'TASK_EVIDENCE_ONLY',
    note:evidenceDays<7
      ?'Kapasite profili henüz düşük veriyle oluşturuluyor; yeni kayıtlarla otomatik güncellenir.'
      :'Program önerisi beyan edilen süreden çok gözlenen davranışa dayanır.'
  };
}

export type KnowledgeMasteryInput={
  totalQuestions:number;
  attempts:number;
  aggregateAccuracy:number|null;
  latestTestAccuracy:number|null;
  reviewTotal:number;
  reviewCorrect:number;
  overdueReviews:number;
  daysSinceLastEvidence:number;
};

function masteryRecencyScore(days:number){
  if(days<=3)return 100;
  if(days<=7)return 90;
  if(days<=14)return 75;
  if(days<=21)return 60;
  if(days<=35)return 40;
  return 20;
}

export function calculateKnowledgeMastery(input:KnowledgeMasteryInput){
  const aggregateAccuracy=input.aggregateAccuracy==null?null:clamp(input.aggregateAccuracy,0,100);
  const latestTestAccuracy=input.latestTestAccuracy==null?null:clamp(input.latestTestAccuracy,0,100);
  const testScore=latestTestAccuracy??aggregateAccuracy??0;
  const reviewSuccess=input.reviewTotal
    ?clamp(input.reviewCorrect/input.reviewTotal*100,0,100)
    :null;
  const reviewScore=reviewSuccess??50;
  const recencyScore=masteryRecencyScore(input.daysSinceLastEvidence);
  const evidenceScore=Math.round(clamp(
    Math.min(70,input.totalQuestions/30*70)+Math.min(30,input.attempts/3*30),
    0,
    100
  ));
  const overduePenalty=Math.min(25,input.overdueReviews*8);
  const score=Math.round(clamp(
    testScore*.45+
    reviewScore*.30+
    recencyScore*.15+
    evidenceScore*.10-
    overduePenalty,
    0,
    100
  ));

  let status:MasteryStatus='NEW';
  let reason='Konu için henüz yeterli test ve tekrar kanıtı oluşmadı.';

  if(input.totalQuestions<5&&input.reviewTotal===0){
    status='NEW';
  }else if(
    input.overdueReviews>=2||
    input.daysSinceLastEvidence>28||
    (latestTestAccuracy!=null&&latestTestAccuracy<55)||
    (reviewSuccess!=null&&input.reviewTotal>=2&&reviewSuccess<55)
  ){
    status='RISKY';
    if(input.overdueReviews>=2)reason=input.overdueReviews+' gecikmiş tekrar bulunduğu için konu yeniden ele alınmalı.';
    else if(input.daysSinceLastEvidence>28)reason='Son güvenilir kanıtın üzerinden '+input.daysSinceLastEvidence+' gün geçtiği için unutma riski yükseldi.';
    else if(latestTestAccuracy!=null&&latestTestAccuracy<55)reason='Son test doğruluğu %'+Math.round(latestTestAccuracy)+' olduğu için konu riskli durumda.';
    else reason='Tekrar başarısı düşük olduğu için konu riskli durumda.';
  }else if(
    input.totalQuestions<12||
    input.attempts<2||
    (latestTestAccuracy!=null&&latestTestAccuracy<65)
  ){
    status='LEARNING';
    reason='Konu için temel öğrenme kanıtı var ancak test miktarı veya son test başarısı henüz yeterli değil.';
  }else if(
    latestTestAccuracy==null||
    latestTestAccuracy<85||
    input.reviewTotal<2||
    reviewSuccess==null||
    reviewSuccess<80||
    input.daysSinceLastEvidence>14
  ){
    status='REINFORCING';
    reason='Temel öğrenme oluşmuş; kalıcılık için son test, tekrar başarısı ve güncellik sinyallerinin birlikte güçlenmesi gerekiyor.';
  }else{
    status='DURABLE';
    reason='Son test, tekrar başarısı ve güncellik sinyalleri birlikte güçlü olduğu için bilgi kalıcı kabul ediliyor.';
  }

  const confidence=input.totalQuestions>=30&&input.attempts>=3&&input.reviewTotal>=2
    ?'HIGH'
    :input.totalQuestions>=12&&input.attempts>=2
      ?'MEDIUM'
      :'LOW';

  return {
    score,
    status,
    reason,
    confidence,
    components:{
      latestTestScore:latestTestAccuracy==null?null:Math.round(latestTestAccuracy),
      aggregateAccuracy:aggregateAccuracy==null?null:Math.round(aggregateAccuracy),
      reviewSuccess:reviewSuccess==null?null:Math.round(reviewSuccess),
      recencyScore,
      evidenceScore,
      overduePenalty
    }
  };
}

export async function buildTopicMastery(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-120*86400000);
  const [practice,reviews,topics]=await Promise.all([
    db.practiceLog.findMany({
      where:{studentId,date:{gte:since}},
      select:{subject:true,topic:true,total:true,correct:true,wrong:true,blank:true,errorReason:true,date:true},
      orderBy:{date:'asc'}
    }),
    db.reviewQueueItem.findMany({
      where:{studentId,updatedAt:{gte:since}},
      include:{question:{select:{subject:true,topic:true}}},
      orderBy:{updatedAt:'asc'}
    }),
    db.topicProgress.findMany({
      where:{studentId},
      select:{subject:true,topic:true,completed:true,completedAt:true,updatedAt:true}
    })
  ]);

  type Bucket={
    subject:string;topic:string;total:number;correct:number;wrong:number;blank:number;
    attempts:number;lastAt:Date|null;lastTestAt:Date|null;latestTestAccuracy:number|null;
    reviewTotal:number;reviewCorrect:number;overdueReviews:number;
    reasons:Record<string,number>;
  };
  const map=new Map<string,Bucket>();
  const ensure=(subject:string,topic:string)=>{
    const key=subject+'|'+topic;
    let x=map.get(key);
    if(!x){
      x={
        subject,topic,total:0,correct:0,wrong:0,blank:0,attempts:0,
        lastAt:null,lastTestAt:null,latestTestAccuracy:null,
        reviewTotal:0,reviewCorrect:0,overdueReviews:0,reasons:{}
      };
      map.set(key,x);
    }
    return x;
  };

  for(const row of topics){
    const x=ensure(row.subject,row.topic);
    const touchedAt=row.completedAt||row.updatedAt;
    if(!x.lastAt||touchedAt>x.lastAt)x.lastAt=touchedAt;
  }

  for(const row of practice){
    const x=ensure(row.subject,row.topic||'Genel/Karma');
    x.total+=row.total;x.correct+=row.correct;x.wrong+=row.wrong;x.blank+=row.blank;x.attempts++;
    x.lastAt=row.date;
    if(!x.lastTestAt||row.date>=x.lastTestAt){
      x.lastTestAt=row.date;
      x.latestTestAccuracy=row.total?row.correct/row.total*100:null;
    }
    const reason=normalizedReason(row.errorReason);
    if(reason)x.reasons[reason]=(x.reasons[reason]||0)+1;
  }

  for(const row of reviews){
    const x=ensure(row.question.subject,row.question.topic||'Genel/Karma');
    x.reviewTotal++;
    if(row.lastCorrect)x.reviewCorrect++;
    if(row.status!=='COMPLETED'&&row.dueAt.getTime()<now.getTime())x.overdueReviews++;
    if(!x.lastAt||row.updatedAt>x.lastAt)x.lastAt=row.updatedAt;
  }

  return [...map.values()].map(x=>{
    const aggregateAccuracy=x.total?x.correct/x.total*100:null;
    const daysSince=x.lastAt?Math.max(0,Math.floor((now.getTime()-x.lastAt.getTime())/86400000)):999;
    const mastery=calculateKnowledgeMastery({
      totalQuestions:x.total,
      attempts:x.attempts,
      aggregateAccuracy,
      latestTestAccuracy:x.latestTestAccuracy,
      reviewTotal:x.reviewTotal,
      reviewCorrect:x.reviewCorrect,
      overdueReviews:x.overdueReviews,
      daysSinceLastEvidence:daysSince
    });
    const primaryReason=Object.entries(x.reasons).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    return {
      subject:x.subject,
      topic:x.topic,
      status:mastery.status,
      score:mastery.score,
      statusReason:mastery.reason,
      confidence:mastery.confidence,
      scoreBreakdown:mastery.components,
      latestTestAccuracy:x.latestTestAccuracy==null?null:Math.round(x.latestTestAccuracy),
      accuracy:aggregateAccuracy==null?null:Math.round(aggregateAccuracy),
      reviewAccuracy:mastery.components.reviewSuccess,
      totalQuestions:x.total,
      attempts:x.attempts,
      daysSinceLastEvidence:daysSince,
      overdueReviews:x.overdueReviews,
      primaryErrorReason:primaryReason,
      primaryErrorReasonLabel:primaryReason?ERROR_REASON_LABELS[primaryReason as ErrorReasonKey]||primaryReason:null
    };
  }).sort((a,b)=>{
    const order:Record<MasteryStatus,number>={RISKY:0,LEARNING:1,REINFORCING:2,NEW:3,DURABLE:4};
    return order[a.status]-order[b.status]||a.score-b.score;
  });
}

export type SubjectLearningFamily='MATHEMATICS'|'TURKISH'|'HISTORY'|'LITERATURE'|'SCIENCE'|'GENERAL';

function normalizedSubjectText(value:string|null|undefined){
  return (value||'').toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim();
}

function questionTypeStats(rows:{questionType:string;correct:number;wrong:number;blank:number;avgSeconds:number|null}[]){
  const map=new Map<string,{correct:number;wrong:number;blank:number;seconds:number[]}>();
  for(const row of rows){
    const key=row.questionType||'GENEL';
    const x=map.get(key)||{correct:0,wrong:0,blank:0,seconds:[]};
    x.correct+=row.correct;x.wrong+=row.wrong;x.blank+=row.blank;
    if(row.avgSeconds&&row.avgSeconds>0)x.seconds.push(row.avgSeconds);
    map.set(key,x);
  }
  return [...map.entries()].map(([questionType,x])=>{
    const total=x.correct+x.wrong+x.blank;
    return {
      questionType,
      total,
      accuracy:total?Math.round(x.correct/total*100):null,
      avgSeconds:x.seconds.length?Number(average(x.seconds).toFixed(1)):null
    };
  }).sort((a,b)=>(a.accuracy??101)-(b.accuracy??101)||b.total-a.total);
}

function topicStats(rows:{
  topic:string|null;correct:number;wrong:number;blank:number;avgSeconds?:number|null;
}[]){
  const map=new Map<string,{correct:number;wrong:number;blank:number;seconds:number[]}>();
  for(const row of rows){
    const key=row.topic||'Genel/Karma';
    const x=map.get(key)||{correct:0,wrong:0,blank:0,seconds:[]};
    x.correct+=row.correct;x.wrong+=row.wrong;x.blank+=row.blank;
    if(row.avgSeconds&&row.avgSeconds>0)x.seconds.push(row.avgSeconds);
    map.set(key,x);
  }
  return [...map.entries()].map(([topic,x])=>{
    const total=x.correct+x.wrong+x.blank;
    return {
      topic,total,
      accuracy:total?Math.round(x.correct/total*100):null,
      avgSeconds:x.seconds.length?Number(average(x.seconds).toFixed(1)):null
    };
  }).sort((a,b)=>(a.accuracy??101)-(b.accuracy??101)||b.total-a.total);
}

function literatureConnectionDimension(questionType:string,topic:string|null){
  const text=normalizedSubjectText(questionType+' '+(topic||''));
  if(/DÖNEM|DONEM|DEVİR|DEVIR|YÜZYIL|YUZYIL/.test(text))return 'DÖNEM';
  if(/YAZAR|ŞAİR|SAIR|SANATÇI|SANATCI/.test(text))return 'YAZAR';
  if(/ESER|ROMAN|ŞİİR|SIIR|HİKÂYE|HIKAYE|TİYATRO|TIYATRO/.test(text))return 'ESER';
  return null;
}

export async function buildSubjectLearningModels(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-60*86400000);
  const [practice,analytics,reviews,techniqueSessions]=await Promise.all([
    db.practiceLog.findMany({
      where:{studentId,date:{gte:since}},
      select:{subject:true,topic:true,total:true,correct:true,wrong:true,blank:true,errorReason:true,date:true}
    }),
    db.examAnalyticsRecord.findMany({
      where:{studentId,examDate:{gte:since}},
      select:{subject:true,topic:true,questionType:true,correct:true,wrong:true,blank:true,avgSeconds:true,examDate:true}
    }),
    db.reviewQueueItem.findMany({
      where:{studentId,updatedAt:{gte:since}},
      include:{question:{select:{subject:true,topic:true}}}
    }),
    db.techniquePracticeSession.findMany({
      where:{studentId,createdAt:{gte:since},techniqueKey:'ACTIVE_RECALL'},
      select:{title:true,result:true,activeSeconds:true,completed:true,startedAt:true}
    })
  ]);

  const subjects=new Set<string>([
    ...practice.map(x=>x.subject),
    ...analytics.map(x=>x.subject),
    ...reviews.map(x=>x.question.subject)
  ]);

  return [...subjects].map(subject=>{
    const family=subjectFamily(subject) as SubjectLearningFamily;
    const p=practice.filter(x=>x.subject===subject);
    const a=analytics.filter(x=>x.subject===subject);
    const r=reviews.filter(x=>x.question.subject===subject);
    const total=p.reduce((n,x)=>n+x.total,0)+a.reduce((n,x)=>n+x.correct+x.wrong+x.blank,0);
    const correct=p.reduce((n,x)=>n+x.correct,0)+a.reduce((n,x)=>n+x.correct,0);
    const avgSeconds=average(a.map(x=>x.avgSeconds||0).filter(x=>x>0));
    const qTypes=questionTypeStats(a);
    const topics=topicStats([
      ...p.map(x=>({topic:x.topic,correct:x.correct,wrong:x.wrong,blank:x.blank,avgSeconds:null})),
      ...a.map(x=>({topic:x.topic,correct:x.correct,wrong:x.wrong,blank:x.blank,avgSeconds:x.avgSeconds}))
    ]);

    const errorAnalytics=buildErrorReasonBreakdown(p.map(row=>({wrong:row.wrong,errorReason:row.errorReason})));
    const errorList=errorAnalytics.items;

    const reviewSuccess=r.length?Math.round(r.filter(x=>x.lastCorrect).length/r.length*100):null;
    const subjectNeedle=normalizedSubjectText(subject);
    const activeRecallSessions=techniqueSessions.filter(x=>{
      const evidence=normalizedSubjectText(x.title+' '+JSON.stringify(x.result));
      return evidence.includes(subjectNeedle);
    });
    const activeRecallMinutes=Math.round(activeRecallSessions.reduce((n,x)=>n+Math.max(0,x.activeSeconds||0)/60,0));

    const metrics=
      family==='MATHEMATICS'?['hız','doğruluk','problem tipi']:
      family==='TURKISH'?['soru türü','süre','doğruluk']:
      family==='HISTORY'?['aktif hatırlama','tekrar başarısı','kronoloji/kavram']:
      family==='LITERATURE'?['dönem','yazar/eser bağlantısı','tekrar başarısı']:
      family==='SCIENCE'?['konu','kavram yanılgısı','doğruluk']:
      ['doğruluk','konu','tekrar'];

    const weakestQuestionType=qTypes.find(x=>x.total>=3)||qTypes[0]||null;
    const slowestQuestionType=[...qTypes].filter(x=>x.avgSeconds!=null).sort((x,y)=>(y.avgSeconds||0)-(x.avgSeconds||0))[0]||null;
    const weakestTopic=topics.find(x=>x.total>=3)||topics[0]||null;

    const misconceptionCandidates=family==='SCIENCE'
      ?topics.filter(x=>x.total>=5&&(x.accuracy??100)<65).slice(0,3).map(x=>({
        topic:x.topic,
        accuracy:x.accuracy,
        evidence:'Düşük doğruluk; kavram yanılgısı olasılığı koç tarafından soru çözümüyle doğrulanmalıdır.'
      }))
      :[];

    const literatureDimensions=family==='LITERATURE'
      ?(['DÖNEM','YAZAR','ESER'] as const).map(dimension=>{
        const rows=a.filter(x=>literatureConnectionDimension(x.questionType,x.topic)===dimension);
        const dimensionTotal=rows.reduce((n,x)=>n+x.correct+x.wrong+x.blank,0);
        const dimensionCorrect=rows.reduce((n,x)=>n+x.correct,0);
        return {
          dimension,
          evidence:dimensionTotal,
          accuracy:dimensionTotal?Math.round(dimensionCorrect/dimensionTotal*100):null
        };
      })
      :[];

    let primarySignal='Genel performans verisi izleniyor.';
    let recommendedAction='Kısa konu tekrarı ve ölçümlü soru seti uygula.';

    if(family==='MATHEMATICS'){
      primarySignal=weakestQuestionType
        ?weakestQuestionType.questionType+' türünde doğruluk '+(weakestQuestionType.accuracy==null?'ölçülemedi':'%'+weakestQuestionType.accuracy)
          +(slowestQuestionType?.avgSeconds?'; en yavaş tür '+slowestQuestionType.questionType+' ('+slowestQuestionType.avgSeconds+' sn/soru)':'')+'.'
        :'Problem tipi ve süre verisi birikiyor.';
      recommendedAction=weakestQuestionType
        ?weakestQuestionType.questionType+' için kısa, süreli ve yanlış-analizli problem seti uygula.'
        :'Soru türü etiketli matematik seti uygula; hız ve doğruluğu birlikte ölç.';
    }else if(family==='TURKISH'){
      primarySignal=weakestQuestionType
        ?weakestQuestionType.questionType+' soru türü öncelikli izleme alanı'
          +(weakestQuestionType.avgSeconds?'; ortalama '+weakestQuestionType.avgSeconds+' sn/soru':'')+'.'
        :'Türkçe soru türü/süre verisi birikiyor.';
      recommendedAction=weakestQuestionType
        ?weakestQuestionType.questionType+' odaklı süreli mini set uygula; tür bazında süreyi yeniden ölç.'
        :'Paragraf/dil bilgisi gibi soru türlerini ayrı etiketleyerek süreli mini set uygula.';
    }else if(family==='HISTORY'){
      primarySignal='Aktif hatırlama: '+activeRecallSessions.length+' oturum / '+activeRecallMinutes+' dk; tekrar başarısı '
        +(reviewSuccess==null?'ölçülmedi':'%'+reviewSuccess)+'.';
      recommendedAction=reviewSuccess!=null&&reviewSuccess<75
        ?'Kaynağı kapatıp aktif hatırlama yap; ardından 0–1–3–7–14–28 tekrar kuyruğuyla kronoloji/kavram kontrolü uygula.'
        :'Aktif hatırlama + kronoloji/kavram bağlantısı + aralıklı tekrar döngüsünü sürdür.';
    }else if(family==='LITERATURE'){
      const weakConnection=literatureDimensions.filter(x=>x.evidence>0).sort((x,y)=>(x.accuracy??101)-(y.accuracy??101))[0];
      primarySignal=weakConnection
        ?weakConnection.dimension+' bağlantısında doğruluk %'+weakConnection.accuracy+' ('+weakConnection.evidence+' soru kanıtı).'
        :'Dönem–yazar–eser bağlantısı için etiketli soru verisi birikiyor.';
      recommendedAction=weakConnection
        ?weakConnection.dimension+' merkezli dönem–yazar–eser eşleştirme ve aktif hatırlama çalışması uygula.'
        :'Dönem, yazar ve eser sorularını ayrı etiketleyip bağlantı haritası + aktif hatırlama uygula.';
    }else if(family==='SCIENCE'){
      primarySignal=misconceptionCandidates[0]
        ?misconceptionCandidates[0].topic+' konusunda doğruluk %'+misconceptionCandidates[0].accuracy+'; kavramsal hata adayı olarak incelenmeli.'
        :weakestTopic
          ?weakestTopic.topic+' konu doğruluğu '+(weakestTopic.accuracy==null?'ölçülemedi':'%'+weakestTopic.accuracy)+'.'
          :'Fen konu verisi birikiyor.';
      recommendedAction=misconceptionCandidates[0]
        ?misconceptionCandidates[0].topic+' için kavram kontrol soruları → yanlış gerekçesi → düzeltici örnek → yeniden test akışı uygula.'
        :'Konu bazlı kavram kontrolü ve yanlış gerekçesi kaydı uygula.';
    }

    return {
      subject,family,metrics,
      accuracy:total?Math.round(correct/total*100):null,
      avgSeconds:avgSeconds?Number(avgSeconds.toFixed(1)):null,
      reviewSuccess,
      questionTypes:qTypes.map(x=>x.questionType),
      questionTypeBreakdown:qTypes,
      topicBreakdown:topics.slice(0,8),
      weakestQuestionType,
      slowestQuestionType,
      weakestTopic,
      activeRecall:{
        sessions:activeRecallSessions.length,
        minutes:activeRecallMinutes,
        evidenceNote:'Yalnız oturum kaydında ders adı açıkça eşleşen Aktif Hatırlama oturumları sayılır.'
      },
      literatureConnections:literatureDimensions,
      misconceptionCandidates,
      errorReasons:errorList,
      errorAnalytics,
      wrongReasonSignal:errorList[0]
        ?subject+' yanlışlarının %'+errorList[0].percent+'’i '+errorList[0].label.toLocaleLowerCase('tr-TR')+'.'
        :errorAnalytics.totalWrong
          ?subject+' yanlışlarının neden sınıflandırması henüz tamamlanmadı.'
          :'Bu ders için yanlış nedeni verisi henüz yok.',
      primarySignal,
      recommendedAction
    };
  });
}

export async function buildTodayLearningPlan(studentId:string,now=new Date()){
  const todayKey=trDateKey(now);
  const today=utcDateFromKey(todayKey);
  const tomorrow=addDays(today,1);
  const [capacity,mastery,student,actions,reviews,incompleteTopics,lastExam]=await Promise.all([
    buildCapacityProfile(studentId,now),
    buildTopicMastery(studentId,now),
    db.student.findUnique({where:{id:studentId},select:{profile:true}}),
    db.coachingAction.findMany({
      where:{studentId,taskDate:{gte:today,lt:tomorrow},status:{in:['ACTIVE','COMPLETED']}},
      include:{submission:true},
      orderBy:{createdAt:'asc'}
    }),
    db.reviewQueueItem.findMany({
      where:{studentId,status:{in:['DUE','PENDING']},dueAt:{lte:now}},
      include:{question:{select:{subject:true,topic:true,prompt:true}}},
      orderBy:{dueAt:'asc'},take:20
    }),
    db.topicProgress.findMany({
      where:{studentId,completed:false},
      select:{id:true,examType:true,subject:true,topic:true,updatedAt:true},
      orderBy:{updatedAt:'asc'},take:60
    }),
    db.examResult.findFirst({where:{studentId},orderBy:{createdAt:'desc'},select:{createdAt:true,examType:true}})
  ]);

  const masteryMap=new Map(mastery.map(x=>[x.subject+'|'+x.topic,x]));
  const items:any[]=[];
  const actionTitleKeys=new Set<string>();

  for(const action of actions){
    const topic=action.topic||'Genel/Karma';
    const m=masteryMap.get((action.subject||action.title)+'|'+topic);
    const done=Boolean(action.submission||action.status==='COMPLETED');
    const titleKey=normalizedPlanText(action.title);
    actionTitleKeys.add(titleKey);
    const item={
      id:'action:'+action.id,
      source:'ACTION' as TodayPlanSource,
      actionId:action.id,
      title:routineDisplayTitle(action.title,action.targetValue),
      subject:action.subject,
      topic:action.topic,
      targetValue:action.targetValue,
      metricType:action.metricType,
      estimatedMinutes:estimatedTaskMinutes({metricType:action.metricType,targetValue:action.targetValue,subject:action.subject}),
      completed:done,
      why:done
        ?'Bugünkü görev tamamlandı.'
        :m?.status==='RISKY'
          ?'Son performans ve tekrar sinyalleri bu görevin bugün yapılmasını destekliyor.'
          :m?.status==='LEARNING'
            ?'Konu öğrenme aşamasında olduğu için bugün kısa ve odaklı uygulama gerekiyor.'
            :'Bugün için atanmış görev.'
    };
    items.push({...item,sequence:todayPlanSequenceRank(item)});
  }

  const profile=record(student?.profile);
  const routines=Array.isArray(profile.dailyRoutines)?profile.dailyRoutines:[];
  for(const raw of routines.slice(0,8)){
    const r=record(raw);
    const title=typeof r.title==='string'?r.title:typeof r.name==='string'?r.name:'Günlük rutin';
    if(actionTitleKeys.has(normalizedPlanText(title)))continue;
    const value=numberValue(r.targetValue)??numberValue(r.count)??1;
    const metricType=typeof r.metricType==='string'?r.metricType:'COUNT';
    const item={
      id:'routine:'+normalizedPlanText(title).replace(/[^A-Z0-9ÇĞİÖŞÜ]+/g,'-')+':'+Math.round(value),
      source:'ROUTINE' as TodayPlanSource,
      title:routineDisplayTitle(title,value),
      subject:typeof r.subject==='string'?r.subject:null,
      topic:typeof r.topic==='string'?r.topic:null,
      targetValue:value,
      metricType,
      estimatedMinutes:estimatedTaskMinutes({metricType,targetValue:value,subject:typeof r.subject==='string'?r.subject:null}),
      completed:false,
      why:'Her gün sürdürülen temel çalışma rutini.'
    };
    items.push({...item,sequence:todayPlanSequenceRank(item)});
  }

  const dayFactor=capacityDayFactor(capacity.lowCompletionDays,now);
  const effectiveDailyBudget=Math.max(30,Math.round(capacity.suggestedDailyMinutes*dayFactor));
  const maxReviews=effectiveDailyBudget>=240?4:effectiveDailyBudget>=150?3:2;
  const reviewBatch=reviews.slice(0,maxReviews);
  if(reviewBatch.length){
    const item={
      id:'review-batch:'+todayKey,
      source:'REVIEW_BATCH' as TodayPlanSource,
      reviewIds:reviewBatch.map(x=>x.id),
      title:reviewBatch.length+' gecikmiş tekrar',
      subject:null,
      topic:null,
      targetValue:reviewBatch.length,
      metricType:'REVIEWS',
      estimatedMinutes:reviewBatch.length*4,
      completed:false,
      why:'Aralıklı tekrar kuyruğunda süresi gelen kayıtlar tek çalışma bloğunda toplandı.'
    };
    items.push({...item,sequence:todayPlanSequenceRank(item)});
  }

  const weakest=mastery.find(x=>x.status==='RISKY'||x.status==='LEARNING'||x.status==='REINFORCING')||mastery[0]||null;
  const focusTopic=
    (weakest?incompleteTopics.find(x=>x.subject===weakest.subject&&x.topic===weakest.topic):null)
    ||(weakest?incompleteTopics.find(x=>x.subject===weakest.subject):null)
    ||incompleteTopics[0]
    ||(weakest?{id:'mastery-focus',examType:lastExam?.examType||'GENEL',subject:weakest.subject,topic:weakest.topic,updatedAt:now}:null);

  if(focusTopic){
    const alreadyHasTopicAction=items.some(x=>x.source==='ACTION'&&!x.completed&&x.subject===focusTopic.subject&&(x.topic||'Genel/Karma')===focusTopic.topic);
    if(!alreadyHasTopicAction){
      const item={
        id:'topic:'+focusTopic.subject+'|'+focusTopic.topic,
        source:'TOPIC' as TodayPlanSource,
        title:focusTopic.subject+' · '+focusTopic.topic+' konu tamamlama',
        subject:focusTopic.subject,
        topic:focusTopic.topic,
        targetValue:Math.min(35,capacity.recommendedFocusBlockMinutes||35),
        metricType:'MINUTES',
        estimatedMinutes:Math.min(35,capacity.recommendedFocusBlockMinutes||35),
        completed:false,
        why:'Tamamlanmamış konu ve geçmiş performans sinyalleri birlikte değerlendirildi.'
      };
      items.push({...item,sequence:todayPlanSequenceRank(item)});
    }

    const matchingMastery=masteryMap.get(focusTopic.subject+'|'+focusTopic.topic)||weakest;
    const questionTarget=dailyPracticeQuestionTarget({
      questionCapacity:capacity.questionCapacity,
      accuracy:matchingMastery?.latestTestAccuracy??matchingMastery?.accuracy??null
    });
    const alreadyHasQuestionAction=items.some(x=>x.source==='ACTION'&&!x.completed&&x.metricType==='QUESTIONS'&&x.subject===focusTopic.subject&&(x.topic||'Genel/Karma')===focusTopic.topic);
    if(!alreadyHasQuestionAction){
      const item={
        id:'practice:'+focusTopic.subject+'|'+focusTopic.topic,
        source:'PRACTICE' as TodayPlanSource,
        title:questionTarget+' soru · '+focusTopic.subject+(focusTopic.topic?' · '+focusTopic.topic:''),
        subject:focusTopic.subject,
        topic:focusTopic.topic,
        targetValue:questionTarget,
        metricType:'QUESTIONS',
        estimatedMinutes:estimatedTaskMinutes({metricType:'QUESTIONS',targetValue:questionTarget,subject:focusTopic.subject}),
        completed:false,
        why:'Konu çalışmasının hemen ardından kısa ölçüm yaparak öğrenme durumunu yeniden görmek için.'
      };
      items.push({...item,sequence:todayPlanSequenceRank(item)});
    }
  }

  const deduped=[...new Map(items.map(item=>[item.id,item])).values()];
  const sorted=deduped.sort((a,b)=>a.sequence-b.sequence||a.estimatedMinutes-b.estimatedMinutes||a.title.localeCompare(b.title,'tr'));
  const budget=effectiveDailyBudget;
  let usedMinutes=0;
  const selected=sorted.map(item=>{
    if(item.completed)return {...item,inTodayPlan:true};
    const core=item.sequence<=30;
    const fits=core||usedMinutes+item.estimatedMinutes<=budget;
    if(fits)usedMinutes+=item.estimatedMinutes;
    return {...item,inTodayPlan:fits};
  });

  if(!selected.some(x=>x.inTodayPlan&&!x.completed)&&weakest){
    const item={
      id:'micro:'+weakest.subject+'|'+weakest.topic,
      source:'MICRO' as TodayPlanSource,
      title:'5 dk tekrar · '+weakest.subject+' · '+weakest.topic,
      subject:weakest.subject,
      topic:weakest.topic,
      targetValue:5,
      metricType:'MINUTES',
      estimatedMinutes:5,
      completed:false,
      sequence:70,
      inTodayPlan:true,
      why:'Bugün için başka aktif görev bulunmadığı için kısa tekrar önerildi.'
    };
    selected.push(item);
    usedMinutes+=5;
  }

  const examGap=lastExam?Math.floor((now.getTime()-lastExam.createdAt.getTime())/86400000):null;
  const notifications:string[]=[];
  if(reviews.length>reviewBatch.length)notifications.push((reviews.length-reviewBatch.length)+' tekrar bugünkü kapasiteyi aşmaması için sonraki plana bırakıldı.');
  if(examGap==null)notifications.push('Henüz deneme kaydı yok.');
  else if(examGap>=7)notifications.push('Deneme kaydı '+examGap+' gündür güncellenmedi.');
  if(capacity.lowCompletionDays.some(x=>x.day===weekdayKey(now)))notifications.push('Bugünkü görev hacmi geçmiş tamamlama davranışına göre sınırlı tutuldu.');
  if(capacity.focusDropAfterMinutes)notifications.push(capacity.focusDropAfterMinutes+' dakikayı aşan gözlemlenmiş oturumlarda doğruluk düşüşü görüldüğü için odak blokları '+capacity.recommendedFocusBlockMinutes+' dk ile sınırlandı.');

  return {
    engineVersion:'TODAY_PLAN_V4_DYNAMIC',
    generatedAt:now.toISOString(),
    date:todayKey,
    capacity,
    plan:selected.filter(x=>x.inTodayPlan).map((x,index)=>({...x,order:index+1})),
    deferred:selected.filter(x=>!x.inTodayPlan&&!x.completed),
    plannedMinutes:usedMinutes,
    masteryFocus:weakest||null,
    notifications,
    explanation:'Günlük sıra; temel rutinler, vadesi gelen tekrarlar, tamamlanmamış konu, ardından performans ölçümü ve kalan görevler olacak şekilde kapasiteye göre oluşturulur.'
  };
}

export type TodayPlanGenerationSource='MORNING_SCHEDULE'|'ON_DEMAND';

type TodayLearningPlan=Awaited<ReturnType<typeof buildTodayLearningPlan>>;

const TODAY_PLAN_SNAPSHOT_ACTION='STUDENT_TODAY_PLAN_SNAPSHOT';
const TODAY_PLAN_SNAPSHOT_ENTITY='StudentDailyPlan';

function todayPlanSnapshotEntityId(studentId:string,dateKey:string){
  return studentId+':'+dateKey;
}

function asTodayLearningPlan(value:unknown):TodayLearningPlan|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const plan=value as Record<string,unknown>;
  if(typeof plan.date!=='string'||!Array.isArray(plan.plan))return null;
  return value as TodayLearningPlan;
}

async function storedTodayLearningPlan(studentId:string,dateKey:string){
  const row=await db.auditLog.findFirst({
    where:{
      action:TODAY_PLAN_SNAPSHOT_ACTION,
      entityType:TODAY_PLAN_SNAPSHOT_ENTITY,
      entityId:todayPlanSnapshotEntityId(studentId,dateKey)
    },
    orderBy:{createdAt:'desc'},
    select:{metadata:true}
  });
  const meta=record(row?.metadata);
  return asTodayLearningPlan(meta.plan);
}

async function hydrateTodayPlanCompletion(studentId:string,stored:TodayLearningPlan){
  const today=utcDateFromKey(stored.date);
  const tomorrow=addDays(today,1);
  const actionIds=stored.plan.map((x:any)=>x.actionId).filter((x:any):x is string=>typeof x==='string');
  const reviewIds=stored.plan.flatMap((x:any)=>Array.isArray(x.reviewIds)?x.reviewIds:[]).filter((x:any):x is string=>typeof x==='string');
  const topicPairs=stored.plan
    .filter((x:any)=>x.source==='TOPIC'&&typeof x.subject==='string'&&typeof x.topic==='string')
    .map((x:any)=>({subject:x.subject as string,topic:x.topic as string}));

  const [actions,reviews,topics,practice]=await Promise.all([
    actionIds.length?db.coachingAction.findMany({
      where:{studentId,id:{in:actionIds}},
      select:{id:true,status:true,submission:{select:{id:true}}}
    }):Promise.resolve([]),
    reviewIds.length?db.reviewQueueItem.findMany({
      where:{studentId,id:{in:reviewIds}},
      select:{id:true,status:true}
    }):Promise.resolve([]),
    topicPairs.length?db.topicProgress.findMany({
      where:{studentId,OR:topicPairs.map(x=>({subject:x.subject,topic:x.topic}))},
      select:{subject:true,topic:true,completed:true}
    }):Promise.resolve([]),
    db.practiceLog.findMany({
      where:{studentId,date:{gte:today,lt:tomorrow}},
      select:{subject:true,topic:true,total:true}
    })
  ]);

  const completedActions=new Set(actions.filter(x=>x.status==='COMPLETED'||Boolean(x.submission)).map(x=>x.id));
  const reviewStatus=new Map(reviews.map(x=>[x.id,x.status]));
  const completedTopics=new Set(topics.filter(x=>x.completed).map(x=>x.subject+'|'+x.topic));
  const practiceTotals=new Map<string,number>();
  for(const row of practice){
    const key=row.subject+'|'+(row.topic||'Genel/Karma');
    practiceTotals.set(key,(practiceTotals.get(key)||0)+row.total);
  }

  const plan=stored.plan.map((raw:any)=>{
    const item={...raw};
    if(item.source==='ACTION'&&typeof item.actionId==='string'){
      item.completed=completedActions.has(item.actionId);
    }else if(item.source==='REVIEW_BATCH'&&Array.isArray(item.reviewIds)){
      const remaining=item.reviewIds.filter((id:string)=>reviewStatus.get(id)!=='COMPLETED');
      item.completed=remaining.length===0;
      item.targetValue=remaining.length;
      item.title=remaining.length?remaining.length+' gecikmiş tekrar':'Tekrarlar tamamlandı';
    }else if(item.source==='TOPIC'&&typeof item.subject==='string'&&typeof item.topic==='string'){
      item.completed=completedTopics.has(item.subject+'|'+item.topic);
    }else if(item.source==='PRACTICE'&&typeof item.subject==='string'){
      const key=item.subject+'|'+(item.topic||'Genel/Karma');
      item.completed=(practiceTotals.get(key)||0)>=Number(item.targetValue||0);
    }
    return item;
  });

  return {...stored,plan};
}

export async function saveTodayLearningPlanSnapshot(
  studentId:string,
  now=new Date(),
  generationSource:TodayPlanGenerationSource='ON_DEMAND'
){
  const plan=await buildTodayLearningPlan(studentId,now);
  await db.auditLog.create({data:{
    action:TODAY_PLAN_SNAPSHOT_ACTION,
    entityType:TODAY_PLAN_SNAPSHOT_ENTITY,
    entityId:todayPlanSnapshotEntityId(studentId,plan.date),
    summary:'Öğrencinin günlük görev sırası oluşturuldu.',
    metadata:{
      dateKey:plan.date,
      engineVersion:plan.engineVersion,
      generationSource,
      plan:plan as any
    }
  }});
  return plan;
}

export async function ensureTodayLearningPlan(
  studentId:string,
  now=new Date(),
  generationSource:TodayPlanGenerationSource='ON_DEMAND'
){
  const dateKey=trDateKey(now);
  const stored=await storedTodayLearningPlan(studentId,dateKey);
  if(stored)return hydrateTodayPlanCompletion(studentId,stored);
  const created=await saveTodayLearningPlanSnapshot(studentId,now,generationSource);
  return hydrateTodayPlanCompletion(studentId,created);
}

export async function readTodayLearningPlan(studentId:string,now=new Date()){
  const stored=await storedTodayLearningPlan(studentId,trDateKey(now));
  return stored?hydrateTodayPlanCompletion(studentId,stored):null;
}

export async function generateMorningTodayPlans(now=new Date()){
  const students=await db.student.findMany({
    select:{id:true,studentCode:true,user:{select:{status:true}}}
  });
  const active=students.filter(x=>!x.user||x.user.status==='ACTIVE');
  const rollout=await Promise.all(active.map(async student=>({
    student,
    enabled:await isFeatureEnabled('TODAY_PLAN',student.studentCode)
  })));
  const eligible=rollout.filter(x=>x.enabled).map(x=>x.student);
  let generated=0;
  let failed=0;
  let rebalancedStudents=0;
  let redistributedTasks=0;
  let deferredTasks=0;

  for(let offset=0;offset<eligible.length;offset+=5){
    const chunk=eligible.slice(offset,offset+5);
    const results=await Promise.allSettled(
      chunk.map(async student=>{
        const rebalance=await rebalanceMissedTasksCapacityAware(student.id,now);
        const today=await ensureTodayLearningPlan(student.id,now,'MORNING_SCHEDULE');
        return {rebalance,today};
      })
    );
    for(const result of results){
      if(result.status==='fulfilled'){
        generated++;
        if(result.value.rebalance.created.length)rebalancedStudents++;
        redistributedTasks+=result.value.rebalance.created.length;
        deferredTasks+=result.value.rebalance.deferred.length;
      }else failed++;
    }
  }

  return {
    date:trDateKey(now),
    generated,
    failed,
    skipped:students.length-eligible.length,
    featureDisabled:active.length-eligible.length,
    rebalancedStudents,
    redistributedTasks,
    deferredTasks,
    engineVersion:'TODAY_PLAN_V4_DYNAMIC'
  };
}

export type AdaptiveReviewInput={
  nextStep:number;
  correct:boolean;
  previousCorrect:boolean|null;
  correctStreak?:number;
  incorrectStreak?:number;
  recentAccuracy?:number|null;
  masteryScore?:number|null;
};

export function adaptiveReviewIntervalDays(input:AdaptiveReviewInput){
  const base=[0,1,3,7,14,28];
  const step=clamp(input.nextStep,0,base.length-1);
  const baseline=base[step];
  const correctStreak=Math.max(0,input.correctStreak||0);
  const incorrectStreak=Math.max(0,input.incorrectStreak||0);
  const recentAccuracy=input.recentAccuracy==null?null:clamp(input.recentAccuracy,0,100);
  const mastery=input.masteryScore==null?null:clamp(input.masteryScore,0,100);

  if(!input.correct){
    if(incorrectStreak>=2)return 1;
    if(baseline>=7)return 3;
    if(baseline>=3)return 1;
    return 0;
  }

  let interval=baseline;

  // Öğrenci aynı bilgiye art arda doğru erişebiliyorsa unutma eğrisini genişlet.
  if(correctStreak>=3){
    if(baseline===7)interval=14;
    else if(baseline===14)interval=28;
    else if(baseline>=28)interval=45;
    else interval=Math.max(interval,base[Math.min(step+1,base.length-1)]);
  }else if(correctStreak>=2&&baseline>=7){
    interval=Math.round(baseline*1.5);
  }

  // Son performans yüksekse aralığı kontrollü biçimde biraz daha aç.
  if(recentAccuracy!=null&&recentAccuracy>=90&&correctStreak>=2)interval=Math.round(interval*1.2);
  if(mastery!=null&&mastery>=85&&correctStreak>=2)interval=Math.round(interval*1.15);

  // Doğru yanıt gelse bile genel tekrar başarısı zayıfsa aşırı açılmayı engelle.
  if(recentAccuracy!=null&&recentAccuracy<65)interval=Math.min(interval,Math.max(1,baseline));
  if(input.previousCorrect===false&&correctStreak<=1)interval=Math.min(interval,Math.max(1,baseline));

  return Math.round(clamp(interval,0,60));
}

export function reviewIntervalReason(input:AdaptiveReviewInput,intervalDays:number){
  if(!input.correct){
    if((input.incorrectStreak||0)>=2)return 'Aynı bilgi tekrar yanlışlandığı için aralık 1 güne çekildi.';
    if(intervalDays<=3)return 'Yanlış cevap unutma riskini yükselttiği için tekrar daha yakın tarihe çekildi.';
    return 'Yanlış cevap nedeniyle tekrar aralığı kısaltıldı.';
  }
  if((input.correctStreak||0)>=3)return 'Üç veya daha fazla ardışık doğru nedeniyle tekrar aralığı kişiye özel olarak uzatıldı.';
  if((input.correctStreak||0)>=2)return 'Ardışık doğru performansı nedeniyle tekrar aralığı kontrollü biçimde uzatıldı.';
  return 'Başlangıç tekrar eğrisi korunarak bir sonraki tekrar planlandı.';
}

export type CarryoverDayCapacity={
  date:Date;
  dailyBudgetMinutes:number;
  existingLoadMinutes:number;
  completionRate:number|null;
};

export function allocateCarryoverCapacityAware(input:{
  remaining:number;
  unitMinutes:number;
  days:CarryoverDayCapacity[];
  maxCarryoverShare?:number;
}){
  const share=clamp(input.maxCarryoverShare??0.25,0.1,0.5);
  let left=Math.max(0,input.remaining);
  const allocations:{date:Date;value:number;minutes:number}[]=[];

  for(const day of input.days){
    if(left<=0)break;
    const behaviorFactor=day.completionRate!=null&&day.completionRate<60?.7:1;
    const effectiveBudget=Math.max(0,Math.round(day.dailyBudgetMinutes*behaviorFactor));
    const freeMinutes=Math.max(0,effectiveBudget-day.existingLoadMinutes);
    const carryoverMinutes=Math.min(
      freeMinutes,
      Math.max(input.unitMinutes,Math.floor(effectiveBudget*share))
    );
    const units=Math.floor(carryoverMinutes/input.unitMinutes);
    if(units<=0)continue;
    const value=Math.min(left,units);
    const minutes=Math.ceil(value*input.unitMinutes);
    allocations.push({date:day.date,value,minutes});
    left-=value;
    day.existingLoadMinutes+=minutes;
  }

  return {allocations,unallocated:left};
}

export async function rebalanceMissedTasksCapacityAware(studentId:string,now=new Date()){
  const today=utcDateFromKey(trDateKey(now));
  const capacity=await buildCapacityProfile(studentId,now);
  const horizonDays=14;
  const horizonEnd=addDays(today,horizonDays);
  const [missed,scheduled]=await Promise.all([
    db.coachingAction.findMany({
      where:{studentId,status:'ACTIVE',taskDate:{not:null,lt:today},submission:null,rescheduleSource:null},
      orderBy:{taskDate:'asc'},take:20
    }),
    db.coachingAction.findMany({
      where:{studentId,status:'ACTIVE',taskDate:{gte:today,lt:horizonEnd}},
      select:{taskDate:true,targetValue:true,metricType:true,subject:true}
    })
  ]);

  const loadByDay=new Map<string,number>();
  for(const action of scheduled){
    if(!action.taskDate)continue;
    const key=trDateKey(action.taskDate);
    loadByDay.set(key,(loadByDay.get(key)||0)+estimatedTaskMinutes(action));
  }

  const lowDays=new Map(capacity.lowCompletionDays.map(x=>[x.day,x.completionRate]));
  const created:any[]=[];
  const deferred:any[]=[];

  for(const action of missed){
    const remaining=Math.max(0,Number(action.targetValue)-Number(action.currentValue));
    if(remaining<=0)continue;
    const unitMinutes=action.metricType==='MINUTES'?1:
      action.metricType==='QUESTIONS'?minutesPerQuestion(action.subject||''):5;

    const days:CarryoverDayCapacity[]=Array.from({length:horizonDays},(_,offset)=>{
      const date=addDays(today,offset);
      const key=trDateKey(date);
      return {
        date,
        dailyBudgetMinutes:capacity.suggestedDailyMinutes,
        existingLoadMinutes:loadByDay.get(key)||0,
        completionRate:lowDays.get(weekdayKey(date))??null
      };
    });

    const distribution=allocateCarryoverCapacityAware({
      remaining,
      unitMinutes,
      days,
      maxCarryoverShare:.25
    });

    if(distribution.unallocated>0){
      deferred.push({
        sourceActionId:action.id,
        remaining,
        unallocated:distribution.unallocated,
        reason:'Önümüzdeki 14 günde öğrencinin güvenli günlük kapasitesi içinde yeterli alan bulunamadı; görev yığılmadan sonraki yeniden dengelemede tekrar değerlendirilecek.'
      });
      continue;
    }

    for(const day of days){
      loadByDay.set(trDateKey(day.date),day.existingLoadMinutes);
    }

    const allocations=distribution.allocations;
    const made=await db.$transaction(async tx=>{
      const ids:string[]=[];
      for(const allocation of allocations){
        const periodEnd=addDays(allocation.date,1);
        const row=await tx.coachingAction.create({data:{
          studentId,
          createdByUserId:action.createdByUserId,
          title:action.title+' · Telafi',
          description:(action.description?action.description+' · ':'')+'Kaçırılan görev, öğrencinin gözlenen günlük kapasitesine göre haftaya dengeli biçimde yeniden dağıtıldı.',
          metricType:action.metricType,
          targetValue:allocation.value,
          currentValue:0,
          cadence:'DAILY',
          periodStart:allocation.date,
          periodEnd,
          status:'ACTIVE',
          subject:action.subject,
          topic:action.topic,
          taskDate:allocation.date,
          planSource:'CAPACITY_AWARE_RESCHEDULE'
        }});
        ids.push(row.id);
      }
      await tx.coachingAction.update({where:{id:action.id},data:{status:'RESCHEDULED'}});
      await tx.taskReschedule.create({data:{
        studentId,
        sourceActionId:action.id,
        createdActionId:ids[0]||null,
        createdActionIds:ids as any,
        originalDate:action.taskDate||action.periodEnd,
        newDate:allocations[0]?.date||today,
        movedTarget:remaining,
        reason:'CAPACITY_AWARE_MISSED'
      }});
      return ids;
    });

    created.push({
      sourceActionId:action.id,
      createdActionIds:made,
      movedTarget:remaining,
      allocations:allocations.map(x=>({date:x.date,value:x.value,minutes:x.minutes}))
    });
  }

  return {
    created,
    deferred,
    capacity,
    policy:{
      horizonDays,
      maxCarryoverShare:.25,
      rule:'Kaçırılan görev tek güne yığılmaz; her gün için gözlenen kapasitenin en fazla dörtte biri telafi yüküne ayrılır.'
    }
  };
}

export async function buildCoachMorningBrief(coachId:string,now=new Date()){
  const sevenDaysAgo=new Date(now.getTime()-7*86400000);
  const fourteenDaysAgo=new Date(now.getTime()-14*86400000);
  const students=await db.student.findMany({
    where:{coachId},
    select:{
      id:true,fullName:true,studentCode:true,
      coachingActions:{where:{status:'ACTIVE'},select:{periodEnd:true,taskDate:true,submission:{select:{id:true}}}},
      reviewQueue:{where:{status:{in:['DUE','PENDING']},dueAt:{lte:now}},select:{id:true}},
      practiceLogs:{where:{date:{gte:fourteenDaysAgo}},select:{date:true,total:true,correct:true,subject:true}},
      examResults:{orderBy:{createdAt:'desc'},take:1,select:{createdAt:true,examType:true}}
    }
  });

  const items=students.map(student=>{
    const current=student.practiceLogs.filter(x=>x.date>=sevenDaysAgo);
    const previous=student.practiceLogs.filter(x=>x.date<sevenDaysAgo);
    const acc=(rows:typeof current)=>{
      const total=rows.reduce((n,x)=>n+x.total,0);
      return total?Math.round(rows.reduce((n,x)=>n+x.correct,0)/total*100):null;
    };
    const currentAccuracy=acc(current),previousAccuracy=acc(previous);
    const accuracyDelta=currentAccuracy!=null&&previousAccuracy!=null?currentAccuracy-previousAccuracy:null;
    const overdue=student.coachingActions.filter(x=>x.periodEnd<now&&!x.submission).length;
    const dueReviews=student.reviewQueue.length;
    const examGap=student.examResults[0]?Math.floor((now.getTime()-student.examResults[0].createdAt.getTime())/86400000):null;
    const signals:string[]=[];
    if(overdue)signals.push(overdue+' görev gecikti');
    if(dueReviews)signals.push(dueReviews+' tekrar bugün/gecikmiş durumda');
    if(accuracyDelta!=null&&accuracyDelta<=-10)signals.push('Son 7 gün doğruluğu önceki haftaya göre '+Math.abs(accuracyDelta)+' puan düştü');
    if(examGap==null)signals.push('Henüz deneme kaydı yok');
    else if(examGap>=7)signals.push(examGap+' gündür deneme girilmedi');
    const needsAction=overdue>=2||dueReviews>=3||(accuracyDelta!=null&&accuracyDelta<=-10)||examGap==null||(examGap!=null&&examGap>=7);
    const suggestedAction=overdue>=2
      ?'Görev hacmini ve kapasite profilini gözden geçir; 15 dakikalık takip görüşmesi planla.'
      :dueReviews>=3
        ?'Bugünkü tekrarları önceliklendir ve yanlış nedenini kontrol et.'
        :accuracyDelta!=null&&accuracyDelta<=-10
          ?'Gerileyen ders/konu için son iki haftanın yanlış nedenlerini incele.'
          :'Deneme tarihi ve bir sonraki ölçüm noktasını belirle.';
    return {
      studentId:student.id,studentName:student.fullName,studentCode:student.studentCode,
      needsAction,signals,suggestedAction,currentAccuracy,accuracyDelta,overdue,dueReviews,examGap
    };
  }).filter(x=>x.needsAction);

  const cohortGroups={
    mostOverdue:[...items].filter(x=>x.overdue>0||x.dueReviews>0).sort((a,b)=>(b.overdue+b.dueReviews)-(a.overdue+a.dueReviews)).slice(0,5),
    accuracyDecline:[...items].filter(x=>x.accuracyDelta!=null&&x.accuracyDelta<0).sort((a,b)=>(a.accuracyDelta||0)-(b.accuracyDelta||0)).slice(0,5),
    examFollowUp:[...items].filter(x=>x.examGap==null||(x.examGap!=null&&x.examGap>=7)).slice(0,5),
    needsMeeting:[...items].filter(x=>x.overdue>=2||x.dueReviews>=3).slice(0,5)
  };
  return {
    generatedAt:now.toISOString(),
    interventionCount:items.length,
    cohortGroups,
    summary:items.length
      ?'Bugün '+items.length+' öğrenci somut takip sinyali nedeniyle müdahale gerektiriyor.'
      :'Bugün acil müdahale gerektiren öğrenci sinyali oluşmadı.',
    students:items.sort((a,b)=>(b.overdue+b.dueReviews)-(a.overdue+a.dueReviews)),
    coachQuality:await buildCoachOperationalQuality(coachId,now)
  };
}

export async function buildInterventionImpact(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-180*86400000);
  const actions=await db.coachingAction.findMany({
    where:{studentId,status:{in:['COMPLETED','RESCHEDULED']},updatedAt:{gte:since},subject:{not:null}},
    select:{id:true,title:true,subject:true,topic:true,updatedAt:true,planSource:true},
    orderBy:{updatedAt:'desc'},take:20
  });
  const results:any[]=[];
  for(const action of actions){
    const beforeStart=new Date(action.updatedAt.getTime()-21*86400000);
    const afterEnd=new Date(action.updatedAt.getTime()+21*86400000);
    const rows=await db.practiceLog.findMany({
      where:{studentId,subject:action.subject||undefined,date:{gte:beforeStart,lte:afterEnd}},
      select:{date:true,total:true,correct:true,blank:true}
    });
    const summarize=(part:typeof rows)=>{
      const total=part.reduce((n,x)=>n+x.total,0);
      return {
        questions:total,
        accuracy:total?Math.round(part.reduce((n,x)=>n+x.correct,0)/total*100):null,
        blank:part.reduce((n,x)=>n+x.blank,0)
      };
    };
    const before=summarize(rows.filter(x=>x.date<action.updatedAt));
    const after=summarize(rows.filter(x=>x.date>=action.updatedAt));
    if(before.questions<10||after.questions<10)continue;
    results.push({
      actionId:action.id,title:action.title,subject:action.subject,topic:action.topic,at:action.updatedAt,
      before,after,
      accuracyDelta:before.accuracy!=null&&after.accuracy!=null?after.accuracy-before.accuracy:null,
      blankDelta:after.blank-before.blank,
      interpretation:'Gözlemsel ilişki; nedensellik kanıtı değildir.'
    });
  }
  return results;
}

export async function buildGoalDistance(studentId:string,now=new Date()){
  const [target,latestExam,mastery]=await Promise.all([
    db.studentTarget.findFirst({where:{studentId,active:true},orderBy:{createdAt:'desc'}}),
    db.examResult.findFirst({where:{studentId},orderBy:{createdAt:'desc'}}),
    buildTopicMastery(studentId,now)
  ]);
  if(!target)return null;
  const payload=record(latestExam?.payload);
  const current=numberValue(payload.net)??numberValue(payload.score);
  const targetValue=target.score??target.officialMinScore??target.officialEligibilityScore??null;
  const gap=current!=null&&targetValue!=null?Number((targetValue-current).toFixed(2)):null;
  const contribution=mastery
    .filter(x=>x.status==='RISKY'||x.status==='LEARNING'||x.status==='REINFORCING')
    .slice(0,3)
    .map(x=>({subject:x.subject,topic:x.topic,masteryStatus:x.status,accuracy:x.accuracy}));
  return {
    target:target.departmentName?target.institutionName+' · '+target.departmentName:target.institutionName,
    examLevel:target.examLevel,
    currentPerformance:current,
    targetValue,
    gap,
    estimatedOpenTopics:mastery.filter(x=>x.status!=='DURABLE').length,
    highestContributionAreas:contribution,
    note:'Bu ekran kazanma/kazanamama tahmini üretmez; yalnız mevcut veri ile hedef arasındaki operasyonel farkı gösterir.'
  };
}

export async function buildPlanSimulation(studentId:string,input:{dailyMinutes:number;studyDaysPerWeek:number;examsPerWeek:number}){
  const [capacity,mastery]=await Promise.all([buildCapacityProfile(studentId),buildTopicMastery(studentId)]);
  const dailyMinutes=clamp(Math.round(input.dailyMinutes),30,480);
  const studyDays=clamp(Math.round(input.studyDaysPerWeek),1,7);
  const exams=clamp(Math.round(input.examsPerWeek),0,4);
  const examReserve=exams*120;
  const weeklyMinutes=Math.max(0,dailyMinutes*studyDays-examReserve);
  const priority=mastery.filter(x=>x.status!=='DURABLE').slice(0,8);
  const perTopic=priority.length?Math.max(20,Math.floor(weeklyMinutes/priority.length)):0;
  return {
    assumptions:{dailyMinutes,studyDaysPerWeek:studyDays,examsPerWeek:exams},
    observedCapacity:capacity,
    weeklyAvailableMinutes:weeklyMinutes,
    examReserveMinutes:examReserve,
    scenario:priority.map(x=>({
      subject:x.subject,topic:x.topic,status:x.status,
      suggestedMinutes:perTopic,
      reason:x.status==='RISKY'?'Riskli konu önce ele alınır.':x.status==='LEARNING'?'Öğrenme süreci tamamlanmamış.':'Pekiştirme gerektiriyor.'
    })),
    note:'Simülasyon planı otomatik uygulamaz; koça seçenek ve kapasite etkisi gösterir.'
  };
}

export async function buildStudentTimeline(studentId:string){
  const [student,assessments,plans,exams,sessions,reflections]=await Promise.all([
    db.student.findUnique({where:{id:studentId},select:{createdAt:true,goal:true}}),
    db.assessment.findMany({where:{studentId},orderBy:{completedAt:'asc'},select:{id:true,completedAt:true}}),
    db.studyPlan.findMany({where:{studentId},orderBy:{createdAt:'asc'},select:{id:true,title:true,createdAt:true}}),
    db.examResult.findMany({where:{studentId},orderBy:{createdAt:'asc'},select:{id:true,examType:true,createdAt:true}}),
    db.coachingSession.findMany({where:{studentId},orderBy:{startsAt:'asc'},select:{id:true,title:true,startsAt:true,status:true}}),
    db.weeklyReflection.findMany({where:{studentId},orderBy:{weekStart:'asc'},select:{id:true,weekStart:true}})
  ]);
  const events:any[]=[];
  if(student)events.push({type:'REGISTRATION',at:student.createdAt,title:'KEKS kaydı oluşturuldu'});
  for(const x of assessments)events.push({type:'ASSESSMENT',at:x.completedAt,title:'Eğitsel değerlendirme tamamlandı'});
  for(const x of plans)events.push({type:'PLAN',at:x.createdAt,title:'Plan oluşturuldu · '+x.title});
  for(const x of exams)events.push({type:'EXAM',at:x.createdAt,title:'Deneme kaydı · '+x.examType});
  for(const x of sessions)events.push({type:'SESSION',at:x.startsAt,title:'Koç görüşmesi · '+x.title,status:x.status});
  for(const x of reflections)events.push({type:'REFLECTION',at:x.weekStart,title:'Haftalık öz değerlendirme'});
  return events.sort((a,b)=>new Date(a.at).getTime()-new Date(b.at).getTime());
}


export async function buildExamKnowledgeMap(studentId:string){
  const [progress,analytics]=await Promise.all([
    db.topicProgress.findMany({
      where:{studentId},
      select:{examType:true,subject:true,topic:true,completed:true,updatedAt:true}
    }),
    db.examAnalyticsRecord.findMany({
      where:{studentId},
      select:{examType:true,subject:true,topic:true,questionType:true,correct:true,wrong:true,blank:true,avgSeconds:true,examDate:true},
      orderBy:{examDate:'desc'},take:1000
    })
  ]);
  type TopicNode={topic:string;completed:boolean;questionTypes:Set<string>;correct:number;total:number;avgSeconds:number[];lastAt:Date|null};
  const exams=new Map<string,Map<string,Map<string,TopicNode>>>();
  const ensure=(examType:string,subject:string,topic:string)=>{
    let subjects=exams.get(examType);if(!subjects){subjects=new Map();exams.set(examType,subjects)}
    let topics=subjects.get(subject);if(!topics){topics=new Map();subjects.set(subject,topics)}
    let node=topics.get(topic);
    if(!node){node={topic,completed:false,questionTypes:new Set(),correct:0,total:0,avgSeconds:[],lastAt:null};topics.set(topic,node)}
    return node;
  };
  for(const row of progress){
    const node=ensure(row.examType,row.subject,row.topic);
    node.completed=row.completed;
    if(!node.lastAt||row.updatedAt>node.lastAt)node.lastAt=row.updatedAt;
  }
  for(const row of analytics){
    const node=ensure(row.examType,row.subject,row.topic);
    node.questionTypes.add(row.questionType||'GENEL');
    const total=row.correct+row.wrong+row.blank;
    node.correct+=row.correct;node.total+=total;
    if(row.avgSeconds&&row.avgSeconds>0)node.avgSeconds.push(row.avgSeconds);
    if(!node.lastAt||row.examDate>node.lastAt)node.lastAt=row.examDate;
  }
  return [...exams.entries()].map(([examType,subjects])=>({
    examType,
    subjects:[...subjects.entries()].map(([subject,topics])=>({
      subject,
      topics:[...topics.values()].map(node=>({
        topic:node.topic,
        completed:node.completed,
        accuracy:node.total?Math.round(node.correct/node.total*100):null,
        avgSeconds:node.avgSeconds.length?Number(average(node.avgSeconds).toFixed(1)):null,
        questionTypes:[...node.questionTypes],
        lastEvidenceAt:node.lastAt
      }))
    }))
  }));
}

export async function buildCoachStudentAlignmentSignals(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-42*86400000);
  const [actions,sessions]=await Promise.all([
    db.coachingAction.findMany({
      where:{studentId,createdAt:{gte:since}},
      select:{status:true,planSource:true,taskDate:true,periodEnd:true,submission:{select:{id:true,submittedAt:true,completionRate:true}}}
    }),
    db.coachingSession.findMany({
      where:{studentId,startsAt:{gte:since}},
      select:{status:true,startsAt:true,completedAt:true,nextStep:true}
    })
  ]);
  const assigned=actions.length;
  const completed=actions.filter(x=>x.submission||x.status==='COMPLETED').length;
  const rescheduled=actions.filter(x=>x.status==='RESCHEDULED'||x.planSource==='CAPACITY_AWARE_RESCHEDULE').length;
  const followThrough=assigned?Math.round(completed/assigned*100):null;
  const held=sessions.filter(x=>x.status==='COMPLETED').length;
  const scheduledPast=sessions.filter(x=>x.startsAt<=now).length;
  const sessionContinuity=scheduledPast?Math.round(held/scheduledPast*100):null;
  const nextStepSessions=sessions.filter(x=>x.status==='COMPLETED'&&x.nextStep).length;
  const signals:string[]=[];
  if(followThrough!=null)signals.push('Koçun önerdiği yakın dönem görevlerin uygulanma oranı %'+followThrough+'.');
  if(rescheduled)signals.push(rescheduled+' görev kapasite/kaçırma nedeniyle yeniden planlandı.');
  if(sessionContinuity!=null)signals.push('Planlanan geçmiş görüşmelerin tamamlanma oranı %'+sessionContinuity+'.');
  if(held)signals.push(held+' tamamlanan görüşmenin '+nextStepSessions+' tanesinde sonraki adım kaydı var.');
  return {assignedTasks:assigned,completedTasks:completed,followThrough,rescheduledTasks:rescheduled,sessionContinuity,completedSessions:held,signals};
}


export async function buildCoachOperationalQuality(coachId:string,now=new Date()){
  const since=new Date(now.getTime()-30*86400000);
  const [sessions,tasks,students]=await Promise.all([
    db.coachingSession.findMany({
      where:{coachId,startsAt:{gte:since}},
      select:{
        id:true,status:true,startsAt:true,completedAt:true,nextStep:true,
        actions:{select:{id:true}}
      }
    }),
    db.coachTask.findMany({
      where:{coachId,createdAt:{gte:since}},
      select:{status:true,dueAt:true,createdAt:true,completedAt:true}
    }),
    db.student.findMany({
      where:{coachId},
      select:{
        id:true,
        coachAlerts:{where:{resolved:false,severity:'HIGH'},select:{id:true}}
      }
    })
  ]);
  const past=sessions.filter(x=>x.startsAt<=now);
  const completed=past.filter(x=>x.status==='COMPLETED');
  const withNextStep=completed.filter(x=>Boolean(x.nextStep)).length;
  const withAction=completed.filter(x=>x.actions.length>0).length;
  const overdueTasks=tasks.filter(x=>x.status==='OPEN'&&x.dueAt&&x.dueAt<now).length;
  const completedTasks=tasks.filter(x=>x.status==='COMPLETED').length;
  const openHighSignals=students.reduce((n,x)=>n+x.coachAlerts.length,0);
  const upcoming=sessions.filter(x=>x.status==='SCHEDULED'&&x.startsAt>now).length;

  const signals:string[]=[];
  signals.push('Son 30 günde '+completed.length+'/'+past.length+' geçmiş görüşme tamamlandı.');
  if(completed.length)signals.push(completed.length+' tamamlanan görüşmenin '+withNextStep+' tanesinde somut sonraki adım kaydı var.');
  if(completed.length)signals.push(completed.length+' tamamlanan görüşmenin '+withAction+' tanesinde bağlı koçluk aksiyonu oluşturuldu.');
  if(overdueTasks)signals.push(overdueTasks+' koç takip görevinin vadesi geçti.');
  if(openHighSignals)signals.push(openHighSignals+' açık yüksek öncelikli öğrenci sinyali takip bekliyor.');

  return {
    windowDays:30,
    pastSessions:past.length,
    completedSessions:completed.length,
    sessionsWithNextStep:withNextStep,
    sessionsWithActions:withAction,
    completedCoachTasks:completedTasks,
    overdueCoachTasks:overdueTasks,
    openHighStudentSignals:openHighSignals,
    upcomingSessions:upcoming,
    signals,
    note:'Bu göstergeler koçu sıralamak veya etiketlemek için değil, takip sürecindeki operasyonel boşlukları görünür kılmak için kullanılır.'
  };
}
