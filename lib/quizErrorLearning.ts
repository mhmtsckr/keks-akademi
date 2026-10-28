import {areEquivalentShortAnswers} from '@/lib/mathAnswerEquivalence';

/** Blank is a missing answer, not a wrong answer or a low-confidence guess. */
export type ErrorSource='WRONG'|'BLANK'|'MARKED';
export type QuizResponse=string|null|undefined;
export type QuizMarkedItem={id:string;correctAnswer:string;sourceKind:string};
export type QuizGrade={correct:number;wrong:number;blank:number;wrongIds:string[];blankIds:string[];answers:Record<string,string>};

const record=(value:unknown):Record<string,unknown>=>
  value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};

export function answerIsBlank(answer:QuizResponse):boolean{
 return answer==null||answer.trim().length===0;
}

export function gradePersonalQuiz(
 questions:readonly QuizMarkedItem[],responses:Record<string,QuizResponse>
):QuizGrade{
 let correct=0;
 const wrongIds:string[]=[],blankIds:string[]=[];
 const answers:Record<string,string>={};
 for(const q of questions){
  const raw=responses[q.id];
  const answer=raw==null?'':raw.trim();
  answers[q.id]=answer;
  if(answerIsBlank(answer)){blankIds.push(q.id);continue;}
  const correctNow=q.sourceKind.startsWith('STUDENT_WRONG:')
   ?areEquivalentShortAnswers(answer,q.correctAnswer)
   :answer===q.correctAnswer;
  if(correctNow)correct++;else wrongIds.push(q.id);
 }
 return {correct,wrong:wrongIds.length,blank:blankIds.length,wrongIds,blankIds,answers};
}

/** Only an attempt made by the current student may be used for the associated review.
 * A student-owned uploaded question keeps its explicit original BLANK/MARKED label. */
export function reasonForPersonalReview(input:{
  questionId:string;options:unknown;sourceKind:string;
  sourceAttempt?:{answers:unknown}|null
}):ErrorSource{
 const options=record(input.options);
 if(input.sourceKind.startsWith('STUDENT_WRONG:')){
  if(options.bankReason==='BLANK')return 'BLANK';
  if(options.bankReason==='MARKED')return 'MARKED';
  return 'WRONG';
 }
 if(input.sourceAttempt){
  const answers=record(input.sourceAttempt.answers);
  if(answerIsBlank(typeof answers[input.questionId]==='string'
    ?answers[input.questionId] as string:null))return 'BLANK';
 }
 return 'WRONG';
}
