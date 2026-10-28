import {beforeEach,describe,expect,it,vi} from 'vitest';
const auth=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:auth.requireRole}));
import {db,resetDb} from './db';
import {POST as submit} from '@/app/api/student/quizzes/[id]/attempt/route';
import {GET as reviews} from '@/app/api/student/reviews/route';
import {GET as bank,POST as bankPost} from '@/app/api/student/personal-question-bank/route';

let studentId:string,studentUserId:string,otherStudentId:string,quizId:string,questionIds:string[];
const ctx=(id:string)=>({params:Promise.resolve({id})});
function attempt(id:string,answers:Record<string,string|null>){
 return submit(new Request('http://localhost/api/student/quizzes/'+id+'/attempt',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({answers})
 }),ctx(id));
}
beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 const user=await db.user.create({data:{name:'Grade learner',role:'STUDENT',status:'ACTIVE'}});
 const student=await db.student.create({data:{
  userId:user.id,fullName:'Grade learner',studentCode:'BLANK_LEARNER',
  gradeLevel:'İlkokul 1-2-3'
 }});
 studentId=student.id;studentUserId=user.id;
 auth.requireRole.mockResolvedValue({id:user.id,role:'STUDENT',student:{
  id:student.id,gradeLevel:student.gradeLevel,academicTrack:null
 }});
 const peer=await db.user.create({data:{name:'Peer',role:'STUDENT',status:'ACTIVE'}});
 otherStudentId=(await db.student.create({data:{
  userId:peer.id,fullName:'Peer',studentCode:'BLANK_PEER',
  gradeLevel:'İlkokul 1-2-3'
 }})).id;
 const a=await db.questionBankItem.create({data:{
  examType:'OKUL',subject:'Matematik',topic:'Toplama',prompt:'2+2=?',
  options:{A:'3',B:'4',C:'5'},correctAnswer:'B',sourceKind:'ORIGINAL'
 }});
 const b=await db.questionBankItem.create({data:{
  examType:'OKUL',subject:'Matematik',topic:'Toplama',prompt:'3+1=?',
  options:{A:'5',B:'4',C:'3'},correctAnswer:'B',sourceKind:'ORIGINAL'
 }});
 const c=await db.questionBankItem.create({data:{
  examType:'OKUL',subject:'Matematik',topic:'Toplama',prompt:'4+1=?',
  options:{A:'5',B:'4',C:'3'},correctAnswer:'A',sourceKind:'ORIGINAL'
 }});
 questionIds=[a.id,b.id,c.id];
 quizId=(await db.practiceQuiz.create({data:{
  studentId,title:'Temel dört işlem',examType:'OKUL',
  subject:'Matematik',topic:'Toplama',questionIds,createdByUserId:user.id
 }})).id;
});
describe('wrong + blank all-level quiz recovery / PostgreSQL',()=>{
 it('enqueues both wrong and blank from the same attempt; keeps grade-aware blank in reviews',async()=>{
  const response=await attempt(quizId,{
   [questionIds[0]]:null,[questionIds[1]]:'A',[questionIds[2]]:'A'
  });
  expect(response.status).toBe(200);
  const res=await response.json();
  expect(res.attempt).toMatchObject({correct:1,wrong:1,blank:1});
  expect(res).toMatchObject({reviewAdded:2,wrongAdded:1,blankAdded:1,
   evidenceStatus:'SERVER_GRADED_NOT_MASTERY'});
  const saved=await db.reviewQueueItem.findMany({
   where:{studentId},include:{sourceAttempt:true}
  });
  expect(saved).toHaveLength(2);
  const missed=saved.find(x=>x.questionId===questionIds[0])!;
  expect(missed.stepIndex).toBe(0);
  expect(missed.status).toBe('DUE');
  expect(missed.lastCorrect).toBeNull();
  expect((missed.sourceAttempt?.answers as Record<string,string>)[questionIds[0]]).toBe('');
  const result=await reviews();expect(result.status).toBe(200);
  const display=await result.json();
  const blank=display.items.find((x:{question:{id:string}})=>x.question.id===questionIds[0]);
  expect(blank.bankReason).toBe('BLANK');
  expect(blank.support.learningPlan.status).toBe('BLANK');
  expect(blank.support.learningPlan.adaptation.band).toBe('PRIMARY_123');
  expect(blank.support.learningPlan.adaptation.suggestedFreshQuestions).toBe(1);
  const wrong=display.items.find((x:{question:{id:string}})=>x.question.id===questionIds[1]);
  expect(wrong.bankReason).toBe('WRONG');
  const personal=await bank();const pb=await personal.json();
  expect(pb.stats).toMatchObject({blank:1,wrong:1});
  expect(pb.items.find((x:{questionId:string})=>x.questionId===questionIds[0]).reason).toBe('BLANK');
  expect(await db.studentReport.count({where:{studentId}})).toBe(1);
 });
 it('treats unanswered complete quizzes as blank, never wrong',async()=>{
  const r=await attempt(quizId,{});
  expect(r.status).toBe(200);
  expect((await r.json()).attempt).toMatchObject({correct:0,wrong:0,blank:3});
  expect(await db.reviewQueueItem.count({where:{studentId}})).toBe(3);
 });
 it('prevents duplicate or parallel attempts without corrupting review counts or reports',async()=>{
  const result=await Promise.all([attempt(quizId,{}),attempt(quizId,{})]);
  expect(result.map(x=>x.status).sort()).toEqual([200,409]);
  expect(await db.practiceQuizAttempt.count({where:{quizId}})).toBe(1);
  expect(await db.studentReport.count({where:{studentId}})).toBe(1);
  expect(await db.reviewQueueItem.count({where:{studentId}})).toBe(3);
 });
 it('rejects answers to questions not in the quiz and preserves database state',async()=>{
  const result=await attempt(quizId,{external:'A'});
  expect(result.status).toBe(400);
  expect(await db.practiceQuizAttempt.count()).toBe(0);
  expect(await db.reviewQueueItem.count()).toBe(0);
 });
 it('rejects attempted grading of another student private question in a tampered quiz',async()=>{
  const privateQ=await db.questionBankItem.create({data:{
   examType:'OKUL',subject:'Matematik',topic:'Toplama',prompt:'Özel soru',
   options:{bankReason:'WRONG'},correctAnswer:'5',
   sourceKind:'STUDENT_WRONG:'+otherStudentId,reviewStatus:'STUDENT_PRIVATE',active:false
  }});
  const unsafe=await db.practiceQuiz.create({data:{
   studentId,title:'Hatalı erişim',examType:'KISISEL',subject:'Matematik',
   topic:'Toplama',questionIds:[privateQ.id]
  }});
  expect((await attempt(unsafe.id,{})).status).toBe(409);
  expect(await db.practiceQuizAttempt.count()).toBe(0);
 });
 it('does not let a learner bookmark another student private upload',async()=>{
  const otherPrivate=await db.questionBankItem.create({data:{
   examType:'OKUL',subject:'Türkçe',topic:'Metin',prompt:'Özel soru',
   options:{bankReason:'BLANK'},correctAnswer:'C',
   sourceKind:'STUDENT_WRONG:'+otherStudentId,
   reviewStatus:'STUDENT_PRIVATE',active:false
  }});
  const r=await bankPost(new Request('http://localhost/api/student/personal-question-bank',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({action:'bookmark',questionId:otherPrivate.id,active:true})
  }));
  expect(r.status).toBe(404);
  expect(await db.dailyLog.count({where:{studentId}})).toBe(0);
 });
 it('excludes a withdrawn public question from quiz grading',async()=>{
  await db.questionBankItem.update({
   where:{id:questionIds[1]},data:{active:false,reviewStatus:'REJECTED'}
  });
  const r=await attempt(quizId,{});
  expect(r.status).toBe(409);
  expect(await db.practiceQuizAttempt.count()).toBe(0);
 });
});
