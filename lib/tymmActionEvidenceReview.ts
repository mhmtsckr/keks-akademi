/**
 * Student self-report is not an educator evaluation.
 * New remediation assignments require explicit human review of the student's evidence.
 */
export type ActionDecision='ACCEPT'|'REVISE';
export type ActionStatus='ASSIGNED'|'SUBMITTED_FOR_REVIEW'|'REVISION_REQUIRED'|'VERIFIED'|'COACH_DISCUSSION_REQUIRED'|'DONE';
export const MAX_REMEDIATION_ATTEMPTS=3;
export type ActionAttempt={number:number;reflection:string;submittedAt:string};
export type ActionReview={attempt:number;decision:ActionDecision;feedback:string;reviewedAt:string;coachUserId:string;coachProfileId:string};

function objects(v:unknown):Record<string,unknown>{
 return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}
export function actionAttempts(payload:Record<string,unknown>):ActionAttempt[]{
 const stored=payload.submissionHistory;
 if(!Array.isArray(stored))return [];
 return stored.flatMap(x=>{
  const v=objects(x);
  if(!Number.isInteger(v.number)||typeof v.reflection!=='string'||typeof v.submittedAt!=='string')return [];
  if(Number(v.number)<1||Number(v.number)>MAX_REMEDIATION_ATTEMPTS||v.reflection.length>1800)return [];
  return [{number:Number(v.number),reflection:v.reflection,submittedAt:v.submittedAt}];
 });
}
export function actionReviews(payload:Record<string,unknown>):ActionReview[]{
 const stored=payload.reviewHistory;
 if(!Array.isArray(stored))return [];
 return stored.flatMap(x=>{
  const v=objects(x);
  if(!Number.isInteger(v.attempt)||!['ACCEPT','REVISE'].includes(String(v.decision))||
    typeof v.feedback!=='string'||typeof v.reviewedAt!=='string'||
    typeof v.coachUserId!=='string'||typeof v.coachProfileId!=='string')return [];
  return [{attempt:Number(v.attempt),decision:v.decision as ActionDecision,
    feedback:v.feedback,reviewedAt:v.reviewedAt,
    coachUserId:v.coachUserId,coachProfileId:v.coachProfileId}];
 });
}
export function submitActionEvidence(payload:Record<string,unknown>,reflection:string,submittedAt:string){
 if(payload.type!=='TYMM_RUBRIC_ACTION')throw new Error('Telafi görevi değil.');
 if(!['ASSIGNED','REVISION_REQUIRED'].includes(String(payload.status)))throw new Error('Bu görev öğrenci teslimine açık değil.');
 if(reflection.trim().length<40||reflection.trim().length>1800)throw new Error('Yanıt 40-1800 karakter olmalı.');
 const attempts=actionAttempts(payload);
 if(attempts.length>=MAX_REMEDIATION_ATTEMPTS)throw new Error('Bu görev için deneme sınırı doldu; koç görüşmesi gerekiyor.');
 if(!Number.isFinite(Date.parse(submittedAt)))throw new Error('Teslim tarihi geçersiz.');
 const next={number:attempts.length+1,reflection:reflection.trim(),submittedAt};
 return {...payload,status:'SUBMITTED_FOR_REVIEW' as const,reflection:next.reflection,
  submittedAt,completedByStudent:true,
  submissionHistory:[...attempts,next],attemptCount:next.number,
  completedAt:null,masteryStatusUnchanged:true,reviewScheduleUnchanged:true};
}
export function reviewActionEvidence(payload:Record<string,unknown>,input:{
 decision:ActionDecision;feedback:string;reviewedAt:string;coachUserId:string;coachProfileId:string
}){
 if(payload.type!=='TYMM_RUBRIC_ACTION'||payload.status!=='SUBMITTED_FOR_REVIEW')throw new Error('İnceleme bekleyen telafi kanıtı bulunamadı.');
 const attempts=actionAttempts(payload);
 const last=attempts.at(-1);
 if(!last||!Number.isFinite(Date.parse(input.reviewedAt)))throw new Error('Öğrenci kanıtı veya inceleme tarihi geçersiz.');
 if(!['ACCEPT','REVISE'].includes(input.decision)||input.feedback.trim().length<30||input.feedback.trim().length>1800)throw new Error('Karar veya gerekçe geçersiz.');
 if(!input.coachUserId||!input.coachProfileId)throw new Error('Koç kimliği gerekli.');
 const history=actionReviews(payload);
 const review={attempt:last.number,decision:input.decision,feedback:input.feedback.trim(),
  reviewedAt:input.reviewedAt,coachUserId:input.coachUserId,coachProfileId:input.coachProfileId};
 const status=input.decision==='ACCEPT'?'VERIFIED' as const:
  last.number>=MAX_REMEDIATION_ATTEMPTS?'COACH_DISCUSSION_REQUIRED' as const:'REVISION_REQUIRED' as const;
 return {...payload,status,review,reviewHistory:[...history,review],reviewedAt:input.reviewedAt,
  verifiedByCoach:status==='VERIFIED',completedAt:status==='VERIFIED'?input.reviewedAt:null,
  masteryStatusUnchanged:true,reviewScheduleUnchanged:true};
}
