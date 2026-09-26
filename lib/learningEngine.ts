import { db } from '@/lib/db';

export type MasteryStatus='NEW'|'LEARNING'|'REINFORCING'|'DURABLE'|'RISKY';

export const ERROR_REASON_LABELS={
  BILGI_EKSIKLIGI:'Bilgi eksikliği',
  ISLEM_HATASI:'İşlem hatası',
  DIKKAT:'Dikkat',
  SORU_KOKU:'Soru kökünü yanlış okuma',
  SURE:'Süre',
  YONTEM_BILMEME:'Yöntem bilmeme',
  UNUTMA:'Unutma',
  SORUYU_ANLAMA:'Soruyu anlama',
  STRATEJI:'Strateji',
  DIGER:'Diğer'
} as const;

type ErrorReasonKey=keyof typeof ERROR_REASON_LABELS;

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

function normalizedReason(value:string|null|undefined):ErrorReasonKey|null{
  if(!value)return null;
  if(value in ERROR_REASON_LABELS)return value as ErrorReasonKey;
  if(value==='SORUYU_ANLAMA')return 'SORUYU_ANLAMA';
  if(value==='STRATEJI')return 'STRATEJI';
  return 'DIGER';
}

export async function buildCapacityProfile(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-35*86400000);
  const [student,sessions,submissions,actions]=await Promise.all([
    db.student.findUnique({where:{id:studentId},select:{profile:true}}),
    db.techniquePracticeSession.findMany({
      where:{studentId,createdAt:{gte:since}},
      select:{startedAt:true,activeSeconds:true,durationMinutes:true,completed:true},
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
  const hourMinutes=new Map<number,number>();
  for(const session of sessions){
    const key=trDateKey(session.startedAt);
    const minutes=Math.max(0,(session.activeSeconds||0)/60);
    minutesByDay.set(key,(minutesByDay.get(key)||0)+minutes);
    const h=localHour(session.startedAt);
    hourMinutes.set(h,(hourMinutes.get(h)||0)+minutes);
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

  let bestStartHour:number|null=null;
  let bestWindowMinutes=0;
  for(let h=0;h<24;h++){
    const total=(hourMinutes.get(h)||0)+(hourMinutes.get((h+1)%24)||0);
    if(total>bestWindowMinutes){bestWindowMinutes=total;bestStartHour=h}
  }
  const bestWindow=bestStartHour==null?null:
    String(bestStartHour).padStart(2,'0')+'.00–'+String((bestStartHour+2)%24).padStart(2,'0')+'.00';

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

  return {
    plannedMinutes,
    actualAverageMinutes:actualAverageMinutes||null,
    suggestedDailyMinutes,
    questionCapacity:questionCapacity||null,
    bestWindow,
    lowCompletionDays,
    evidenceDays,
    confidence:evidenceDays>=14?'HIGH':evidenceDays>=7?'MEDIUM':'LOW',
    note:evidenceDays<7
      ?'Kapasite profili henüz düşük veriyle oluşturuluyor; yeni kayıtlarla otomatik güncellenir.'
      :'Program önerisi beyan edilen süreden çok gözlenen davranışa dayanır.'
  };
}

export async function buildTopicMastery(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-90*86400000);
  const [practice,reviews]=await Promise.all([
    db.practiceLog.findMany({
      where:{studentId,date:{gte:since}},
      select:{subject:true,topic:true,total:true,correct:true,wrong:true,blank:true,errorReason:true,date:true},
      orderBy:{date:'asc'}
    }),
    db.reviewQueueItem.findMany({
      where:{studentId,updatedAt:{gte:since}},
      include:{question:{select:{subject:true,topic:true}}},
      orderBy:{updatedAt:'asc'}
    })
  ]);

  type Bucket={
    subject:string;topic:string;total:number;correct:number;wrong:number;blank:number;
    attempts:number;lastAt:Date|null;reviewTotal:number;reviewCorrect:number;overdueReviews:number;
    reasons:Record<string,number>;
  };
  const map=new Map<string,Bucket>();
  const ensure=(subject:string,topic:string)=>{
    const key=subject+'|'+topic;
    let x=map.get(key);
    if(!x){
      x={subject,topic,total:0,correct:0,wrong:0,blank:0,attempts:0,lastAt:null,reviewTotal:0,reviewCorrect:0,overdueReviews:0,reasons:{}};
      map.set(key,x);
    }
    return x;
  };

  for(const row of practice){
    const x=ensure(row.subject,row.topic||'Genel/Karma');
    x.total+=row.total;x.correct+=row.correct;x.wrong+=row.wrong;x.blank+=row.blank;x.attempts++;
    x.lastAt=row.date;
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
    const accuracy=x.total?x.correct/x.total:0;
    const reviewAccuracy=x.reviewTotal?x.reviewCorrect/x.reviewTotal:0;
    const daysSince=x.lastAt?Math.floor((now.getTime()-x.lastAt.getTime())/86400000):999;
    const recency=Math.max(0,1-daysSince/45);
    const evidence=Math.min(1,x.total/40);
    const score=Math.round(clamp((accuracy*.55+reviewAccuracy*.25+recency*.2)*100*evidence,0,100));
    let status:MasteryStatus='NEW';
    if(x.overdueReviews>0&&(daysSince>=7||accuracy<.7))status='RISKY';
    else if(x.total<8&&x.reviewTotal===0)status='NEW';
    else if(accuracy<.65||x.attempts<2)status='LEARNING';
    else if(accuracy<.82||reviewAccuracy<.75)status='REINFORCING';
    else if(daysSince>21)status='RISKY';
    else status='DURABLE';
    const primaryReason=Object.entries(x.reasons).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    return {
      subject:x.subject,topic:x.topic,status,score,
      accuracy:Math.round(accuracy*100),
      reviewAccuracy:x.reviewTotal?Math.round(reviewAccuracy*100):null,
      totalQuestions:x.total,attempts:x.attempts,daysSinceLastEvidence:daysSince,
      overdueReviews:x.overdueReviews,
      primaryErrorReason:primaryReason,
      primaryErrorReasonLabel:primaryReason?ERROR_REASON_LABELS[primaryReason as ErrorReasonKey]||primaryReason:null
    };
  }).sort((a,b)=>{
    const order:Record<MasteryStatus,number>={RISKY:0,LEARNING:1,NEW:2,REINFORCING:3,DURABLE:4};
    return order[a.status]-order[b.status]||a.score-b.score;
  });
}

export async function buildSubjectLearningModels(studentId:string,now=new Date()){
  const since=new Date(now.getTime()-60*86400000);
  const [practice,analytics,reviews]=await Promise.all([
    db.practiceLog.findMany({where:{studentId,date:{gte:since}},select:{subject:true,topic:true,total:true,correct:true,wrong:true,blank:true,errorReason:true}}),
    db.examAnalyticsRecord.findMany({where:{studentId,examDate:{gte:since}},select:{subject:true,topic:true,questionType:true,correct:true,wrong:true,blank:true,avgSeconds:true}}),
    db.reviewQueueItem.findMany({where:{studentId,updatedAt:{gte:since}},include:{question:{select:{subject:true,topic:true}}}})
  ]);

  const subjects=new Set<string>([
    ...practice.map(x=>x.subject),
    ...analytics.map(x=>x.subject),
    ...reviews.map(x=>x.question.subject)
  ]);
  return [...subjects].map(subject=>{
    const family=subjectFamily(subject);
    const p=practice.filter(x=>x.subject===subject);
    const a=analytics.filter(x=>x.subject===subject);
    const r=reviews.filter(x=>x.question.subject===subject);
    const total=p.reduce((n,x)=>n+x.total,0)+a.reduce((n,x)=>n+x.correct+x.wrong+x.blank,0);
    const correct=p.reduce((n,x)=>n+x.correct,0)+a.reduce((n,x)=>n+x.correct,0);
    const avgSeconds=average(a.map(x=>x.avgSeconds||0).filter(x=>x>0));
    const questionTypes=[...new Set(a.map(x=>x.questionType).filter(Boolean))];
    const errorReasons:Record<string,number>={};
    for(const row of p){
      const reason=normalizedReason(row.errorReason);
      if(reason)errorReasons[reason]=(errorReasons[reason]||0)+1;
    }
    const reviewSuccess=r.length?Math.round(r.filter(x=>x.lastCorrect).length/r.length*100):null;
    const metrics=
      family==='MATHEMATICS'?['hız','doğruluk','problem tipi']:
      family==='TURKISH'?['soru türü','süre','doğruluk']:
      family==='HISTORY'?['aktif hatırlama','tekrar başarısı','kronoloji/kavram']:
      family==='LITERATURE'?['dönem','yazar/eser bağlantısı','tekrar başarısı']:
      family==='SCIENCE'?['konu','kavram yanılgısı','doğruluk']:
      ['doğruluk','konu','tekrar'];
    return {
      subject,family,metrics,
      accuracy:total?Math.round(correct/total*100):null,
      avgSeconds:avgSeconds?Number(avgSeconds.toFixed(1)):null,
      reviewSuccess,
      questionTypes,
      errorReasons:Object.entries(errorReasons).sort((a,b)=>b[1]-a[1]).map(([key,count])=>({
        key,count,label:ERROR_REASON_LABELS[key as ErrorReasonKey]||key
      }))
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

  const maxReviews=capacity.suggestedDailyMinutes>=240?4:capacity.suggestedDailyMinutes>=150?3:2;
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

  const weakest=mastery.find(x=>x.status==='RISKY'||x.status==='LEARNING')||mastery[0]||null;
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
        targetValue:35,
        metricType:'MINUTES',
        estimatedMinutes:35,
        completed:false,
        why:'Tamamlanmamış konu ve geçmiş performans sinyalleri birlikte değerlendirildi.'
      };
      items.push({...item,sequence:todayPlanSequenceRank(item)});
    }

    const matchingMastery=masteryMap.get(focusTopic.subject+'|'+focusTopic.topic)||weakest;
    const questionTarget=dailyPracticeQuestionTarget({
      questionCapacity:capacity.questionCapacity,
      accuracy:matchingMastery?.accuracy??null
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
  const budget=capacity.suggestedDailyMinutes;
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

  return {
    engineVersion:'TODAY_PLAN_V2',
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

export function adaptiveReviewIntervalDays(input:{nextStep:number;correct:boolean;previousCorrect:boolean|null}){
  const base=[0,1,3,7,14,28];
  if(!input.correct){
    return input.previousCorrect===false?1:0;
  }
  const step=clamp(input.nextStep,0,base.length-1);
  const raw=base[step];
  if(step>=3)return Math.min(45,raw*2);
  return raw;
}

export async function rebalanceMissedTasksCapacityAware(studentId:string,now=new Date()){
  const today=utcDateFromKey(trDateKey(now));
  const capacity=await buildCapacityProfile(studentId,now);
  const horizonStart=addDays(today,1);
  const horizonEnd=addDays(today,8);
  const [missed,scheduled]=await Promise.all([
    db.coachingAction.findMany({
      where:{studentId,status:'ACTIVE',taskDate:{not:null,lt:today},submission:null,rescheduleSource:null},
      orderBy:{taskDate:'asc'},take:20
    }),
    db.coachingAction.findMany({
      where:{studentId,status:'ACTIVE',taskDate:{gte:horizonStart,lt:horizonEnd}},
      select:{taskDate:true,targetValue:true,metricType:true,subject:true}
    })
  ]);

  const loadByDay=new Map<string,number>();
  for(const a of scheduled){
    if(!a.taskDate)continue;
    const key=trDateKey(a.taskDate);
    loadByDay.set(key,(loadByDay.get(key)||0)+estimatedTaskMinutes(a));
  }
  const lowDays=new Map(capacity.lowCompletionDays.map(x=>[x.day,x.completionRate]));
  const created:any[]=[];

  for(const action of missed){
    const remaining=Math.max(0,Number(action.targetValue)-Number(action.currentValue));
    if(remaining<=0)continue;
    const unitMinutes=action.metricType==='MINUTES'?1:
      action.metricType==='QUESTIONS'?minutesPerQuestion(action.subject||''):5;
    let left=remaining;
    const allocations:{date:Date;value:number}[]=[];

    for(let offset=1;offset<=7&&left>0;offset++){
      const date=addDays(today,offset);
      const key=trDateKey(date);
      const dayFactor=(lowDays.get(weekdayKey(date))??100)<60?.7:1;
      const dailyBudget=Math.round(capacity.suggestedDailyMinutes*dayFactor);
      const used=loadByDay.get(key)||0;
      const available=Math.max(0,dailyBudget-used);
      if(available<Math.max(5,unitMinutes))continue;
      const units=Math.max(1,Math.floor(available/unitMinutes));
      const value=Math.min(left,units);
      allocations.push({date,value});
      left-=value;
      loadByDay.set(key,used+Math.ceil(value*unitMinutes));
    }

    if(left>0){
      const fallback=addDays(today,7);
      const last=allocations.find(x=>trDateKey(x.date)===trDateKey(fallback));
      if(last)last.value+=left;else allocations.push({date:fallback,value:left});
      left=0;
    }

    const made=await db.$transaction(async tx=>{
      const ids:string[]=[];
      for(const allocation of allocations){
        const periodEnd=addDays(allocation.date,1);
        const row=await tx.coachingAction.create({data:{
          studentId,
          createdByUserId:action.createdByUserId,
          title:action.title+' · Telafi',
          description:(action.description?action.description+' · ':'')+'Kaçırılan görev, öğrencinin gözlenen günlük kapasitesine göre yeniden dağıtıldı.',
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
        newDate:allocations[0]?.date||horizonEnd,
        movedTarget:remaining,
        reason:'CAPACITY_AWARE_MISSED'
      }});
      return ids;
    });
    created.push({sourceActionId:action.id,createdActionIds:made,movedTarget:remaining,allocations});
  }
  return {created,capacity};
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
    .filter(x=>x.status==='RISKY'||x.status==='LEARNING')
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
