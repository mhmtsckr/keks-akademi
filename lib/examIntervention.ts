import { db } from '@/lib/db';
import { buildTopicMastery } from '@/lib/learningEngine';

function record(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
function num(v:unknown){
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}
function subjectNets(payload:unknown){
  const p=record(payload);
  const raw=record(p.subjectNets);
  return Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,num(v)]).filter((x):x is [string,number]=>x[1]!=null));
}

export async function buildLatestExamInterventionReport(studentId:string){
  const [exams,mastery,analytics]=await Promise.all([
    db.examResult.findMany({where:{studentId},orderBy:{createdAt:'desc'},take:2}),
    buildTopicMastery(studentId),
    db.examAnalyticsRecord.findMany({where:{studentId},orderBy:{examDate:'desc'},take:200})
  ]);
  const latest=exams[0];
  if(!latest)return null;
  const previous=exams[1]||null;
  const latestPayload=record(latest.payload);
  const previousPayload=record(previous?.payload);
  const latestMetric=num(latestPayload.net)??num(latestPayload.score);
  const previousMetric=num(previousPayload.net)??num(previousPayload.score);
  const latestSubjects=subjectNets(latest.payload);
  const previousSubjects=subjectNets(previous?.payload);
  const subjects=[...new Set([...Object.keys(latestSubjects),...Object.keys(previousSubjects)])];
  const changes=subjects.map(subject=>({
    subject,
    current:latestSubjects[subject]??null,
    previous:previousSubjects[subject]??null,
    delta:latestSubjects[subject]!=null&&previousSubjects[subject]!=null
      ?Number((latestSubjects[subject]-previousSubjects[subject]).toFixed(2))
      :null
  })).filter(x=>x.delta!=null);
  const biggestGain=[...changes].sort((a,b)=>(b.delta||0)-(a.delta||0))[0]||null;
  const biggestLoss=[...changes].sort((a,b)=>(a.delta||0)-(b.delta||0))[0]||null;

  const latestAnalytics=analytics.filter(x=>Math.abs(x.examDate.getTime()-latest.createdAt.getTime())<7*86400000);
  const avgSeconds=latestAnalytics.map(x=>x.avgSeconds||0).filter(x=>x>0);
  const timeSignal=avgSeconds.length
    ?{measured:true,averageSeconds:Number((avgSeconds.reduce((a,b)=>a+b,0)/avgSeconds.length).toFixed(1)),message:'Soru başına ortalama süre ölçüldü.'}
    :{measured:false,averageSeconds:null,message:'Bu denemede soru süresi verisi kaydedilmedi; süre problemi hakkında tahmin üretilmedi.'};

  const gaps=mastery.filter(x=>x.status==='RISKY'||x.status==='LEARNING').slice(0,5);
  const priorities=[
    ...(biggestLoss&&biggestLoss.delta!=null&&biggestLoss.delta<0
      ?[{subject:biggestLoss.subject,topic:null,reason:'Son denemede ders neti '+Math.abs(biggestLoss.delta)+' düştü.'}]
      :[]),
    ...gaps.map(x=>({subject:x.subject,topic:x.topic,reason:x.status==='RISKY'?'Konu hâkimiyeti riskli.':'Konu hâlâ öğreniliyor.'}))
  ].filter((x,i,arr)=>arr.findIndex(y=>y.subject===x.subject&&y.topic===x.topic)===i).slice(0,4);

  const sevenDayPlan=priorities.flatMap((p,index)=>[
    {day:Math.min(7,index*2+1),subject:p.subject,topic:p.topic,task:'Kısa konu tekrarı + aktif hatırlama',reason:p.reason},
    {day:Math.min(7,index*2+2),subject:p.subject,topic:p.topic,task:'Hedefli soru seti + yanlış nedeni kaydı',reason:'Tekrar sonrası yeniden ölçüm.'}
  ]).slice(0,7);

  return {
    examType:latest.examType,
    createdAt:latest.createdAt,
    overall:{
      current:latestMetric,
      previous:previousMetric,
      delta:latestMetric!=null&&previousMetric!=null?Number((latestMetric-previousMetric).toFixed(2)):null
    },
    subjectChanges:changes,
    biggestGain:biggestGain&&biggestGain.delta!=null&&biggestGain.delta>0?biggestGain:null,
    biggestLoss:biggestLoss&&biggestLoss.delta!=null&&biggestLoss.delta<0?biggestLoss:null,
    timeSignal,
    topicGaps:gaps,
    sevenDayPlan,
    note:'Rapor, son iki deneme ve mevcut konu/tekrar verisini karşılaştırır; sınav sonucu hakkında kesin başarı tahmini üretmez.'
  };
}
