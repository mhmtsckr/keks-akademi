import {describe,it,expect} from 'vitest';
import {verifiedBlankReasonsForAttempt} from './quizBlankReasonTriage';
import {QUIZ_RECOVERY_EVIDENCE_TYPE} from './blankReasonEvidence';
const attempt={id:'attempt-1',quizId:'quiz-1'};
const grade={correct:1,wrong:1,blank:2,wrongIds:['qwrong'],
 blankIds:['qblank','qblank2']};
const payload={
 type:QUIZ_RECOVERY_EVIDENCE_TYPE,version:3,
 attemptId:'attempt-1',quizId:'quiz-1',outcomeSource:'SERVER_ANSWER_KEY',
 verifiedMastery:false,correct:1,wrong:1,blank:2,
 outcomes:[
  {questionId:'qwrong',outcome:'WRONG',blankReason:null},
  {questionId:'qblank',outcome:'BLANK',blankReason:'SURE'},
  {questionId:'qblank2',outcome:'BLANK',blankReason:null}
 ]
};
const log=(p:unknown)=>({date:new Date('2026-10-29T12:00:00Z'),payload:p});
describe('quiz evidence reasons stay a student report, not a diagnosis',()=>{
 it('accepts only real blank answers tied to regraded quiz identifiers',()=>{
  expect([...verifiedBlankReasonsForAttempt(attempt,grade,[log(payload)])!])
   .toEqual([['qblank','SURE']]);
 });
 it('rejects forged outcome, extra question, wrong result reason or mismatched count',()=>{
  const broken=[
   {...payload,quizId:'different'},
   {...payload,wrong:9},
   {...payload,verifiedMastery:true},
   {...payload,outcomeSource:'CLIENT'},
   {...payload,outcomes:[...payload.outcomes,{questionId:'other',outcome:'BLANK'}]},
   {...payload,outcomes:payload.outcomes.map((x,i)=>i===0?
    {...x,blankReason:'SURE'}:x)},
   {...payload,outcomes:payload.outcomes.map((x,i)=>i===1?
    {...x,blankReason:'FAKE'}:x)},
   {...payload,outcomes:payload.outcomes.map((x,i)=>i===1?
    {...x,outcome:'WRONG'}:x)}
  ];
  for(const event of broken){
   expect(verifiedBlankReasonsForAttempt(attempt,grade,[log(event)])).toBeNull();
  }
 });
 it('rejects duplicate or missing events instead of manufacturing a reason',()=>{
  expect(verifiedBlankReasonsForAttempt(attempt,grade,[])).toBeNull();
  expect(verifiedBlankReasonsForAttempt(attempt,grade,[log(payload),log(payload)]))
   .toBeNull();
 });
});
