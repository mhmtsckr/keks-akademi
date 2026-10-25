import {gradeOptical} from '@/lib/paragrafOptik';
import {getParagrafDetailedSolution} from '@/lib/paragrafDetailedSolutions';
import {FOLLOWUP_EVENT} from '@/lib/paragrafFollowupTransfer';

export const PARAGRAF_COACH_ACTION_SOURCE='PARAGRAF_OPTIK_REMEDIATION_V1';
export const PARAGRAF_INTERVENTIONS={
 EVIDENCE_REVIEW:{
  label:'Metin kanıtı ve ana düşünce analizi',
  task:'Metindeki ana savı işaretle, seçtiğin şıkkın metin kanıtını yaz ve iki yeni paragrafı çöz.'
 },
 DISTRACTOR_ELIMINATION:{
  label:'Çeldirici eleme çalışması',
  task:'Yanlış çeldiriciyi neden elediğini açıkla; iki farklı paragrafta A–E seçeneklerini gerekçelendir.'
 },
 TIME_MANAGEMENT:{
  label:'Süre yönetimi ve kademeli hız',
  task:'Önce süresiz yeni soruyu çöz; sonra başka bir özgün soruyu süre tutarak tamamla.'
 },
 RETRIEVAL_PRACTICE:{
  label:'Aktif hatırlama ve yeni metin',
  task:'Çözümünü kapatıp beceriyi kendi cümlelerinle anlat; sonra iki yeni metinde uygula.'
 },
 SRS_CATCHUP:{
  label:'Geciken tekrarları giderme',
  task:'Önce geciken kişisel tekrarları tamamla, ardından iki yeni metinde bağımsız çözümü dene.'
 }
} as const;
export type ParagrafInterventionType=keyof typeof PARAGRAF_INTERVENTIONS;

type Log={date:Date;payload:unknown};
type Action={
 id:string;topic:string|null;description:string|null;title:string;
 status:string;createdAt:Date;periodEnd:Date;planSource:string
};
type Trial={topic:string;at:number;questionId:string;correct:boolean;kind:'INITIAL_CHECK'|'NOVEL_FOLLOWUP'};
const DAY=86400000;
const WINDOW=14*DAY;
const obj=(x:unknown):Record<string,unknown>=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
const twoDigits=(n:number)=>String(n).padStart(2,'0');
function sourceId(test:number,q:number){return String((test-1)*30+q).padStart(5,'0');}
function isPrintTest(v:unknown):v is number{return typeof v==='number'&&Number.isInteger(v)&&v>=1&&v<=50;}
function isQuestionNo(v:unknown):v is number{return typeof v==='number'&&Number.isInteger(v)&&v>=1&&v<=30;}
const validLetter=(v:unknown):v is 'A'|'B'|'C'|'D'|'E'=>typeof v==='string'&&/^[A-E]$/.test(v);

/** Only server-gradeable first-optical and distinct unseen text events.
 * Never count queued same-question reviews, repeated transfer questions or a
 * self-reported outcome without a matching answer key. */
