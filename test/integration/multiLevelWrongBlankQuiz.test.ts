import {beforeEach,describe,expect,it,vi} from 'vitest';
const auth=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:auth.requireRole}));
import {db,resetDb} from './db';
import {POST as attempt} from '@/app/api/student/quizzes/[id]/attempt/route';
import {GET as bank,POST as bankPost} from '@/app/api/student/personal-question-bank/route';
import {QUIZ_RECOVERY_EVENT} from '@/lib/levelAwareWrongBlank';

let studentId:string,userId:string,quizId:string,qids:string[],foreignId:string;
const endpoint=(id:string)=>'http://localhost/api/student/quizzes/'+id+'/attempt';
const request=(id:string,body:unknown)=>new Request(endpoint(id),{
 method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
});
async function sampleStudent(code:string){
 const user=await db.user.create({data:{name:code,role:'STUDENT',status:'ACTIVE'}});
 const student=await db.student.create({data:{userId:user.id,fullName:code,studentCode:code,
  gradeLevel:'Ortaokul 7 | Maarif Model'}});
 return {id:student.id,userId:user.id,gradeLevel:student.gradeLevel};
}
async function setupQuestion(id:string,sourceKind='ORIGINAL'){
 return db.questionBankItem.create({data:{
  examType:'OKUL',subject:'Matematik',topic:'Tam Sayılar',prompt:id,
  options:{A:'1',B:'2',C:'3',D:'4',E:'5'},correctAnswer:'B',
  explanation:'Çözüm öğretmen tarafından doğrulanmıştır.',sourceKind,
  active:true,reviewStatus:'APPROVED'
 }});
}
beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 const learner=await sampleStudent('QUIZ_RECOVERY_LEARNER');
 studentId=learner.id;userId=learner.userId;
 const other=await sampleStudent('QUIZ_RECOVERY_OTHER');foreignId=other.id;
 auth.requireRole.mockResolvedValue({id:userId,role:'STUDENT',student:learner});
 const a=await setupQuestion('wrong');
 const b=await setupQuestion('blank');
 const c=await setupQuestion('correct');
 qids=[a.id,b.id,c.id];
 quizId=(await db.practiceQuiz.create({data:{
  studentId,title:'Sınıfa Uygun Matematik Çalışması',examType:'KAZANIM_TEKRAR',
  subject:'Matematik',topic:'Tam Sayılar',questionIds:qids,createdByUserId:userId
 }})).id;
});
describe('server-graded wrong and blank workflow for all education levels',()=>{
 it('separately creates repeat tasks for one wrong and one blank, not for correct',async()=>{
  const r=await attempt(request(quizId,{answers:{[qids[0]]:'A',[qids[2]]:'B'},
   blankReasons:{[qids[1]]:'SURE'}}),{params:Promise.resolve({id:quizId})});
  expect(r.status).toBe(200);
  const j=await r.json();
  expect(j.attempt).toMatchObject({correct:1,wrong:1,blank:1});
  expect(j).toMatchObject({reviewAdded:2,reviewAddedWrong:1,reviewAddedBlank:1,
   evidenceStatus:'SERVER_GRADED_NOT_MASTERY'});
  expect(j.recoveryLevel).toMatchObject({stage:'MIDDLE',grade:7});
  expect(j.feedback.map((x:{status:string})=>x.status)).toEqual(['WRONG','BLANK','CORRECT']);
  expect(j.feedback[1].nextAction.opening).toContain('süre tutmadan');
  expect(j.feedback[1].blankReason).toBe('SURE');
  expect((await db.reviewQueueItem.findMany({where:{studentId},orderBy:{questionId:'asc'}}))
   .map(x=>x.questionId).sort()).toEqual(qids.slice(0,2).sort());
  const log=await db.dailyLog.findFirst({where:{studentId,payload:{path:['type'],equals:QUIZ_RECOVERY_EVENT}}});
  expect(log).not.toBeNull();
  const p=log!.payload as Record<string,any>;
  expect(p.masteryVerified).toBe(false);
  expect(p.outcomes).toEqual(expect.arrayContaining([
   expect.objectContaining({questionId:qids[0],status:'WRONG',blankReason:null}),
   expect.objectContaining({questionId:qids[1],status:'BLANK',blankReason:'SURE'})
  ]));
  const personal=await bank();expect(personal.status).toBe(200);
  const bk=await personal.json();
  expect(bk.stats.wrong).toBe(1);
  expect(bk.stats.blank).toBe(1);
  expect(bk.items.find((x:{questionId:string})=>x.questionId===qids[1]).reason).toBe('BLANK');
 });
 it('does not replay test results or produce duplicate reports/queue changes',async()=>{
  const req=request(quizId,{answers:{[qids[0]]:'A'},blankReasons:{}});
  expect((await attempt(req,{params:Promise.resolve({id:quizId})})).status).toBe(200);
  const repeat=await attempt(request(quizId,{answers:{[qids[0]]:'B'}}),{params:Promise.resolve({id:quizId})});
  expect(repeat.status).toBe(409);
  expect(await db.practiceQuizAttempt.count({where:{studentId,quizId}})).toBe(1);
  expect(await db.studentReport.count({where:{studentId}})).toBe(1);
  expect(await db.dailyLog.count({where:{studentId,payload:{path:['type'],equals:QUIZ_RECOVERY_EVENT}}})).toBe(1);
 });
 it('does not accept an answer or blank reason for a question outside the quiz',async()=>{
  const r=await attempt(request(quizId,{answers:{unrelated:'A'}}),{params:Promise.resolve({id:quizId})});
  expect(r.status).toBe(400);
  const p=await attempt(request(quizId,{answers:{},blankReasons:{unrelated:'SURE'}}),
   {params:Promise.resolve({id:quizId})});
  expect(p.status).toBe(400);
  expect(await db.practiceQuizAttempt.count()).toBe(0);
 });
 it('does not accept a blank reason on an answered question or unknown reasons',async()=>{
  const r=await attempt(request(quizId,{answers:{[qids[0]]:'A'},
   blankReasons:{[qids[0]]:'SURE'}}),{params:Promise.resolve({id:quizId})});
  expect(r.status).toBe(400);
  const p=await attempt(request(quizId,{answers:{},blankReasons:{[qids[1]]:'A_DIAGNOSIS'}}),
   {params:Promise.resolve({id:quizId})});
  expect(p.status).toBe(400);
 });
 it('isolates another student quiz and rejects bookmarks for someone else private question',async()=>{
  const other=await db.student.findUniqueOrThrow({where:{id:foreignId}});
  auth.requireRole.mockResolvedValue({id:other.userId,role:'STUDENT',student:other});
  const r=await attempt(request(quizId,{answers:{}}),{params:Promise.resolve({id:quizId})});
  expect(r.status).toBe(404);
  const privateQuestion=await db.questionBankItem.create({data:{
   examType:'TYT',subject:'Türkçe',topic:'Paragraf',prompt:'Başkasının kişisel sorusu',
   options:{},correctAnswer:'A',active:false,reviewStatus:'STUDENT_PRIVATE',
   sourceKind:'STUDENT_WRONG:'+studentId
  }});
  const bookmark=await bankPost(new Request('http://localhost/api/student/personal-question-bank',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({action:'bookmark',questionId:privateQuestion.id,active:true})
  }));
  expect(bookmark.status).toBe(404);
  expect(await db.dailyLog.count({where:{studentId:foreignId}})).toBe(0);
 });
});
