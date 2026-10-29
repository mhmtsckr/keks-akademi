import {BLANK_REASON_CODES,QUIZ_RECOVERY_EVIDENCE_TYPE,
 type BlankReasonCode} from '@/lib/blankReasonEvidence';

type EvidenceLog={date:Date;payload:unknown};
type SubmittedGrade={correct:number;wrong:number;blank:number;wrongIds:string[];blankIds:string[]};
type AttemptRef={id:string;quizId:string};
const object=(v:unknown):Record<string,unknown>=>
 v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
export function isBlankReasonCode(v:unknown):v is BlankReasonCode{
 return typeof v==='string'&&Object.prototype.hasOwnProperty.call(BLANK_REASON_CODES,v);
}

/**
 * Student-selected reasons are observations, NOT diagnosed learning problems.
 * Only accept a reason when a source event belongs to a real regraded quiz
 * attempt and EVERY reported wrong/blank outcome matches the answer key.
 * Forged, duplicated, incomplete and cross-quiz events are ignored entirely.
 */
export function verifiedBlankReasonsForAttempt(
 attempt:AttemptRef,grade:SubmittedGrade,logs:readonly EvidenceLog[]
):Map<string,BlankReasonCode>|null{
 const related=logs.filter(log=>{
  const p=object(log.payload);
  return p.type===QUIZ_RECOVERY_EVIDENCE_TYPE&&p.attemptId===attempt.id;
 });
 if(related.length!==1)return null;
 const p=object(related[0].payload);
 if(p.quizId!==attempt.quizId||p.version!==3||
  p.outcomeSource!=='SERVER_ANSWER_KEY'||p.verifiedMastery!==false||
  p.correct!==grade.correct||p.wrong!==grade.wrong||p.blank!==grade.blank||
  !Array.isArray(p.outcomes))return null;
 const expected=new Map<string,'WRONG'|'BLANK'>([
  ...grade.wrongIds.map(id=>[id,'WRONG'] as const),
  ...grade.blankIds.map(id=>[id,'BLANK'] as const)
 ]);
 if(p.outcomes.length!==expected.size)return null;
 const seen=new Set<string>(),reasons=new Map<string,BlankReasonCode>();
 for(const raw of p.outcomes){
  const entry=object(raw),id=entry.questionId,outcome=entry.outcome;
  if(typeof id!=='string'||!expected.has(id)||seen.has(id)||
   outcome!==expected.get(id))return null;
  seen.add(id);
  const reason=entry.blankReason;
  if(outcome==='WRONG'&&reason!=null)return null;
  if(outcome==='BLANK'&&reason!=null){
   if(!isBlankReasonCode(reason))return null;
   reasons.set(id,reason);
  }
 }
 return reasons;
}
