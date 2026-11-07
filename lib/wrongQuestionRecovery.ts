/**
 * A learner's reflection is a self-report, not an approved answer or mastery claim.
 * Guided examples, personal-question reviews and new-question transfer must remain
 * distinct evidence. This module recommends a next task; it never changes the queue.
 */
import {REMEDIATION_REASONS,type RemediationReason} from './wrongQuestionRemediation';
import {levelAwareErrorRecovery} from './levelAwareErrorRecovery';
import {BLANK_REASON_CODES,blankReasonAction} from './blankReasonEvidence';

export const WRONG_REFLECTION_TYPE='WRONG_QUESTION_REFLECTION' as const;
export type ReflectionInput={
  questionId:string;
  reason:RemediationReason;
  mistakenStep:string;
  correctedPrinciple:string;
  nextTimeCheck:string;
};
export type WrongLearningEvent={id:string;createdAt:Date;payload:unknown};
export type RecoveryContext={
  bankReason?:'WRONG'|'BLANK'|'MARKED';
  gradeLevel?:string|null;
  examType?:string|null;
  topic?:string|null;
  classificationConfidence?:number|null;
};
export type NextRecoveryTask={
  code:'VERIFY_LEVEL'|'CONFIRM_TOPIC'|'REFLECT'|'COACH_REVIEW'|'RELEARN'|'GUIDED_PRACTICE'|'TRANSFER_CHECK';
  title:string;
  instruction:string;
  freshQuestionTarget:number;
  maxSessionMinutes:number;
  coachSupportSuggested:boolean;
};

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
function reviewIsBlank(event:WrongLearningEvent){
 const p=meta(event.payload);
 return p.outcome==='BLANK'||p.blank===true;
}
export function mistakeAction(reason:RemediationReason){
 return REMEDIATION_REASONS[reason].instruction;
}
export type RecoveryStage='NEEDS_REFLECTION'|'READY_TO_PRACTICE'|'GUIDED_TRY_AGAIN'|'GUIDED_CORRECT'|'REVIEW_WRONG'|'REVIEW_BLANK'|'REVIEW_CORRECT';
export const RECOVERY_LABELS:Record<RecoveryStage,string>={
 NEEDS_REFLECTION:'Hata veya boş bırakma nedeni henüz yazılmadı',
 READY_TO_PRACTICE:'Düzeltme planı hazır; farklı örnek çalış',
 GUIDED_TRY_AGAIN:'Yeni örnekte eksik var; yeniden öğren',
 GUIDED_CORRECT:'Çözümlü örnek doğru; bağımsız tekrar bekleniyor',
 REVIEW_WRONG:'Kişisel soru tekrarında yanlış cevap var',
 REVIEW_BLANK:'Kişisel soru tekrarında yeniden boş bırakıldı',
 REVIEW_CORRECT:'Kişisel soru tekrarı doğru; kalıcılık henüz kanıtlanmadı'
};

