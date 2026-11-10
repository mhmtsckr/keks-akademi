import type {TopicDiagnostic,LearningSignal} from '@/lib/learningDiagnostics';

/**
 * A review suggestion for a human coach. This module never creates or
 * silently changes a student's assignments or spaced-repetition queue.
 */
export type LearningFollowUp={
  subject:string;
  topic:string;
  signal:LearningSignal;
  dueDate:string;
  dueAt:string;
  delayedDays:number;
  questionCount:number;
  instruction:string;
  rationale:string;
  sourceNote:string;
  coachApprovalRequired:true;
};

const IST='Europe/Istanbul';
function dateKey(date:Date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:IST,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
function keyToUtcNoon(key:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return null;
  const date=new Date(key+'T12:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===key?date:null;
}
function plusCalendarDays(key:string,days:number){
  const date=keyToUtcNoon(key);
  if(!date)return null;
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}

const RULES:Record<LearningSignal,{delay:number;count:number;instruction:string}>={
  REGRESSING:{delay:1,count:8,instruction:'Önce son yanlışları öğrenciyle incele; sonra aynı kazanımdan 8 yeni soruyu süre ve yanlış nedeniyle birlikte değerlendir.'},
  AT_RISK:{delay:1,count:8,instruction:'Bilgi, yöntem ve dikkat hatalarını ayır; kısa aktif hatırlama sonrası aynı kazanımdan 8 yeni soru uygula.'},
  MEASURE_MORE:{delay:1,count:8,instruction:'En az iki ayrı günde farklı 8 soruluk kontrol seti uygula. Tek çalışmayı yeterli kanıt sayma.'},
  MIXED:{delay:2,count:8,instruction:'Zorluk düzeyi benzer 8 yeni soruluk kontrol yap; iki ayrı gündeki sonuçları karşılaştır.'},
  IMPROVING:{delay:3,count:10,instruction:'Gelişmenin sürüp sürmediğini ölçmek için 10 yeni soru ve kaynaksız hatırlama uygula.'},
  CONSISTENT:{delay:7,count:10,instruction:'Farklı soru türlerinde 10 soruluk gecikmeli transfer kontrolü yap; kalıcılığı tek testten çıkarma.'}
};

export function buildLearningFollowUp(topic:TopicDiagnostic,now=new Date()):LearningFollowUp{
  const rule=RULES[topic.signal];
  const today=dateKey(now);
  const ideal=plusCalendarDays(topic.lastEvidenceDay,rule.delay)||today;
  const dueDate=ideal<today?today:ideal;
  const delayedDays=ideal<today
    ?Math.max(0,Math.round(((keyToUtcNoon(today)?.getTime()||0)-(keyToUtcNoon(ideal)?.getTime()||0))/86400000))
    :0;
  // Istanbul has a fixed UTC+03:00 offset. A suggested due date ends at 23:00 local.
  const dueAt=new Date(dueDate+'T20:00:00Z').toISOString();
  const sourceNote=topic.studentReportedQuestions>=topic.totalQuestions
    ?'Bu konu için kullanılan bütün soru kayıtları öğrenci görev beyanından oluşuyor.'
    :topic.studentReportedQuestions>0
      ?topic.studentReportedQuestions+' soru öğrenci görev beyanı, '+topic.otherPracticeQuestions+' soru diğer çalışma kayıtlarından geliyor. Diğer kayıtlar doğrulanmış sınav olarak kabul edilemez.'
      :'Veriler diğer çalışma kayıtlarından geliyor; bunların bağımsız veya gözetimli sınav olduğu doğrulanmadı.';
  const rationale=topic.reason
    +' Bu kontrol yeni sorular ve karşılaştırılabilir güçlük düzeyi ile yapılmalı.'
    +(delayedDays?' Önerilen takip zamanı '+delayedDays+' gün önceydi.':'');
  return {
    subject:topic.subject,topic:topic.topic,signal:topic.signal,
    dueDate,dueAt,delayedDays,questionCount:rule.count,
    instruction:rule.instruction,rationale,sourceNote,
    coachApprovalRequired:true
  };
}

export function buildLearningFollowUps(topics:TopicDiagnostic[],now=new Date(),limit=6){
  return topics.slice(0,Math.max(0,Math.min(20,limit))).map(t=>buildLearningFollowUp(t,now));
}
