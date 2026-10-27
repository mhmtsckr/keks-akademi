import {getParagrafDetailedSolution,type ParagrafChoiceLetter} from '@/lib/paragrafDetailedSolutions';
import {gradeOptical} from '@/lib/paragrafOptik';
import {paragrafReadingGuide} from '@/lib/paragrafLearningPlaybook';
import type {IndependentTransfer} from '@/lib/paragrafIndependentTransfer';

export const FOLLOWUP_PREFIX='PARAGRAF_INDEPENDENT_FOLLOWUP:';
export const FOLLOWUP_EVENT='PARAGRAF_INDEPENDENT_FOLLOWUP';
export const EVIDENCE_MIN=15;
export const EVIDENCE_MAX=500;
const CHOICES=['A','B','C','D','E'] as const;
export function followupLegacyPrefix(studentId:string,testNo:number,sourceQuestionNo:number){
 return FOLLOWUP_PREFIX+studentId+':'+String(testNo).padStart(2,'0')+':'+
   String(sourceQuestionNo).padStart(2,'0')+':';
}
export function getFollowupSource(testNo:number,encoded:string,sourceQuestionNo:number){
 const graded=gradeOptical(testNo,encoded);
 if(!graded||!Number.isInteger(sourceQuestionNo)||sourceQuestionNo<1||sourceQuestionNo>30)return null;
 const original=graded.details[sourceQuestionNo-1];
 if(!original||original.status==='DOĞRU')return null;
 return original;
}
/** A previously unseen, already-authored KEKS question from a DIFFERENT test.
 * Previous exposure through the original opt-in or follow-up logs excludes the question.
 * Answer and explanation are withheld until the student submits their answer. */
export function pickFollowupTransfer(testNo:number,encoded:string,sourceQuestionNo:number,usedIds:ReadonlySet<string>){
 const original=getFollowupSource(testNo,encoded,sourceQuestionNo);
 if(!original)return null;
 const serial=(testNo-1)*30+sourceQuestionNo;
 for(let offset=37;offset<1537;offset++){
  const idx=((serial-1+offset)%1500)+1;
  const q=getParagrafDetailedSolution(String(idx).padStart(5,'0'));
  if(!q||q.testNo===testNo||q.topic!==original.topic||usedIds.has(q.id))continue;
  const question=q.question;
  if(!question?.passage?.trim()||!question?.stem?.trim()||
     CHOICES.some(k=>!question.choices?.[k]?.trim()))continue;
  return q;
 }
 return null;
}
export function publicFollowupTransfer(q:NonNullable<ReturnType<typeof pickFollowupTransfer>>,sourceQuestionNo:number):IndependentTransfer{
 return {
  sourceQuestionNo,questionId:q.id,testNo:q.testNo,questionNo:q.questionNo,topic:q.topic,
  passage:q.question.passage,stem:q.question.stem,choices:q.question.choices,
  readingGoal:paragrafReadingGuide(q.topic).focus
 };
}
export function gradeFollowupTransfer(q:NonNullable<ReturnType<typeof pickFollowupTransfer>>,answer:ParagrafChoiceLetter){
 const correct=answer===q.answer;
 return {
  questionId:q.id,topic:q.topic,chosen:answer,correct,correctAnswer:q.answer,
  chosenReason:q.teaching.analysis[answer].explanation,
  rightReason:q.teaching.analysis[q.answer as ParagrafChoiceLetter].explanation,
  lesson:q.teaching.lesson,learningCheck:q.teaching.check,countsAsMastery:false,
  recommendedNextStep:correct?
   'Yeni bir metinde doğru sonuca ulaştın. Diğer tarihlerdeki bağımsız çalışmalarla gelişimi kontrol et.':
   'Çeldiricinin metinle uyuşmadığı yeri bul, kısa dersi incele ve sonraki çalışmada farklı soru çöz.'
 };
}
export function usedFollowupQuestionIds(firstPayload:unknown,otherPayloads:unknown[]){
 const used=new Set<string>();
 const first=firstPayload&&typeof firstPayload==='object'&&!Array.isArray(firstPayload)?
  firstPayload as Record<string,unknown>:{};
 if(Array.isArray(first.independentChecks))for(const row of first.independentChecks){
  if(row&&typeof row==='object'&&typeof (row as {questionId?:unknown}).questionId==='string')
   used.add((row as {questionId:string}).questionId);
 }
 for(const value of otherPayloads){
  const p=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  if(p.kind===FOLLOWUP_EVENT&&typeof p.questionId==='string')used.add(p.questionId);
 }
 return used;
}
