import {db} from '@/lib/db';

export type StudentIndicatorKey='CONTINUITY'|'REVIEW_DISCIPLINE'|'KNOWLEDGE_MASTERY'|'QUESTION_ACCURACY'|'PLAN_ALIGNMENT';

export type StudentIndicator={
  key:StudentIndicatorKey;
  label:string;
  value:number|null;
  previous:number|null;
  delta:number|null;
  trend:'UP'|'DOWN'|'SAME'|'NO_COMPARISON';
  unit:'%';
  evidence:string;
  previousEvidence:string;
  formula:string;
  reasons:string[];
  confidence:'YETERLİ'|'SINIRLI'|'YETERSİZ';
};

type ActionEvidence={
  title:string;
  taskDate:Date|null;
  status:string;
  submission:{submittedAt:Date}|null;
};

type PracticeEvidence={
  subject:string;
  topic:string|null;
  correct:number;
  wrong:number;
  blank:number;
  total:number;
  date:Date;
};

type ReviewEvidence={
  dueAt:Date;
  status:string;
  completedAt:Date|null;
  lastCorrect:boolean|null;
  question:{subject:string;topic:string};
};

type TechniqueEvidence={
  createdAt:Date;
  activeSeconds:number;
};

export type StudentIndicatorEvidence={
  actions:ActionEvidence[];
  practice:PracticeEvidence[];
  reviews:ReviewEvidence[];
  techniques:TechniqueEvidence[];
};

type Window={start:Date;end:Date;days:number;label:string};

function trKey(d:Date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
function utcDateFromKey(key:string){
  const [y,m,d]=key.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d));
}
function addDays(d:Date,days:number){
  const x=new Date(d);x.setUTCDate(x.getUTCDate()+days);return x;
}
export function comparableWeekWindows(now=new Date()){
  const today=utcDateFromKey(trKey(now));
  const weekday=today.getUTCDay();
  const mondayOffset=weekday===0?-6:1-weekday;
  const currentStart=addDays(today,mondayOffset);
  const elapsedDays=Math.floor((today.getTime()-currentStart.getTime())/86400000)+1;
  const currentEnd=addDays(currentStart,elapsedDays);
  const previousStart=addDays(currentStart,-7);
  const previousEnd=addDays(previousStart,elapsedDays);
  return {
    current:{start:currentStart,end:currentEnd,days:elapsedDays,label:'Bu hafta'} as Window,
    previous:{start:previousStart,end:previousEnd,days:elapsedDays,label:'Geçen hafta aynı günler'} as Window
  };
}

function inWindow(date:Date|null|undefined,w:Window){
  return Boolean(date&&date>=w.start&&date<w.end);
}
function clampPct(n:number){
  return Math.max(0,Math.min(100,Math.round(n)));
}
function pct(num:number,den:number){
  return den>0?clampPct(num/den*100):null;
}
function delta(current:number|null,previous:number|null){
  return current!=null&&previous!=null?current-previous:null;
}
function trend(d:number|null):StudentIndicator['trend']{
  if(d==null)return 'NO_COMPARISON';
  if(d>0)return 'UP';
  if(d<0)return 'DOWN';
  return 'SAME';
}
function confidence(evidenceCount:number,good:number,borderline:number):StudentIndicator['confidence']{
  return evidenceCount>=good?'YETERLİ':evidenceCount>=borderline?'SINIRLI':'YETERSİZ';
}
function compareSentence(label:string,current:number|null,previous:number|null){
  if(current==null)return label+': bu hafta için yeterli veri yok.';
  if(previous==null)return label+' %'+current+'. Geçen haftanın aynı günleri için karşılaştırılabilir veri yok.';
  const d=current-previous;
  return label+' %'+current+' → geçen haftaya göre '+(d===0?'değişmedi':(d>0?'+':'')+d+' puan')+'.';
}

