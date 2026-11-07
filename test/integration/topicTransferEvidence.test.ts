import {beforeEach,describe,expect,it} from 'vitest';
import {db,resetDb} from './db';
import {loadTopicTransferEvidence} from '@/lib/topicTransferService';

const DAY=86400000;
const time=(ageDays:number)=>new Date(Date.now()-ageDays*DAY);
async function createStudent(code:string){
 return db.student.create({data:{studentCode:code,fullName:'Transfer test student'}});
}
async function question(id:string){
 return db.questionBankItem.create({data:{
  examType:'TYT',subject:'Matematik',topic:'Problemler',
  prompt:'Test sorusu '+id,correctAnswer:'B',options:{A:'4',B:'5'},
  sourceKind:'ORIGINAL',active:true,reviewStatus:'APPROVED'
 }});
}
async function solve(studentId:string,questionId:string,ageDays:number,answer:string){
 const attemptedAt=time(ageDays);
 const quiz=await db.practiceQuiz.create({data:{
  studentId,title:'Onaylı kazanım denemesi',examType:'TYT',
  subject:'Matematik',topic:'Problemler',questionIds:[questionId],
  createdAt:new Date(attemptedAt.getTime()-60000)
 }});
 const correct=answer==='B'?1:0,blank=answer?0:1;
 return db.practiceQuizAttempt.create({data:{
  quizId:quiz.id,studentId,answers:{[questionId]:answer},
  correct,wrong:correct||blank?0:1,blank,net:correct?1:0,
  createdAt:attemptedAt
 }});
}
beforeEach(async()=>{await resetDb()});
describe('topic transfer PostgreSQL-backed student isolation',()=>{
 it('observes first error -> four distinct approved answers across separate days',async()=>{
  const student=await createStudent('TOPIC_STUDENT_A');
  const peer=await createStudent('TOPIC_STUDENT_B');
  const questions=await Promise.all(['0','1','2','3','4'].map(question));
  const ages=[15,14,12,8,7];
  for(let i=0;i<5;i++)await solve(student.id,questions[i].id,ages[i],i===0?'A':'B');
  await solve(peer.id,questions[0].id,15,'A');
  const a=await loadTopicTransferEvidence(student.id);
  const b=await loadTopicTransferEvidence(peer.id);
  expect(a.verifiedQuizzes).toBe(5);
  expect(a.topics).toHaveLength(1);
  expect(a.topics[0]).toMatchObject({
   status:'STRONG_TRANSFER_SIGNAL',delayedCorrect:4,delayedDays:4,verifiedMastery:false
  });
  expect(b.verifiedQuizzes).toBe(1);
  expect(b.topics[0]).toMatchObject({
   status:'NEEDS_NEW_QUESTIONS',newQuestions:0,verifiedMastery:false
  });
 });
 it('excludes different questions already generated before the learner first failed',async()=>{
  const s=await createStudent('TOPIC_PREVIEWED_D');
  const baseline=await question('baseline-pre');
  const existing=await question('already-seen');
  await db.practiceQuiz.create({data:{
   studentId:s.id,title:'Önceden oluşturulmuş test',examType:'TYT',
   subject:'Matematik',topic:'Problemler',questionIds:[existing.id],
   createdAt:time(16)
  }});
  await solve(s.id,baseline.id,15,'A');
  await solve(s.id,existing.id,2,'B');
  const evidence=await loadTopicTransferEvidence(s.id);
  expect(evidence.topics[0]).toMatchObject({
   status:'NEEDS_NEW_QUESTIONS',newQuestions:0,delayedQuestions:0
  });
 });
  it('never treats a learner-entered private answer key as delayed approved transfer',async()=>{
  const s=await createStudent('TOPIC_PRIVATE_C');
  const baseline=await question('baseline');
  const privateQuestion=await db.questionBankItem.create({data:{
   examType:'TYT',subject:'Matematik',topic:'Problemler',
   prompt:'Öğrencinin özel sorusu',options:{bankReason:'WRONG'},
   correctAnswer:'B',sourceKind:'STUDENT_WRONG:'+s.id,
   active:false,reviewStatus:'STUDENT_PRIVATE'
  }});
  await solve(s.id,baseline.id,10,'A');
  await solve(s.id,privateQuestion.id,2,'B');
  const result=await loadTopicTransferEvidence(s.id);
  expect(result.privateOrUnapprovedExcluded).toBe(1);
  expect(result.topics[0]).toMatchObject({
   status:'NEEDS_NEW_QUESTIONS',delayedQuestions:0,verifiedMastery:false
  });
 });
});
