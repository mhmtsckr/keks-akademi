import { db } from '@/lib/db';
import { buildTopicMastery } from '@/lib/learningEngine';

function record(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
function num(v:unknown){
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}

export function subjectNets(payload:unknown){
  const p=record(payload);
  const direct=record(p.subjectNets);
  const subjects=record(p.subjects);
  const out:Record<string,number>={};
  for(const [k,v] of Object.entries(direct)){
    const n=num(v);if(n!=null)out[k]=n;
  }
  for(const [k,v] of Object.entries(subjects)){
    if(out[k]!=null)continue;
    const row=record(v);
    const n=num(row.net)??num(row.score);
    if(n!=null)out[k]=n;
  }
  return out;
}

export function sameExamPrevious<T extends {examType:string}>(latest:T,rest:T[]){
  return rest.find(x=>x.examType===latest.examType)||null;
}

export function compareSubjectNets(current:Record<string,number>,previous:Record<string,number>){
  const subjects=[...new Set([...Object.keys(current),...Object.keys(previous)])];
  return subjects.map(subject=>({
    subject,
    current:current[subject]??null,
    previous:previous[subject]??null,
    delta:current[subject]!=null&&previous[subject]!=null
      ?Number((current[subject]-previous[subject]).toFixed(2))
      :null
  })).filter(x=>x.delta!=null);
}

export function buildTimeSignal(payload:unknown,analytics:{avgSeconds:number|null}[]){
  const p=record(payload);
  const usedSeconds=
    num(p.usedDurationSeconds) ??
    num(p.durationSeconds) ??
    (num(p.usedDurationMinutes)!=null ? num(p.usedDurationMinutes)!*60 : null);
  const allowedSeconds=
    num(p.allowedDurationSeconds) ??
    (num(p.allowedDurationMinutes)!=null ? num(p.allowedDurationMinutes)!*60 : null);
  const timeExpired=p.timeExpired===true||p.finishedByTimeLimit===true;
  const avgSeconds=analytics.map(x=>x.avgSeconds||0).filter(x=>x>0);
  const averageSeconds=avgSeconds.length
    ?Number((avgSeconds.reduce((a,b)=>a+b,0)/avgSeconds.length).toFixed(1))
    :null;

  if(timeExpired){
    return {measured:true,problem:true,averageSeconds,usedSeconds,allowedSeconds,message:'Deneme süre sınırı nedeniyle tamamlandı; süre müdahalesi gerekli.'};
  }
  if(usedSeconds!=null&&allowedSeconds!=null){
    const ratio=allowedSeconds?usedSeconds/allowedSeconds:0;
    return {
      measured:true,
      problem:ratio>=0.95,
      averageSeconds,
      usedSeconds,
      allowedSeconds,
      message:ratio>=0.95
        ?'Toplam sürenin en az %95’i kullanıldı; süre yönetimi öncelikli izlenmeli.'
        :'Toplam süre sınırı içinde kalındı.'
    };
  }
  if(averageSeconds!=null){
    return {measured:true,problem:null,averageSeconds,usedSeconds:null,allowedSeconds:null,message:'Soru başına ortalama süre ölçüldü; toplam süre sınırı olmadığı için sorun etiketi verilmedi.'};
  }
  return {measured:false,problem:null,averageSeconds:null,usedSeconds:null,allowedSeconds:null,message:'Bu denemede güvenilir süre verisi yok; süre problemi hakkında tahmin üretilmedi.'};
}

export function buildSevenDayInterventionPlan(priorities:{subject:string;topic:string|null;reason:string}[],timeProblem:boolean|null){
  const tasks:any[]=[];
  if(timeProblem){
    tasks.push({day:1,subject:'Genel',topic:null,task:'Süre analizi: bölüm bazlı süre dağılımını çıkar ve zaman kaybı noktalarını işaretle.',reason:'Denemede süre sınırı kritik kullanıldı.'});
  }
  for(const p of priorities){
    if(tasks.length>=7)break;
    tasks.push({
      day:Math.min(7,tasks.length+1),
      subject:p.subject,topic:p.topic,
      task:'Kısa konu tekrarı + aktif hatırlama',
      reason:p.reason
    });
    if(tasks.length>=7)break;
    tasks.push({
      day:Math.min(7,tasks.length+1),
      subject:p.subject,topic:p.topic,
      task:'Hedefli soru seti + yanlış nedeni kaydı',
      reason:'Tekrar sonrası yeniden ölçüm.'
    });
  }
  if(tasks.length<7){
    tasks.push({day:Math.min(7,tasks.length+1),subject:'Genel',topic:null,task:'Mini deneme / karışık kontrol seti',reason:'7 günlük müdahalenin sonunda yeniden ölçüm.'});
  }
  return tasks.slice(0,7);
}

export async function buildLatestExamInterventionReport(studentId:string){
  const exams=await db.examResult.findMany({where:{studentId},orderBy:{createdAt:'desc'},take:12});
  const latest=exams[0];
  if(!latest)return null;
  const previous=sameExamPrevious(latest,exams.slice(1));

  const [mastery,analytics]=await Promise.all([
    buildTopicMastery(studentId),
    db.examAnalyticsRecord.findMany({
      where:{
        studentId,
        examType:latest.examType,
        examDate:{gte:new Date(latest.createdAt.getTime()-86400000),lte:new Date(latest.createdAt.getTime()+86400000)}
      },
      orderBy:{examDate:'desc'},
      take:300
    })
  ]);

  const latestPayload=record(latest.payload);
  const previousPayload=record(previous?.payload);
  const latestMetric=num(latestPayload.net)??num(latestPayload.totalNet)??num(latestPayload.score);
  const previousMetric=num(previousPayload.net)??num(previousPayload.totalNet)??num(previousPayload.score);
  const latestSubjects=subjectNets(latest.payload);
  const previousSubjects=subjectNets(previous?.payload);
  const changes=compareSubjectNets(latestSubjects,previousSubjects);
  const biggestGain=[...changes].filter(x=>(x.delta||0)>0).sort((a,b)=>(b.delta||0)-(a.delta||0))[0]||null;
  const biggestLoss=[...changes].filter(x=>(x.delta||0)<0).sort((a,b)=>(a.delta||0)-(b.delta||0))[0]||null;

  const timeSignal=buildTimeSignal(latest.payload,analytics);

  const analyticsSubjects=new Set(analytics.map(x=>x.subject));
  const gaps=mastery
    .filter(x=>x.status==='RISKY'||x.status==='LEARNING')
    .filter(x=>!analyticsSubjects.size||analyticsSubjects.has(x.subject))
    .slice(0,6);

  const priorities=[
    ...(biggestLoss&&biggestLoss.delta!=null
      ?[{subject:biggestLoss.subject,topic:null,reason:'Son '+latest.examType+' denemesinde ders neti '+Math.abs(biggestLoss.delta)+' düştü.'}]
      :[]),
    ...gaps.map(x=>({subject:x.subject,topic:x.topic,reason:x.status==='RISKY'?'Konu hâkimiyeti riskli.':'Konu hâlâ öğreniliyor.'}))
  ].filter((x,i,arr)=>arr.findIndex(y=>y.subject===x.subject&&y.topic===x.topic)===i).slice(0,4);

  const sevenDayPlan=buildSevenDayInterventionPlan(priorities,timeSignal.problem);

  return {
    examId:latest.id,
    examType:latest.examType,
    createdAt:latest.createdAt,
    previousExamAt:previous?.createdAt||null,
    overall:{
      current:latestMetric,
      previous:previousMetric,
      delta:latestMetric!=null&&previousMetric!=null?Number((latestMetric-previousMetric).toFixed(2)):null
    },
    subjectChanges:changes,
    biggestGain,
    biggestLoss,
    timeSignal,
    topicGaps:gaps,
    sevenDayPlan,
    note:'Rapor aynı sınav türündeki önceki deneme ve mevcut öğrenme verisini karşılaştırır. Kesin sınav sonucu veya yerleşme tahmini üretmez.'
  };
}
