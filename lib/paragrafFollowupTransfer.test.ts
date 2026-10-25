import {describe,expect,it} from 'vitest';
import type {ParagrafChoiceLetter} from './paragrafDetailedSolutions';
import {detailedQuestions} from './paragrafOptik';
import {FOLLOWUP_PREFIX,followupLegacyPrefix,getFollowupSource,pickFollowupTransfer,
 publicFollowupTransfer,gradeFollowupTransfer,usedFollowupQuestionIds} from './paragrafFollowupTransfer';

const original=detailedQuestions(1)!;
const marks=(original[0].answer==='A'?'B':'A')+'X'+original.slice(2).map(x=>x.answer).join('');

describe('independent paragraph follow-up selection',()=>{
 it('selects unseen questions from another print test for wrong or blank',()=>{
  for(const sourceNo of [1,2]){
   const q=pickFollowupTransfer(1,marks,sourceNo,new Set());
   expect(q).toBeTruthy();
   expect(q!.testNo).not.toBe(1);
   expect(q!.topic).toBe(original[sourceNo-1].topic);
   const outward=publicFollowupTransfer(q!,sourceNo);
   expect(outward.questionId).toBe(q!.id);
   expect(outward).not.toHaveProperty('answer');
   expect(outward).not.toHaveProperty('teaching');
  }
 });
 it('never repeats the previously used original follow-up candidate',()=>{
  const first=pickFollowupTransfer(1,marks,1,new Set())!;
  const next=pickFollowupTransfer(1,marks,1,new Set([first.id]))!;
  expect(next.id).not.toBe(first.id);
  const result=gradeFollowupTransfer(next,next.answer as ParagrafChoiceLetter);
  expect(result).toMatchObject({correct:true,countsAsMastery:false});
 });
 it('declines to generate a fake candidate for first-try correct questions',()=>{
  expect(getFollowupSource(1,marks,3)).toBeNull();
  expect(pickFollowupTransfer(1,marks,3,new Set())).toBeNull();
  expect(getFollowupSource(51,marks,1)).toBeNull();
 });
 it('excludes the first opt-in different-question and all prior student followups',()=>{
  const q=pickFollowupTransfer(1,marks,1,new Set())!;
  const next=pickFollowupTransfer(1,marks,1,new Set([q.id]))!;
  const used=usedFollowupQuestionIds({independentChecks:[{questionId:q.id}]},
   [{kind:'PARAGRAF_INDEPENDENT_FOLLOWUP',questionId:next.id},
    {kind:'UNRELATED',questionId:'99999'}]);
  expect([...used]).toEqual([q.id,next.id]);
  expect(pickFollowupTransfer(1,marks,1,used)?.id).not.toBe(next.id);
  expect(followupLegacyPrefix('student-1',1,2)).toBe(FOLLOWUP_PREFIX+'student-1:01:02:');
 });
});
