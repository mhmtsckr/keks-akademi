import {describe,expect,it} from 'vitest';
import {detailedQuestions} from '@/lib/paragrafOptik';
import {independentTransferFor} from '@/lib/paragrafIndependentTransfer';
import {summarizeParagrafCoachEvidence} from '@/lib/paragrafCoachRemediation';

const now=new Date('2026-10-25T12:00:00.000Z');
const first=new Date('2026-10-20T12:00:00.000Z');
const early=new Date('2026-10-20T12:15:00.000Z');
const late=new Date('2026-10-21T13:00:00.000Z');
const later=new Date('2026-10-23T13:00:00.000Z');
const questions=detailedQuestions(1)!;
const answers=questions.map(x=>x.answer);
const wrong=answers[0]==='A'?'B':'A';
const marks=wrong+'X'+answers.slice(2).join('');
const q1='KEKS_PRINT_A3_V1_Q00001';
const q2='KEKS_PRINT_A3_V1_Q00002';
const transfer=independentTransferFor(1,marks,1)!;
const stored=(date:Date,payload:unknown)=>({date,payload});
function optical(extra:Record<string,unknown>={}){
 return stored(first,{kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo:1,encoded:marks,
  reasons:{'1':'KARARSIZLIK','2':'SURE'},
  independentChecks:[
   {number:1,questionId:transfer.id,topic:questions[0].topic,
    kind:'INDEPENDENT_SAME_SKILL_TRANSFER',correct:true,
    evidence:'Bu seçeneği paragrafın genel savına dayanarak işaretledim.'}
  ],...extra});
}
const review=(date:Date,questionId:string,correct:boolean)=>
 stored(date,{type:'REVIEW_RESULT',questionId,correct,subject:'Türkçe',topic:questions[0].topic});

describe('KEKS Paragraf coach evidence aggregator',()=>{
 it('connects initial wrong/blank, immediate transfer, delayed review and overdue queue without mastery',()=>{
  const result=summarizeParagrafCoachEvidence([
   review(late,q1,true),optical(),review(early,q1,true)
  ],[
   {questionId:q1,status:'DUE',dueAt:new Date('2026-10-22T00:00:00.000Z')},
   {questionId:q2,status:'PENDING',dueAt:new Date('2026-11-01T00:00:00.000Z')},
   {questionId:'UNRELATED',status:'DUE',dueAt:first}
  ],now);
  expect(result.totalOpticalTests).toBe(1);
  expect(result.topics.reduce((n,r)=>n+r.wrong,0)).toBe(1);
  expect(result.topics.reduce((n,r)=>n+r.blank,0)).toBe(1);
  expect(result.topics.reduce((n,r)=>n+r.independentAttempts,0)).toBe(1);
  expect(result.topics.reduce((n,r)=>n+r.justifiedAttempts,0)).toBe(1);
  const source=result.topics.find(x=>x.topic===questions[0].topic)!;
  expect(source.reviewAttempts).toBe(2);
  expect(source.delayedAttempts).toBe(1);
  expect(source.delayedCorrect).toBe(1);
  expect(source.delayedDays).toBe(1);
  expect(source.overdue).toBe(1);
  expect(source.actionCode).toBe('OVERDUE');
  expect(source.primaryReasonSource).toBe('STUDENT_SELF_REPORT');
  expect(source.retentionVerified).toBe(false);
 });
 it('prioritizes two delayed failures over an immediate successful new question',()=>{
  const result=summarizeParagrafCoachEvidence([
   optical(),review(late,q1,false),review(later,q1,false)
  ],[],now);
  const topic=result.topics.find(x=>x.topic===questions[0].topic)!;
  expect(topic.independentCorrect).toBe(1);
  expect(topic.delayedWrong).toBe(2);
  expect(topic.delayedDays).toBe(2);
  expect(topic.actionCode).toBe('REPEATED_FAILURE');
  expect(topic.retentionVerified).toBe(false);
 });
 it('does not equate an immediate review or guided same-question recheck with retention',()=>{
  const result=summarizeParagrafCoachEvidence([
   optical({guidedRechecks:[{number:1,correct:true,countsAsMastery:false}]}),
   review(early,q1,true)
  ],[],now);
  const topic=result.topics.find(x=>x.topic===questions[0].topic)!;
  expect(topic.reviewAttempts).toBe(1);
  expect(topic.delayedAttempts).toBe(0);
  expect(topic.evidenceLevel).toBe('IMMEDIATE_TRANSFER');
  expect(topic.retentionVerified).toBe(false);
 });
 it('rejects malformed optical data, duplicate tests and non-imported question results',()=>{
  const old=stored(new Date('2026-01-01T12:00:00.000Z'),optical().payload);
  const invalid=stored(first,{kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo:99,encoded:marks});
  const other=stored(first,{kind:'SOME_PUBLIC_QR_RESULT',testNo:2,encoded:marks});
  const result=summarizeParagrafCoachEvidence([
   invalid,old,other,optical(),optical(),
   review(late,'KEKS_PRINT_A3_V1_Q00999',false),
   review(late,'OTHER_USER_STUDENT_Q',false)
  ],[],now);
  expect(result.totalOpticalTests).toBe(1);
  expect(result.topics.reduce((n,r)=>n+r.wrong+r.blank,0)).toBe(2);
  expect(result.topics.reduce((n,r)=>n+r.reviewAttempts,0)).toBe(0);
 });
 it('will not accept fake same-test transfer or a correct first-test question as remediation',()=>{
  const altered=optical({independentChecks:[
   {number:1,questionId:'00001',kind:'INDEPENDENT_SAME_SKILL_TRANSFER',correct:true,
    evidence:'Yeterli bir öğrenci açıklaması örneği.'},
   {number:3,questionId:transfer.id,kind:'INDEPENDENT_SAME_SKILL_TRANSFER',correct:true,
    evidence:'Bunun dayanağı metinde var.'}
  ]});
  const result=summarizeParagrafCoachEvidence([altered],[],now);
  expect(result.topics.reduce((n,r)=>n+r.independentAttempts,0)).toBe(0);
 });
 it('uses reason-specific time-blank guidance without inventing a diagnosis',()=>{
  const onlyBlank=answers.map((answer,i)=>i===0?'X':answer).join('');
  const result=summarizeParagrafCoachEvidence([stored(first,{
   kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo:1,encoded:onlyBlank,
   reasons:{'1':'SURE'}
  })],[],now);
  expect(result.topics[0].actionCode).toBe('TIME_BLANK');
  expect(result.topics[0].nextAction).toContain('süresiz');
  expect(result.topics[0].retentionVerified).toBe(false);
 });
 it('returns empty evidence honestly for a student without opt-in records',()=>{
  expect(summarizeParagrafCoachEvidence([],[],now)).toMatchObject({
   totalOpticalTests:0,topics:[]});
 });
});