export function verifiedParagrafTrials(logs:Log[],now=new Date()):Trial[]{
 const ordered=[...logs].filter(x=>x.date instanceof Date&&Number.isFinite(x.date.getTime())&&x.date.getTime()<=now.getTime())
  .sort((a,b)=>a.date.getTime()-b.date.getTime());
 const original=new Map<string,{topic:string;firstAt:number;testNo:number}>();
 const tests=new Map<number,number>();
 const taken=new Set<string>();
 const results:Trial[]=[];
 for(const row of ordered){
  const p=obj(row.payload);
  if(p.kind!=='PARAGRAF_OPTIK_WRONG_RECOVERY'||!isPrintTest(p.testNo)||tests.has(p.testNo)||
   typeof p.encoded!=='string'||!/^[A-EX]{30}$/.test(p.encoded))continue;
  const grade=gradeOptical(p.testNo,p.encoded);
  if(!grade)continue;
  tests.set(p.testNo,row.date.getTime());
  const missed=new Map<number,string>();
  for(const detail of grade.details)if(detail.status!=='DOĞRU'){
   missed.set(detail.number,detail.topic);
   original.set(sourceId(p.testNo,detail.number),
    {topic:detail.topic,firstAt:row.date.getTime(),testNo:p.testNo});
  }
  for(const item of Array.isArray(p.independentChecks)?p.independentChecks:[]){
   const c=obj(item);
   if(c.kind!=='INDEPENDENT_SAME_SKILL_TRANSFER'||!isQuestionNo(c.number)||
    !missed.has(c.number)||typeof c.questionId!=='string'||!/^[0-9]{5}$/.test(c.questionId)||
    !validLetter(c.chosen)||typeof c.correct!=='boolean'||taken.has(c.questionId))continue;
   const other=getParagrafDetailedSolution(c.questionId);
   if(!other||other.testNo===p.testNo||other.topic!==missed.get(c.number)||
     (c.chosen===other.answer)!==c.correct)continue;
   taken.add(c.questionId);
   results.push({topic:other.topic,at:row.date.getTime(),questionId:other.id,
    correct:c.correct,kind:'INITIAL_CHECK'});
  }
 }
 for(const row of ordered){
  const p=obj(row.payload);
  if(p.kind!==FOLLOWUP_EVENT||!isPrintTest(p.testNo)||!isQuestionNo(p.sourceQuestionNo)||
   typeof p.questionId!=='string'||!/^[0-9]{5}$/.test(p.questionId)||
   !validLetter(p.chosen)||typeof p.correct!=='boolean'||taken.has(p.questionId))continue;
  const src=original.get(sourceId(p.testNo,p.sourceQuestionNo));
  const question=getParagrafDetailedSolution(p.questionId);
  if(!src||!question||question.testNo===p.testNo||question.topic!==src.topic||
   src.firstAt>row.date.getTime()||(tests.has(question.testNo)&&tests.get(question.testNo)!<=row.date.getTime())||
   (p.chosen===question.answer)!==p.correct)continue;
  taken.add(p.questionId);
  results.push({topic:question.topic,at:row.date.getTime(),questionId:question.id,
   correct:p.correct,kind:'NOVEL_FOLLOWUP'});
 }
 return results.sort((a,b)=>a.at-b.at);
}
function summarize(trials:Trial[]){
 const correct=trials.filter(x=>x.correct).length;
 return {questions:trials.length,correct,wrong:trials.length-correct,
  accuracy:trials.length?Math.round(100*correct/trials.length):null,
  distinctDays:new Set(trials.map(x=>new Date(x.at).toISOString().slice(0,10))).size,
  distinctQuestions:new Set(trials.map(x=>x.questionId)).size};
}
export function summarizeParagrafInterventionImpact(actions:Action[],logs:Log[],now=new Date()){
 const trials=verifiedParagrafTrials(logs,now);
 const results=actions.filter(action=>action.planSource===PARAGRAF_COACH_ACTION_SOURCE)
  .sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()).map(action=>{
   const start=action.createdAt.getTime();
   const windowEnd=Math.min(action.periodEnd.getTime(),start+WINDOW);
   const before=trials.filter(x=>x.topic===action.topic&&x.at<start&&x.at>=start-WINDOW);
   // A new independent text after at least 24 hours is the only follow-up evidence.
   const after=trials.filter(x=>x.topic===action.topic&&x.kind==='NOVEL_FOLLOWUP'&&
    x.at>=start+DAY&&x.at<=windowEnd);
   const baseline=summarize(before);
   const followup=summarize(after);
   const overlap=actions.some(other=>other.id!==action.id&&other.planSource===PARAGRAF_COACH_ACTION_SOURCE&&
    other.topic===action.topic&&other.createdAt.getTime()>start&&
    other.createdAt.getTime()<windowEnd);
   const completeBaseline=baseline.questions>=2&&baseline.distinctQuestions>=2;
   const completeFollowup=followup.questions>=2&&followup.distinctDays>=2&&followup.distinctQuestions>=2;
   const status=action.status==='CANCELED'?'CANCELED':
    !completeBaseline?'INSUFFICIENT_BASELINE':
    now.getTime()<start+DAY?'WAITING_FOR_FOLLOWUP':
    !completeFollowup?'INSUFFICIENT_FOLLOWUP':
    overlap?'OVERLAPPING_INTERVENTIONS':'OBSERVABLE';
   const changePp=status==='OBSERVABLE'&&baseline.accuracy!==null&&followup.accuracy!==null?
    followup.accuracy-baseline.accuracy:null;
   return {
    id:action.id,topic:action.topic,title:action.title,description:action.description,
    status:action.status,assignedAt:action.createdAt.toISOString(),
    windowEndsAt:action.periodEnd.toISOString(),
    baseline,followup,changePp,observationStatus:status,
    overlappingInterventions:overlap,
    observationalOnly:true as const,verifiedMastery:false as const
   };
  });
 return {
  actions:results,
  summary:{
   recorded:results.length,
   observable:results.filter(x=>x.observationStatus==='OBSERVABLE').length,
   awaitingEvidence:results.filter(x=>x.observationStatus!=='OBSERVABLE').length
  },
  caveat:'Öncesi/sonrası yalnız farklı soruların sunucuda doğrulanmış kayıtlarına dayanır. En az iki başlangıç sorusu ve iki ayrı günde iki yeni soru gereklidir. Eş zamanlı müdahale varsa karşılaştırma gizlenir. Gözlemsel fark nedensellik veya kalıcı kazanım kanıtı değildir.'
 };
}
