import {describe,expect,it} from 'vitest';
import {summarizeTopicTransferEvidence,type TopicTransferAttempt,type TopicTransferQuestion} from './topicTransferEvidence';

const asOf=new Date('2026-11-12T12:00:00.000Z');
const days=(n:number)=>new Date(Date.UTC(2026,10,1+n,10));
function q(id:string,options:Partial<TopicTransferQuestion>={}):TopicTransferQuestion{
 return {id,subject:'Matematik',topic:'Problemler',examType:'TYT',sourceKind:'ORIGINAL',
  correctAnswer:'B',active:true,reviewStatus:'APPROVED',...options};
}
function attempt(id:string,qid:string,day:number,answer:string,options:{
 quizCreatedDay?:number;correct?:number;wrong?:number;blank?:number
}={}):TopicTransferAttempt{
 const correct=options.correct??(answer==='B'?1:0);
 const blank=options.blank??(answer?0:1);
 const wrong=options.wrong??(answer&&answer!=='B'?1:0);
 return {
  id,quizId:'quiz-'+id,createdAt:days(day),correct,wrong,blank,answers:{[qid]:answer},
  quiz:{questionIds:[qid],createdAt:days(options.quizCreatedDay??day),examType:'TYT'}
 };
}
const evaluate=(a:TopicTransferAttempt[],questions:TopicTransferQuestion[],truncated=false)=>
 summarizeTopicTransferEvidence(a,questions,'my-student',{asOf,truncated});

