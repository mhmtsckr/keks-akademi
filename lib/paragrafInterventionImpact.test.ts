import {describe,expect,it} from 'vitest';
import {detailedQuestions} from '@/lib/paragrafOptik';
import {independentTransferFor} from '@/lib/paragrafIndependentTransfer';
import {getParagrafDetailedSolution} from '@/lib/paragrafDetailedSolutions';
import {pickFollowupTransfer} from '@/lib/paragrafFollowupTransfer';
import {
 PARAGRAF_COACH_ACTION_SOURCE,summarizeParagrafInterventionImpact,verifiedParagrafTrials
} from '@/lib/paragrafInterventionImpact';

const original=detailedQuestions(1)!;
const mainTopic=original[0].topic;
const alternate=Array.from({length:1470},(_,i)=>getParagrafDetailedSolution(String(i+31).padStart(5,'0'))!)
 .find(q=>q.topic===mainTopic)!;
const secondTest=detailedQuestions(alternate.testNo)!;
const marksOne=original.map((q,i)=>i===0?(q.answer==='A'?'B':'A'):q.answer).join('');
const marksTwo=secondTest.map((q,i)=>i===alternate.questionNo-1?(q.answer==='A'?'B':'A'):q.answer).join('');
const baseA=independentTransferFor(1,marksOne,1)!;
const baseB=independentTransferFor(alternate.testNo,marksTwo,alternate.questionNo)!;
const wrong=(answer:string)=>answer==='A'?'B':'A';
const first=new Date('2026-10-10T12:00:00Z');
const second=new Date('2026-10-11T12:00:00Z');
const actionDate=new Date('2026-10-14T12:00:00Z');
const now=new Date('2026-10-24T12:00:00Z');
const asLog=(date:Date,payload:unknown)=>({date,payload});
const initial=(testNo:number,encoded:string,number:number,base:typeof baseA,date:Date,correct=false)=>
 asLog(date,{kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo,encoded,independentChecks:[
  {kind:'INDEPENDENT_SAME_SKILL_TRANSFER',number,questionId:base.id,
   chosen:correct?base.answer:wrong(base.answer),correct}
 ]});
const seen=new Set<string>([baseA.id,baseB.id]);
for(const testNo of [1,alternate.testNo])for(let n=1;n<=30;n++)
 seen.add(String((testNo-1)*30+n).padStart(5,'0'));
const novelA=pickFollowupTransfer(1,marksOne,1,seen)!;
seen.add(novelA.id);
const novelB=pickFollowupTransfer(alternate.testNo,marksTwo,alternate.questionNo,seen)!;
const follow=(date:Date,testNo:number,number:number,q:typeof novelA,correct:boolean)=>
 asLog(date,{kind:'PARAGRAF_INDEPENDENT_FOLLOWUP',testNo,sourceQuestionNo:number,
  questionId:q.id,chosen:correct?q.answer:wrong(q.answer),correct});
const action=(extra:Record<string,unknown>={})=>({
 id:'coach-action-01',topic:mainTopic,title:'Paragraf kanıt inceleme',
 description:'Koç iki farklı soru ile çalıştıracak.',status:'ACTIVE',
 createdAt:actionDate,periodEnd:new Date(actionDate.getTime()+14*86400000),
 planSource:PARAGRAF_COACH_ACTION_SOURCE,...extra
});
const baseline=[
 initial(1,marksOne,1,baseA,first,false),
 initial(alternate.testNo,marksTwo,alternate.questionNo,baseB,second,false)
];
const followups=[
 follow(new Date('2026-10-16T14:00:00Z'),1,1,novelA,true),
 follow(new Date('2026-10-20T14:00:00Z'),alternate.testNo,alternate.questionNo,novelB,true)
];

describe('paragraph coach action → independent question observed impact',()=>{
 it('requires enough new questions, 24h delay, two different days, and returns observational change',()=>{
  const report=summarizeParagrafInterventionImpact([action()],baseline.concat(followups),now);
  const row=report.actions[0];
  expect(row.observationStatus).toBe('OBSERVABLE');
  expect(row.baseline).toMatchObject({questions:2,correct:0,accuracy:0});
  expect(row.followup).toMatchObject({questions:2,correct:2,accuracy:100,distinctDays:2});
  expect(row.changePp).toBe(100);
  expect(row.observationalOnly).toBe(true);
  expect(row.verifiedMastery).toBe(false);
 });
 it('refuses a positive impact percentage with only one initial question',()=>{
  const row=summarizeParagrafInterventionImpact([action()],baseline.slice(0,1).concat(followups),now).actions[0];
  expect(row.observationStatus).toBe('INSUFFICIENT_BASELINE');
  expect(row.changePp).toBeNull();
 });
 it('refuses a percentage if followup questions are only on the same day',()=>{
  const sameDay=[
   follow(new Date('2026-10-16T14:00:00Z'),1,1,novelA,true),
   follow(new Date('2026-10-16T14:20:00Z'),alternate.testNo,alternate.questionNo,novelB,true)
  ];
  const row=summarizeParagrafInterventionImpact([action()],baseline.concat(sameDay),now).actions[0];
  expect(row.observationStatus).toBe('INSUFFICIENT_FOLLOWUP');
  expect(row.changePp).toBeNull();
 });
 it('excludes same-question repetition and immediate practice from post-intervention evidence',()=>{
  const early=follow(new Date('2026-10-14T14:00:00Z'),1,1,novelA,true);
  const originalReview=asLog(new Date('2026-10-19T13:00:00Z'),{
   type:'REVIEW_RESULT',questionId:'KEKS_PRINT_A3_V1_Q00001',correct:true});
  const row=summarizeParagrafInterventionImpact([action()],
   baseline.concat([early,originalReview,followups[1]]),now).actions[0];
  expect(row.followup.questions).toBe(1);
  expect(row.observationStatus).toBe('INSUFFICIENT_FOLLOWUP');
 });
 it('suppresses impact if another intervention on the same skill overlaps',()=>{
  const secondAction=action({id:'coach-action-02',
   createdAt:new Date('2026-10-16T13:00:00Z')});
  const row=summarizeParagrafInterventionImpact([action(),secondAction],
   baseline.concat(followups),now).actions.find(x=>x.id==='coach-action-01')!;
  expect(row.overlappingInterventions).toBe(true);
  expect(row.observationStatus).toBe('OVERLAPPING_INTERVENTIONS');
  expect(row.changePp).toBeNull();
 });
 it('does not claim benefit for canceled actions',()=>{
  const row=summarizeParagrafInterventionImpact([action({status:'CANCELED'})],
   baseline.concat(followups),now).actions[0];
  expect(row.observationStatus).toBe('CANCELED');
  expect(row.changePp).toBeNull();
 });
 it('rejects forged correctness, repeated question IDs and unrelated topic claims',()=>{
  const forged=follow(new Date('2026-10-22T12:00:00Z'),1,1,novelA,false);
  const p=forged.payload as Record<string,unknown>;
  p.chosen=novelA.answer;
  const unrelated=asLog(new Date('2026-10-22T13:00:00Z'),{
   kind:'PARAGRAF_INDEPENDENT_FOLLOWUP',testNo:1,sourceQuestionNo:3,
   questionId:novelB.id,chosen:novelB.answer,correct:true});
  const trials=verifiedParagrafTrials(baseline.concat(followups,[forged,unrelated]),now);
  expect(trials.filter(t=>t.kind==='NOVEL_FOLLOWUP')).toHaveLength(2);
  expect(new Set(trials.map(t=>t.questionId)).size).toBe(trials.length);
 });
});