export function buildWrongRecovery(
 questionId:string,allEvents:readonly WrongLearningEvent[],context:RecoveryContext={}
){
 const events=allEvents.filter(e=>sameQuestion(e,questionId))
   .sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()||b.id.localeCompare(a.id));
 const reflection=events.find(e=>freshType(e)===WRONG_REFLECTION_TYPE);
 const r=meta(reflection?.payload);
 const reason=phrase(r.reason) as RemediationReason;
 const validReason=Object.prototype.hasOwnProperty.call(REMEDIATION_REASONS,reason);
 const plannedAt=reflection&&validReason?reflection.createdAt:null;
 const after=plannedAt
   ?events.filter(e=>e.createdAt.getTime()>plannedAt.getTime())
   :[];
 const guided=after.find(e=>freshType(e)==='GUIDED_PRACTICE_RESULT');
 const reviews=after.filter(e=>freshType(e)==='REVIEW_RESULT');
 const review=reviews[0];
 const last=after.find(e=>freshType(e)==='GUIDED_PRACTICE_RESULT'||freshType(e)==='REVIEW_RESULT');
 const event=meta(last?.payload);
 let stage:RecoveryStage='NEEDS_REFLECTION';
 if(plannedAt){
  stage='READY_TO_PRACTICE';
  if(last){
   if(event.type==='GUIDED_PRACTICE_RESULT')stage=event.correct===true?'GUIDED_CORRECT':'GUIDED_TRY_AGAIN';
   if(event.type==='REVIEW_RESULT')stage=event.correct===true?'REVIEW_CORRECT':reviewIsBlank(last)?'REVIEW_BLANK':'REVIEW_WRONG';
  }
 }
 const consecutiveUnsuccessfulReviews=reviews.findIndex(e=>meta(e.payload).correct===true);
 const failureStreak=consecutiveUnsuccessfulReviews===-1?reviews.length:consecutiveUnsuccessfulReviews;
 const blankReviews=reviews.filter(reviewIsBlank).length;
 const failedReviews=reviews.filter(e=>meta(e.payload).correct!==true&&!reviewIsBlank(e)).length;
 const adaptation=levelAwareErrorRecovery({
  gradeLevel:context.gradeLevel,examType:context.examType,bankReason:context.bankReason
 });
 const defaultAction=validReason?mistakeAction(reason):context.bankReason==='BLANK'
  ?blankReasonAction(null):'Önce soru kökünü ve zorlandığın alt beceriyi belirle.';
 const isAmbiguousTopic=(context.classificationConfidence!=null&&context.classificationConfidence<0.65)
   ||context.topic?.trim().toLocaleLowerCase('tr-TR')==='genel / karma';
 const isBlankReflection=context.bankReason==='BLANK';
 const repeatedFailure=failureStreak>=2;
 let code:NextRecoveryTask['code'];
 let title:string;
 let instruction:string;
 if(adaptation.band==='UNRESOLVED'){
  code='VERIFY_LEVEL';
  title='Önce eğitim düzeyini veya sınav türünü doğrula';
  instruction='Öğrenci/koç profilinde eğitim düzeyini netleştir. Yanlış sınıfa göre soru önerilmez.';
 }else if(isAmbiguousTopic){
  code='CONFIRM_TOPIC';
  title='Alt konuyu doğrula';
  instruction='Otomatik konu eşleşmesini koçunla veya öğretmeninle kontrol et; farklı soru seçmeden önce alt beceriyi düzelt.';
 }else if(!plannedAt){
  code='REFLECT';
  title=isBlankReflection?'Boş bırakma nedenini ayırt et':'Hata nedenini ve düzeltme kuralını yaz';
  instruction=isBlankReflection
    ?'Bilgi, süre, soru kökü, yöntem veya kararsızlık arasında seçim yap; emin değilsen “Henüz belirleyemedim” seç.'
    :'Hangi adımda zorlandığını ve yeni soruda yapacağın somut kontrolü yaz.';
 }else if(repeatedFailure||(reason==='BELIRLENEMEDI'&&failureStreak>=1)){
  code='COACH_REVIEW';
  title='Koçla neden analizi yap';
  instruction='Son bağımsız tekrarlarda aynı kişisel soruda zorlanma sürüyor. Çözüm adımını ve alt beceriyi koçunla incele; ardından yeni onaylı soru ile dene.';
 }else if(review&&reviewIsBlank(review)&&meta(review.payload).correct!==true){
  code='RELEARN';
  title='Boş kalan adımı yeniden öğren';
  instruction=(reason in BLANK_REASON_CODES
    ?blankReasonAction(reason as keyof typeof BLANK_REASON_CODES):defaultAction)
   +' Önce kısa süresiz örnekle çalış; sonra yeni soruda yeniden dene.';
 }else if(stage==='REVIEW_WRONG'||stage==='GUIDED_TRY_AGAIN'){
  code='RELEARN';
  title='Zorlanılan adımı yeniden çalış';
  instruction=defaultAction+' Başka bir çözümlü örnek üzerinden hatanı kontrol et.';
 }else if(stage==='GUIDED_CORRECT'||stage==='REVIEW_CORRECT'){
  code='TRANSFER_CHECK';
  title='Yeni ve onaylı soruda bağımsız transferi dene';
  instruction='Önceki soruyu hatırlamak yerine aynı alt beceriden daha önce görmediğin onaylı farklı soruları yardım almadan çöz. Başarı kesin kalıcılık anlamına gelmez.';
 }else{
  code='GUIDED_PRACTICE';
  title='Çözümlü farklı örnekte stratejiyi uygula';
  instruction=defaultAction+' Çözümlü örneği çalış; bunun orijinal sorunun doğru çözümünü doğrulamadığını unutma.';
 }
 const actionable=code==='RELEARN'||code==='GUIDED_PRACTICE'||code==='TRANSFER_CHECK';
 const nextTask:NextRecoveryTask={
  code,title,instruction,
  freshQuestionTarget:actionable?adaptation.suggestedFreshQuestions:0,
  maxSessionMinutes:adaptation.maxSessionMinutes,
  coachSupportSuggested:code==='VERIFY_LEVEL'||code==='CONFIRM_TOPIC'||code==='COACH_REVIEW'
 };
 return {
  questionId,
  stage,label:RECOVERY_LABELS[stage],
  originKind:context.bankReason||'WRONG',
  reflection:reflection&&validReason?{
   reason,reasonLabel:REMEDIATION_REASONS[reason].label,
   mistakenStep:phrase(r.mistakenStep),correctedPrinciple:phrase(r.correctedPrinciple),
   nextTimeCheck:phrase(r.nextTimeCheck),recordedAt:reflection.createdAt.toISOString(),
   suggestedAction:mistakeAction(reason)
  }:null,
  evidence:{
   guided:guided?{correct:meta(guided.payload).correct===true,at:guided.createdAt.toISOString()}:null,
   independentReview:review?{
    correct:meta(review.payload).correct===true,
    blank:reviewIsBlank(review),at:review.createdAt.toISOString()
   }:null,
   reviewAttempts:reviews.length,wrongReviews:failedReviews,blankReviews,
   consecutiveUnsuccessfulReviews:failureStreak,
   evidenceScope:'Yalnız bu kişisel soruya ait yakın tarihli kayıtlar. Aynı sorunun tekrarı yeni soruya transfer veya kalıcı öğrenme kanıtı değildir.'
  },
  nextTask,
  adaptation:{band:adaptation.band,stage:adaptation.stage},
  masteryStatusUnchanged:true,reviewScheduleUnchanged:true
 };
}
