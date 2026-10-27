import {gradeOptical} from '@/lib/paragrafOptik';
import {getParagrafDetailedSolution} from '@/lib/paragrafDetailedSolutions';
import {REMEDIATION_REASONS,isRemediationReason} from '@/lib/wrongQuestionRemediation';
import {opticalReasonAction} from '@/lib/paragrafLearningPlaybook';
import {FOLLOWUP_EVENT} from '@/lib/paragrafFollowupTransfer';

type Log={date:Date;payload:unknown};
type Queue={questionId:string;dueAt:Date;status:string};
type Source={topic:string;firstAt:number};
type Working={
 topic:string;wrong:number;blank:number;initialQuestions:Set<string>;
 reported:Record<string,number>;independentAttempts:number;independentCorrect:number;justifiedAttempts:number;
 reviewAttempts:number;reviewCorrect:number;delayedAttempts:number;delayedCorrect:number;
 delayedWrong:number;delayedDates:Set<string>;delayedQuestionIds:Set<string>;
 overdue:number;lastFailureAt:string|null;
 followupAttempts:number;followupCorrect:number;delayedNovelAttempts:number;
 delayedNovelCorrect:number;delayedNovelWrong:number;delayedNovelDates:Set<string>;
};

export type ParagrafCoachSignal={
 topic:string;wrong:number;blank:number;independentAttempts:number;independentCorrect:number;
 justifiedAttempts:number;reviewAttempts:number;reviewCorrect:number;delayedAttempts:number;
 delayedCorrect:number;delayedWrong:number;delayedDays:number;delayedDistinctQuestions:number;
 overdue:number;primaryReason:string;primaryReasonSource:'STUDENT_SELF_REPORT'|'UNKNOWN';
 followupAttempts:number;followupCorrect:number;delayedNovelAttempts:number;
 delayedNovelCorrect:number;delayedNovelWrong:number;delayedNovelDays:number;
 observedChangePp:number|null;observedTrend:'INSUFFICIENT'|'IMPROVING'|'DECLINING'|'STABLE';
 observationalOnly:true;
 actionCode:'NEW_TEXT_FAILURE'|'REPEATED_FAILURE'|'OVERDUE'|'TRANSFER_GAP'|'TIME_BLANK'|'UNCLASSIFIED'|'PRACTICE'|'FOLLOW_UP';
 nextAction:string;priority:number;evidenceLevel:'INITIAL_ONLY'|'IMMEDIATE_TRANSFER'|'DELAYED_REVIEW';
 retentionVerified:false;
};
const PREFIX='KEKS_PRINT_A3_V1_Q';
const DAY=86400000;
const asObject=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const validTest=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=1&&n<=50;
const validQ=(n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=1&&n<=30;
function serialOf(id:unknown){
 if(typeof id!=='string'||!/^KEKS_PRINT_A3_V1_Q\d{5}$/.test(id))return null;
 const no=Number(id.slice(PREFIX.length));
 return Number.isInteger(no)&&no>=1&&no<=1500?no:null;
}
function rowFor(map:Map<string,Working>,topic:string){
 let row=map.get(topic);
 if(!row){
  row={topic,wrong:0,blank:0,initialQuestions:new Set(),reported:{},
   independentAttempts:0,independentCorrect:0,justifiedAttempts:0,
   reviewAttempts:0,reviewCorrect:0,delayedAttempts:0,delayedCorrect:0,
   delayedWrong:0,delayedDates:new Set(),delayedQuestionIds:new Set(),
   overdue:0,lastFailureAt:null,
   followupAttempts:0,followupCorrect:0,delayedNovelAttempts:0,
   delayedNovelCorrect:0,delayedNovelWrong:0,delayedNovelDates:new Set()};
  map.set(topic,row);
 }
 return row;
}

/**
 * Student-scoped evidence in; explainable coach guidance out.
 * Immediate guided retries and immediate new-question practice are NEVER
 * counted as delayed retention evidence or confirmed mastery.
 */
export function summarizeParagrafCoachEvidence(logs:Log[],queues:Queue[],now=new Date()){
 const cutoff=now.getTime()-90*DAY;
 const sources=new Map<string,Source>();
 const topics=new Map<string,Working>();
 const seenTests=new Set<number>();
 const firstImportAt=new Map<number,number>();
 const seenNovelQuestions=new Set<string>();
 const ordered=[...logs].filter(x=>x.date instanceof Date&&Number.isFinite(x.date.getTime())&&
  x.date.getTime()<=now.getTime()&&x.date.getTime()>=cutoff)
  .sort((a,b)=>a.date.getTime()-b.date.getTime());

 // First accepted optical submission is one immutable student/test record.
 for(const log of ordered){
  const p=asObject(log.payload);
  if(p.kind!=='PARAGRAF_OPTIK_WRONG_RECOVERY'||!validTest(p.testNo)||
    typeof p.encoded!=='string'||!/^[A-EX]{30}$/.test(p.encoded)||seenTests.has(p.testNo))continue;
  const graded=gradeOptical(p.testNo,p.encoded);
  if(!graded)continue;
  seenTests.add(p.testNo);
  firstImportAt.set(p.testNo,log.date.getTime());
  const missed=new Map<number,string>();
  for(const detail of graded.details){
   if(detail.status==='DOĞRU')continue;
   const id=PREFIX+String((p.testNo-1)*30+detail.number).padStart(5,'0');
   const row=rowFor(topics,detail.topic);
   if(detail.status==='BOŞ')row.blank++;else row.wrong++;
   row.initialQuestions.add(id);sources.set(id,{topic:detail.topic,firstAt:log.date.getTime()});
   missed.set(detail.number,detail.topic);
   const reason=asObject(p.reasons)[String(detail.number)];
   if(isRemediationReason(reason))row.reported[reason]=(row.reported[reason]||0)+1;
  }
  const checks=Array.isArray(p.independentChecks)?p.independentChecks:[];
  const checkedNumbers=new Set<number>();
  for(const item of checks){
   const c=asObject(item);
   if(!validQ(c.number)||checkedNumbers.has(c.number)||c.kind!=='INDEPENDENT_SAME_SKILL_TRANSFER'
      ||typeof c.correct!=='boolean'||typeof c.chosen!=='string'
      ||!['A','B','C','D','E'].includes(c.chosen)||typeof c.questionId!=='string'
      ||!/^\d{5}$/.test(c.questionId))continue;
   const topic=missed.get(c.number);
   if(!topic)continue;
   const other=getParagrafDetailedSolution(c.questionId);
   if(!other||other.testNo===p.testNo||other.topic!==topic||
     (c.chosen===other.answer)!==c.correct)continue;
   checkedNumbers.add(c.number);
   const row=rowFor(topics,topic);
   row.independentAttempts++;
   if(c.correct)row.independentCorrect++;
   if(typeof c.evidence==='string'&&c.evidence.trim().length>=15
     &&c.evidence.trim().length<=500)row.justifiedAttempts++;
  }
 }

 // Post-import different-question attempts are independent immutable DailyLog events.
 // Do not trust stage, correctness or a client-provided topic without checking source and key.
 for(const log of ordered){
  const p=asObject(log.payload);
  if(p.kind!==FOLLOWUP_EVENT||!validTest(p.testNo)||!validQ(p.sourceQuestionNo)
    ||typeof p.questionId!=='string'||!/^\d{5}$/.test(p.questionId)
    ||seenNovelQuestions.has(p.questionId)||typeof p.correct!=='boolean'
    ||typeof p.chosen!=='string')continue;
  const serial=(p.testNo-1)*30+p.sourceQuestionNo;
  const source=sources.get(PREFIX+String(serial).padStart(5,'0'));
  const candidate=getParagrafDetailedSolution(p.questionId);
  if(!source||log.date.getTime()<source.firstAt||!candidate
    ||candidate.testNo===p.testNo||candidate.topic!==source.topic
    ||(firstImportAt.has(candidate.testNo)&&firstImportAt.get(candidate.testNo)!<=log.date.getTime())
    ||candidate.answer===undefined||!['A','B','C','D','E'].includes(p.chosen)
    ||(p.chosen===candidate.answer)!==p.correct)continue;
  seenNovelQuestions.add(p.questionId);
  const row=rowFor(topics,source.topic);
  row.followupAttempts++;
  if(p.correct)row.followupCorrect++;
  // Delayed, unseen question results are strictly separate from original-question review.
  if(log.date.getTime()-source.firstAt>=DAY){
   row.delayedNovelAttempts++;
   if(p.correct)row.delayedNovelCorrect++;else row.delayedNovelWrong++;
   row.delayedNovelDates.add(log.date.toISOString().slice(0,10));
  }
 }

 // Only real review results on previously imported PRINT questions are considered.
 for(const log of ordered){
  const p=asObject(log.payload);
  if(p.type!=='REVIEW_RESULT'||typeof p.questionId!=='string'
     ||typeof p.correct!=='boolean'||serialOf(p.questionId)===null)continue;
  const source=sources.get(p.questionId);
  if(!source||log.date.getTime()<source.firstAt)continue;
  const row=rowFor(topics,source.topic);
  row.reviewAttempts++;
  if(p.correct)row.reviewCorrect++;
  else row.lastFailureAt=log.date.toISOString();
  // 24 hours must pass after the initial test for retention evidence.
  if(log.date.getTime()-source.firstAt<DAY)continue;
  row.delayedAttempts++;
  if(p.correct)row.delayedCorrect++;else row.delayedWrong++;
  row.delayedDates.add(log.date.toISOString().slice(0,10));
  row.delayedQuestionIds.add(p.questionId);
 }

 const nowMs=now.getTime();
 for(const q of queues){
  if(q.status==='COMPLETED'||!(q.dueAt instanceof Date)||
    !Number.isFinite(q.dueAt.getTime())||q.dueAt.getTime()>nowMs-DAY)continue;
  const source=sources.get(q.questionId);
  if(source)rowFor(topics,source.topic).overdue++;
 }

 const signals:ParagrafCoachSignal[]=[...topics.values()].map(t=>{
  const topReason=Object.entries(t.reported)
   .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||null;
  const reason=topReason&&isRemediationReason(topReason)?topReason:null;
  const reasonLabel=reason?REMEDIATION_REASONS[reason].label:'Henüz bildirilmedi';
  let code:ParagrafCoachSignal['actionCode'];
  let nextAction:string;
  if(t.delayedNovelWrong>=2){
   code='NEW_TEXT_FAILURE';
   nextAction='Farklı ve en az bir gün sonra çözülen yeni metinlerde hata tekrar ediyor. Koç, yanlış gerekçeyi yeniden inceleyip başka özgün soruyla kontrol etmeli.';
  }else if(t.delayedWrong>=2){
   code='REPEATED_FAILURE';
   nextAction='Tekrarlayan bağımsız tekrar yanlışlarını koçla adım adım incele; metin kanıtını ve çeldiriciyi karşılaştır. Sonra farklı bir soruyla yeniden ölç.';
  }else if(t.overdue>0){
   code='OVERDUE';
   nextAction='Geciken kişisel tekrarları tamamlat; eski cevabı ezberletmeden soru kökü ve kanıt üzerinden bağımsız çözümü kontrol et.';
  }else if(t.independentAttempts>0&&t.independentCorrect<t.independentAttempts){
   code='TRANSFER_GAP';
   nextAction='Yönlendirmeli çözümden sonra farklı soruya aktarımda hata var. Önce yanılgıyı gider, sonra yeni ve cevabı gizli bir soruyla tekrar dene.';
  }else if(t.blank>0&&t.reported.SURE>0&&!t.wrong){
   code='TIME_BLANK';
   nextAction='Önce süresiz doğru çözdür, ardından yeni soruda süre ölç. Süre nedeniyle boş bırakma öğrenci beyanıdır.';
  }else if(t.wrong+t.blank>0&&Object.keys(t.reported).length===0){
   code='UNCLASSIFIED';
   nextAction='Önce hata/boş nedeni için öğrenciyle kısa görüşme yap; bilgi eksikliği veya süre sorunu olduğunu varsayma. Ardından yeni soru uygula.';
  }else if(t.delayedAttempts===0){
   code='PRACTICE';
   nextAction=opticalReasonAction(reason,t.blank>0&&!t.wrong)+' Öğrenmeyi 1–3–7–14–28. günlerde bağımsız tekrarlarla yeniden kontrol et.';
  }else{
   code='FOLLOW_UP';
   nextAction='Gecikmeli tekrar sonuçlarını izle; aynı sorunun tekrar edilmesi yeni metne beceri aktarımını tek başına kanıtlamaz.';
  }
  const priority=t.delayedNovelWrong*6+t.delayedWrong*5+t.overdue*4+
    (t.independentAttempts-t.independentCorrect)*3+t.wrong*2+t.blank;
  const enough=t.independentAttempts>=2&&t.delayedNovelAttempts>=2&&t.delayedNovelDates.size>=2;
  const observedChangePp=enough?Math.round(100*(t.delayedNovelCorrect/t.delayedNovelAttempts-
    t.independentCorrect/t.independentAttempts)):null;
  const observedTrend:ParagrafCoachSignal['observedTrend']=observedChangePp===null?'INSUFFICIENT':
    observedChangePp>=15?'IMPROVING':observedChangePp<=-15?'DECLINING':'STABLE';
  return {
   topic:t.topic,wrong:t.wrong,blank:t.blank,
   independentAttempts:t.independentAttempts,independentCorrect:t.independentCorrect,
   justifiedAttempts:t.justifiedAttempts,reviewAttempts:t.reviewAttempts,reviewCorrect:t.reviewCorrect,
   delayedAttempts:t.delayedAttempts,delayedCorrect:t.delayedCorrect,delayedWrong:t.delayedWrong,
   delayedDays:t.delayedDates.size,delayedDistinctQuestions:t.delayedQuestionIds.size,
   overdue:t.overdue,primaryReason:reasonLabel,
   followupAttempts:t.followupAttempts,followupCorrect:t.followupCorrect,
   delayedNovelAttempts:t.delayedNovelAttempts,delayedNovelCorrect:t.delayedNovelCorrect,
   delayedNovelWrong:t.delayedNovelWrong,delayedNovelDays:t.delayedNovelDates.size,
   observedChangePp,observedTrend,observationalOnly:true as const,
   primaryReasonSource:reason?'STUDENT_SELF_REPORT' as const:'UNKNOWN' as const,
   actionCode:code,nextAction,priority,
   evidenceLevel:(t.delayedAttempts||t.delayedNovelAttempts?'DELAYED_REVIEW':t.independentAttempts||t.followupAttempts?'IMMEDIATE_TRANSFER':'INITIAL_ONLY') as ParagrafCoachSignal['evidenceLevel'],
   retentionVerified:false as const
  };
 }).sort((a,b)=>b.priority-a.priority||b.wrong-a.wrong||a.topic.localeCompare(b.topic,'tr'));

 return {windowDays:90,totalOpticalTests:seenTests.size,topics:signals,
  note:'Yalnız öğrenci onayıyla kaydedilen optik, yeni özgün sorular ve kişisel tekrarlar sayılmıştır. Önce-sonra farkı gözlemseldir; koç müdahalesinin nedensel etkisini kanıtlamaz. Aynı sorunun doğru tekrarı yeni metne aktarım kanıtı değildir. Hata nedenleri öz bildirimdir.'};
}