function periodStats(e:StudentIndicatorEvidence,w:Window){
  const actions=e.actions.filter(x=>x.taskDate&&inWindow(x.taskDate,w)&&x.status!=='CANCELLED');
  const completedActions=actions.filter(x=>Boolean(x.submission)||x.status==='COMPLETED');

  const practice=e.practice.filter(x=>inWindow(x.date,w));
  const totalQuestions=practice.reduce((n,x)=>n+x.total,0);
  const correct=practice.reduce((n,x)=>n+x.correct,0);
  const wrong=practice.reduce((n,x)=>n+x.wrong,0);
  const blank=practice.reduce((n,x)=>n+x.blank,0);

  const dueReviews=e.reviews.filter(x=>inWindow(x.dueAt,w));
  const completedReviews=dueReviews.filter(x=>Boolean(x.completedAt&&x.completedAt<w.end));
  const correctReviews=completedReviews.filter(x=>x.lastCorrect===true).length;

  const techniques=e.techniques.filter(x=>inWindow(x.createdAt,w)&&x.activeSeconds>0);
  const activeDays=new Set<string>();
  practice.filter(x=>x.total>0).forEach(x=>activeDays.add(trKey(x.date)));
  completedActions.forEach(x=>x.submission&&activeDays.add(trKey(x.submission.submittedAt)));
  techniques.forEach(x=>activeDays.add(trKey(x.createdAt)));

  const topics=new Map<string,{subject:string;topic:string;total:number;correct:number}>();
  for(const row of practice){
    if(row.total<=0)continue;
    const topic=row.topic||'Genel/Karma';
    const key=row.subject+'|'+topic;
    const x=topics.get(key)||{subject:row.subject,topic,total:0,correct:0};
    x.total+=row.total;x.correct+=row.correct;topics.set(key,x);
  }
  const measuredTopics=[...topics.values()].filter(x=>x.total>=3).map(x=>({
    ...x,accuracy:Math.round(x.correct/x.total*100)
  }));
  const masteredTopics=measuredTopics.filter(x=>x.accuracy>=70);
  const weakestTopic=[...measuredTopics].sort((a,b)=>a.accuracy-b.accuracy)[0]||null;

  return {
    activeDays:activeDays.size,
    continuity:pct(activeDays.size,w.days),
    actions:actions.length,
    completedActions:completedActions.length,
    planAlignment:pct(completedActions.length,actions.length),
    totalQuestions,correct,wrong,blank,
    questionAccuracy:pct(correct,totalQuestions),
    dueReviews:dueReviews.length,
    completedReviews:completedReviews.length,
    correctReviews,
    reviewDiscipline:pct(completedReviews.length,dueReviews.length),
    measuredTopics:measuredTopics.length,
    masteredTopics:masteredTopics.length,
    knowledgeMastery:pct(masteredTopics.length,measuredTopics.length),
    weakestTopic
  };
}

