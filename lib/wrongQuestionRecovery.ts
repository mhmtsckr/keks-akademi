/**
 * Yanlıştan Öğrenmeye: a self-reported mistake is separate from independent evidence.
 * Reflection does NOT validate the uploaded answer, teacher content or mastery.
 */
import {REMEDIATION_REASONS,type RemediationReason} from './wrongQuestionRemediation';

export const WRONG_REFLECTION_TYPE='WRONG_QUESTION_REFLECTION' as const;
export type ReflectionInput={
  questionId:string;
  reason:RemediationReason;
  mistakenStep:string;
  correctedPrinciple:string;
  nextTimeCheck:string;
};
export type WrongLearningEvent={id:string;createdAt:Date;payload:unknown};

function meta(x:unknown):Record<string,unknown>{
 return x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
}
function phrase(x:unknown){return typeof x==='string'?x:'';}
function freshType(event:WrongLearningEvent){return phrase(meta(event.payload).type);}
function sameQuestion(event:WrongLearningEvent,questionId:string){
 const p=meta(event.payload);
 if(p.type===WRONG_REFLECTION_TYPE)return p.questionId===questionId;
 if(p.type==='GUIDED_PRACTICE_RESULT')return p.originQuestionId===questionId;
 if(p.type==='REVIEW_RESULT')return p.questionId===questionId;
 return false;
}
export function mistakeAction(reason:RemediationReason){
 return REMEDIATION_REASONS[reason].instruction;
}
export type RecoveryStage='NEEDS_REFLECTION'|'READY_TO_PRACTICE'|'GUIDED_TRY_AGAIN'|'GUIDED_CORRECT'|'REVIEW_WRONG'|'REVIEW_CORRECT';
export const RECOVERY_LABELS:Record<RecoveryStage,string>={
 NEEDS_REFLECTION:'Hatanın nedeni yazılmadı',
 READY_TO_PRACTICE:'Düzeltme planı hazır; farklı örnek çalış',
 GUIDED_TRY_AGAIN:'Yeni örnekte eksik var; yeniden öğren',
 GUIDED_CORRECT:'Çözümlü örnek doğru; bağımsız tekrar bekleniyor',
 REVIEW_WRONG:'Bağımsız tekrarda güçlük var',
 REVIEW_CORRECT:'Bağımsız tekrar doğru; kalıcılık henüz kanıtlanmadı'
};
export function buildWrongRecovery(questionId:string,allEvents:readonly WrongLearningEvent[]){
 const events=allEvents.filter(e=>sameQuestion(e,questionId))
   .sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());
 const reflection=events.find(e=>freshType(e)===WRONG_REFLECTION_TYPE);
 const r=meta(reflection?.payload);
 const reason=phrase(r.reason) as RemediationReason;
 const validReason=Object.prototype.hasOwnProperty.call(REMEDIATION_REASONS,reason);
 const plannedAt=reflection?.createdAt||null;
 const after=plannedAt
   ?events.filter(e=>e.createdAt.getTime()>plannedAt.getTime())
   :[];
 const guided=after.find(e=>freshType(e)==='GUIDED_PRACTICE_RESULT');
 const review=after.find(e=>freshType(e)==='REVIEW_RESULT');
 const last=after.find(e=>freshType(e)==='GUIDED_PRACTICE_RESULT'||freshType(e)==='REVIEW_RESULT');
 const event=meta(last?.payload);
 let stage:RecoveryStage='NEEDS_REFLECTION';
 if(plannedAt){
  stage='READY_TO_PRACTICE';
  if(last){
   if(event.type==='GUIDED_PRACTICE_RESULT')stage=event.correct===true?'GUIDED_CORRECT':'GUIDED_TRY_AGAIN';
   if(event.type==='REVIEW_RESULT')stage=event.correct===true?'REVIEW_CORRECT':'REVIEW_WRONG';
  }
 }
 return {
  questionId,
  stage,label:RECOVERY_LABELS[stage],
  reflection:reflection&&validReason?{
   reason,reasonLabel:REMEDIATION_REASONS[reason].label,
   mistakenStep:phrase(r.mistakenStep),correctedPrinciple:phrase(r.correctedPrinciple),
   nextTimeCheck:phrase(r.nextTimeCheck),recordedAt:reflection.createdAt.toISOString(),
   suggestedAction:mistakeAction(reason)
  }:null,
  evidence:{
   guided:guided?{correct:meta(guided.payload).correct===true,at:guided.createdAt.toISOString()}:null,
   independentReview:review?{correct:meta(review.payload).correct===true,at:review.createdAt.toISOString()}:null,
   evidenceScope:'Son kişisel soru kayıtları. Çözümlü örnek başarısı kalıcı öğrenme değildir.'
  },
  masteryStatusUnchanged:true,reviewScheduleUnchanged:true
 };
}