describe('independent, distinct-question, multi-day topic retention evidence',()=>{
 it('requires distinct approved questions on multiple days including day 7 for a strong observational signal',()=>{
  const questions=['q0','q1','q2','q3','q4'].map(id=>q(id));
  const trials=[
   attempt('baseline','q0',0,'A'),
   attempt('first-day','q1',1,'B'),
   attempt('third-day','q2',3,'B'),
   attempt('seventh-day','q3',7,'B'),
   attempt('eighth-day','q4',8,'B')
  ];
  const result=evaluate(trials,questions);
  expect(result.verifiedMastery).toBe(false);
  expect(result.verifiedQuizzes).toBe(5);
  expect(result.summary.strongSignals).toBe(1);
  expect(result.topics[0]).toMatchObject({
   subject:'Matematik',topic:'Problemler',status:'STRONG_TRANSFER_SIGNAL',
   newQuestions:4,delayedQuestions:4,delayedCorrect:4,delayedDays:4,
   accuracyPercent:100,hasDay7Evidence:true,verifiedMastery:false
  });
 });
 it('does not count repeated original questions as fresh learning evidence',()=>{
  const result=evaluate([
   attempt('base','q0',0,'A'),
   attempt('repeat1','q0',1,'B'),attempt('repeat2','q0',7,'B')
  ],[q('q0')]);
  expect(result.repeatedQuestionsExcluded).toBe(2);
  expect(result.topics[0]).toMatchObject({
   status:'NEEDS_NEW_QUESTIONS',newQuestions:0,delayedQuestions:0
  });
 });
 it('a question previously shown in an unsubmitted quiz is not a novel transfer question',()=>{
  const trials=[
   attempt('base','q0',0,'A'),attempt('first-completed','q1',2,'B')
  ];
  const result=summarizeTopicTransferEvidence(trials,[q('q0'),q('q1')],'my-student',{
   asOf,
   quizExposures:[
    {createdAt:days(-1),questionIds:['q1']},
    {createdAt:days(0),questionIds:['q0']},
    {createdAt:days(2),questionIds:['q1']}
   ]
  });
  expect(result.topics[0]).toMatchObject({
   status:'NEEDS_NEW_QUESTIONS',newQuestions:0,delayedQuestions:0
  });
 });
  it('does not count same day or previously prepared quizzes as delayed independent evidence',()=>{
  const sameDay=attempt('immediate','q1',0,'B');
  sameDay.createdAt=new Date(days(0).getTime()+60*60*1000);
  sameDay.quiz.createdAt=new Date(days(0).getTime()+30*60*1000);
  const prepared=attempt('prepared','q2',3,'B',{quizCreatedDay:0});
  prepared.quiz.createdAt=new Date(days(0).getTime()-60*60*1000);
  const result=evaluate([
   attempt('base','q0',0,'A'),sameDay,prepared
  ],['q0','q1','q2'].map(id=>q(id)));
  expect(result.topics[0]).toMatchObject({
   newQuestions:1,immediateQuestions:1,delayedQuestions:0,
   status:'NEEDS_DELAYED_EVIDENCE'
  });
 });
 it('reports support need when later independent approved questions still fail',()=>{
  const result=evaluate([
   attempt('base','q0',0,''),
   attempt('one','q1',1,'A'),
   attempt('two','q2',3,''),
   attempt('three','q3',7,'B')
  ],['q0','q1','q2','q3'].map(id=>q(id)));
  expect(result.topics[0]).toMatchObject({
   baselineWrong:0,baselineBlank:1,
   delayedWrong:1,delayedBlank:1,delayedCorrect:1,
   delayedQuestions:3,delayedDays:3,
   status:'NEEDS_SUPPORT'
  });
 });
 it('isolates exams and subject-topic contexts rather than blending TYT/AYT',()=>{
  const topics=evaluate([
   attempt('base','a0',0,'A'),
   attempt('tytnew','a1',2,'B'),
   attempt('aytbase','b0',0,'A')
  ],[q('a0'),q('a1'),q('b0',{examType:'AYT'})]);
  const byExam=new Map(topics.topics.map(x=>[x.examType,x]));
  expect(byExam.get('TYT')?.newQuestions).toBe(1);
  expect(byExam.get('AYT')?.newQuestions).toBe(0);
  expect(byExam.get('AYT')?.status).toBe('NEEDS_NEW_QUESTIONS');
 });
 it('excludes private and unapproved answer keys even when private results are correct',()=>{
  const questions=[
   q('base'),q('private',{sourceKind:'STUDENT_WRONG:my-student',reviewStatus:'STUDENT_PRIVATE',active:false}),
   q('withdrawn',{active:false,reviewStatus:'REJECTED'})
  ];
  const r=evaluate([
   attempt('base','base',0,'A'),
   attempt('private','private',2,'B'),
   attempt('withdrawn','withdrawn',7,'B')
  ],questions);
  expect(r.privateOrUnapprovedExcluded).toBe(2);
  expect(r.topics[0].status).toBe('NEEDS_NEW_QUESTIONS');
 });
 it('rejects foreign private content, forged summaries, and unexpected answer keys',()=>{
  const foreign=attempt('foreign','other',2,'B');
  const forged=attempt('forged','ok',2,'B',{correct:0,wrong:1});
  const unexpected=attempt('extra','ok',2,'A');
  unexpected.answers={outside:'A'};
  const result=evaluate([foreign,forged,unexpected],[q('other',{
   sourceKind:'STUDENT_WRONG:another-student',reviewStatus:'STUDENT_PRIVATE'
  }),q('ok')]);
  expect(result.verifiedQuizzes).toBe(0);
  expect(result.excludedQuizzes).toBe(3);
  expect(result.topics).toHaveLength(0);
 });
 it('suppresses strong claims if the ninety-day history is truncated',()=>{
  const attempts=[attempt('base','q0',0,'A'),...([1,3,7,8].map((d,i)=>attempt('novel-'+i,'q'+(i+1),d,'B')))];
  const result=evaluate(attempts,['q0','q1','q2','q3','q4'].map(id=>q(id)),true);
  expect(result.truncated).toBe(true);
  expect(result.summary.strongSignals).toBe(0);
  expect(result.topics[0].status).toBe('PROGRESS_OBSERVED');
 });
 it('a single successful quiz without an initial wrong/blank is not a verified mastered topic',()=>{
  const r=evaluate([attempt('ok','q1',0,'B')],[q('q1')]);
  expect(r.topics).toHaveLength(0);
  expect(r.verifiedMastery).toBe(false);
 });
});