export function calculateStudentIndicators(e:StudentIndicatorEvidence,now=new Date()){
  const windows=comparableWeekWindows(now);
  const cur=periodStats(e,windows.current);
  const prev=periodStats(e,windows.previous);

  const make=(base:Omit<StudentIndicator,'delta'|'trend'>):StudentIndicator=>{
    const d=delta(base.value,base.previous);
    return {...base,delta:d,trend:trend(d)};
  };

  const indicators:StudentIndicator[]=[
    make({
      key:'CONTINUITY',label:'Çalışma Sürekliliği',value:cur.continuity,previous:prev.continuity,unit:'%',
      evidence:cur.activeDays+'/'+windows.current.days+' günde kayıtlı çalışma',
      previousEvidence:prev.activeDays+'/'+windows.previous.days+' günde kayıtlı çalışma',
      formula:'Aktif çalışma günü ÷ karşılaştırılan gün sayısı',
      reasons:[
        compareSentence('Çalışma Sürekliliği',cur.continuity,prev.continuity),
        'Bu hafta '+cur.activeDays+' farklı günde soru, görev veya aktif çalışma kaydı oluştu.'
      ],
      confidence:confidence(cur.activeDays,3,1)
    }),
    make({
      key:'REVIEW_DISCIPLINE',label:'Tekrar Disiplini',value:cur.reviewDiscipline,previous:prev.reviewDiscipline,unit:'%',
      evidence:cur.completedReviews+'/'+cur.dueReviews+' vadesi gelen tekrar tamamlandı',
      previousEvidence:prev.completedReviews+'/'+prev.dueReviews+' vadesi gelen tekrar tamamlandı',
      formula:'Vadesi gelen tekrarlar içinde dönem bitmeden tamamlananların oranı',
      reasons:[
        compareSentence('Tekrar Disiplini',cur.reviewDiscipline,prev.reviewDiscipline),
        cur.dueReviews?Math.max(0,cur.dueReviews-cur.completedReviews)+' tekrar bu karşılaştırma aralığında tamamlanmadı.':'Bu hafta henüz vadesi gelen tekrar yok.'
      ],
      confidence:confidence(cur.dueReviews,5,1)
    }),
    make({
      key:'KNOWLEDGE_MASTERY',label:'Bilgi Hâkimiyeti',value:cur.knowledgeMastery,previous:prev.knowledgeMastery,unit:'%',
      evidence:cur.masteredTopics+'/'+cur.measuredTopics+' ölçülen konuda doğruluk ≥ %70',
      previousEvidence:prev.masteredTopics+'/'+prev.measuredTopics+' ölçülen konuda doğruluk ≥ %70',
      formula:'En az 3 soru kanıtı bulunan konular içinde doğruluğu %70 ve üzeri olan konu oranı',
      reasons:[
        compareSentence('Bilgi Hâkimiyeti',cur.knowledgeMastery,prev.knowledgeMastery),
        cur.weakestTopic?cur.weakestTopic.subject+' · '+cur.weakestTopic.topic+' şu anda en düşük ölçülen konu (%'+cur.weakestTopic.accuracy+').':'Konu hâkimiyeti için en az 3 soruluk konu kanıtı gerekiyor.'
      ],
      confidence:confidence(cur.measuredTopics,3,1)
    }),
    make({
      key:'QUESTION_ACCURACY',label:'Soru Doğruluğu',value:cur.questionAccuracy,previous:prev.questionAccuracy,unit:'%',
      evidence:cur.correct+'/'+cur.totalQuestions+' doğru · '+cur.wrong+' yanlış · '+cur.blank+' boş',
      previousEvidence:prev.correct+'/'+prev.totalQuestions+' doğru',
      formula:'Doğru soru ÷ çözülen toplam soru',
      reasons:[
        compareSentence('Soru Doğruluğu',cur.questionAccuracy,prev.questionAccuracy),
        cur.totalQuestions?cur.totalQuestions+' soru kanıtı üzerinden hesaplandı.':'Bu hafta soru çözüm kaydı yok.'
      ],
      confidence:confidence(cur.totalQuestions,30,5)
    }),
    make({
      key:'PLAN_ALIGNMENT',label:'Plan Uyumu',value:cur.planAlignment,previous:prev.planAlignment,unit:'%',
      evidence:cur.completedActions+'/'+cur.actions+' planlı görev tamamlandı',
      previousEvidence:prev.completedActions+'/'+prev.actions+' planlı görev tamamlandı',
      formula:'Tamamlanan planlı görev ÷ bu haftaya planlanan görev',
      reasons:[
        compareSentence('Plan Uyumu',cur.planAlignment,prev.planAlignment),
        cur.actions?Math.max(0,cur.actions-cur.completedActions)+' planlı görev henüz tamamlanmadı.':'Bu karşılaştırma aralığında planlı görev yok.'
      ],
      confidence:confidence(cur.actions,5,1)
    })
  ];

  return {
    period:{
      currentStart:windows.current.start,
      currentEnd:windows.current.end,
      previousStart:windows.previous.start,
      previousEnd:windows.previous.end,
      comparedDays:windows.current.days,
      comparisonLabel:'Geçen haftanın aynı '+windows.current.days+' günü'
    },
    indicators,
    summary:{
      improving:indicators.filter(x=>x.delta!=null&&x.delta>0).map(x=>x.label),
      declining:indicators.filter(x=>x.delta!=null&&x.delta<0).map(x=>x.label),
      stable:indicators.filter(x=>x.delta===0).map(x=>x.label),
      missing:indicators.filter(x=>x.value==null).map(x=>x.label)
    }
  };
}

export async function buildStudentIndicators(studentId:string,now=new Date()){
  const windows=comparableWeekWindows(now);
  const from=windows.previous.start;
  const to=windows.current.end;
  const [actions,practice,reviews,techniques]=await Promise.all([
    db.coachingAction.findMany({
      where:{studentId,taskDate:{gte:from,lt:to}},
      select:{title:true,taskDate:true,status:true,submission:{select:{submittedAt:true}}}
    }),
    db.practiceLog.findMany({
      where:{studentId,date:{gte:from,lt:to}},
      select:{subject:true,topic:true,correct:true,wrong:true,blank:true,total:true,date:true}
    }),
    db.reviewQueueItem.findMany({
      where:{studentId,dueAt:{gte:from,lt:to}},
      select:{dueAt:true,status:true,completedAt:true,lastCorrect:true,question:{select:{subject:true,topic:true}}}
    }),
    db.techniquePracticeSession.findMany({
      where:{studentId,createdAt:{gte:from,lt:to}},
      select:{createdAt:true,activeSeconds:true}
    })
  ]);
  return calculateStudentIndicators({actions,practice,reviews,techniques},now);
}
