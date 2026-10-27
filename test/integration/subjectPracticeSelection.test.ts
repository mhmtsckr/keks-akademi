import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({role:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mock.role}));
import {db,resetDb} from './db';
import {POST} from '@/app/api/student/reviews/practice/route';

const url='http://localhost/api/student/reviews/practice';
const request=(reviewId:string)=>new Request(url,{method:'POST',
 headers:{'content-type':'application/json'},body:JSON.stringify({reviewId})});
let studentId:string,reviewId:string,otherStudentId:string;
async function createStudent(code:string,gradeLevel:string){
 const u=await db.user.create({data:{name:code,role:'STUDENT',status:'ACTIVE'}});
 const s=await db.student.create({data:{userId:u.id,fullName:code,studentCode:code,gradeLevel}});
 return {id:s.id,userId:u.id,gradeLevel};
}
async function question(subject:string,topic:string,examType:string,idSuffix:string,
 options:Record<string,unknown>={},reviewStatus='APPROVED',sourceKind='ORIGINAL'){
 return db.questionBankItem.create({data:{examType,subject,topic,
  prompt:'Alıştırma metni '+idSuffix,options:{A:'Seçenek A',B:'Seçenek B',C:'Seçenek C',D:'Seçenek D',E:'Seçenek E',...options},
  correctAnswer:'C',reviewStatus,sourceKind,active:true
 }});
}
async function quizFor(questionIds:string[],ownerId=studentId){
 return db.practiceQuiz.create({data:{studentId:ownerId,title:'Daha önce gösterilen sorular',
  examType:'KAZANIM_TEKRAR',subject:'Matematik',topic:'Problemler',questionIds}});
}
beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 const learner=await createStudent('SUBJECT_LEARNER','Mezun | YKS');
 studentId=learner.id;
 const other=await createStudent('SUBJECT_OTHER','Mezun | YKS');
 otherStudentId=other.id;
 mock.role.mockResolvedValue({id:learner.userId,role:'STUDENT',student:learner});
 const src=await question('Matematik','Problemler','TYT','KAYNAK',{},'STUDENT_PRIVATE','STUDENT_WRONG:'+studentId);
 reviewId=(await db.reviewQueueItem.create({data:{studentId,questionId:src.id,dueAt:new Date(),status:'DUE'}})).id;
});
describe('multi-subject approved unseen question selection / PostgreSQL',()=>{
 it('chooses only unseen approved TYT questions, hides correct answers and does not alter review queue',async()=>{
  const seen=await question('Matematik','Problemler','TYT','GÖRÜLDÜ');
  const a=await question('Matematik','Problemler','TYT','YENİ-A',
    {correctAnswer:'CACHED_PRIVATE_KEY',explanation:'CACHED_PRIVATE_SOLUTION'});
  const b=await question('Matematik','Problemler','TYT','YENİ-B');
  await question('Matematik','Problemler','AYT','YANLIŞ-SINAV');
  await question('Matematik','Problemler','TYT','ÖZEL',{},'STUDENT_PRIVATE','STUDENT_WRONG:'+otherStudentId);
  await quizFor([seen.id]);
  const originalQueue=await db.reviewQueueItem.count({where:{studentId}});
  const resp=await POST(request(reviewId));
  expect(resp.status).toBe(200);
  const body=await resp.json();
  expect(body.questions.map((q:{id:string})=>q.id)).toEqual([b.id,a.id]);
  expect(body.evidenceStatus).toBe('UNSEEN_APPROVED_QUESTION_NOT_MASTERY');
  expect(body.questions.some((q:{correctAnswer?:string})=>q.correctAnswer!==undefined)).toBe(false);
  expect(JSON.stringify(body.questions)).not.toContain('correctAnswer');
  expect(JSON.stringify(body.questions)).not.toContain('CACHED_PRIVATE_KEY');
  expect(JSON.stringify(body.questions)).not.toContain('CACHED_PRIVATE_SOLUTION');
  expect((await db.reviewQueueItem.count({where:{studentId}}))).toBe(originalQueue);
  const next=await POST(request(reviewId));
  expect(next.status).toBe(404);
  expect((await next.json()).code).toBe('NO_NEW_APPROVED_GRADE_MATCH');
 });
 it('does not allow another student to use this reviewId',async()=>{
  mock.role.mockResolvedValue({id:'other-user',role:'STUDENT',
    student:{id:otherStudentId,gradeLevel:'Mezun | YKS'}});
  const resp=await POST(request(reviewId));
  expect(resp.status).toBe(404);
  expect(await db.practiceQuiz.count({where:{studentId:otherStudentId}})).toBe(0);
 });
 it('requires exact 7th-grade school curriculum before presenting science examples',async()=>{
  const learner=await db.student.update({where:{id:studentId},
   data:{gradeLevel:'Ortaokul 7 | Maarif Model'}});
  mock.role.mockResolvedValue({id:learner.userId,role:'STUDENT',student:learner});
  const origin=await question('Fen Bilimleri','Madde ve Isı','OKUL','ORIG',
   {educationGrade:7},'STUDENT_PRIVATE','STUDENT_WRONG:'+studentId);
  const ri=await db.reviewQueueItem.create({data:{studentId,questionId:origin.id,dueAt:new Date()}});
  await question('Fen Bilimleri','Madde ve Isı','OKUL','NO-GRADE');
  await question('Fen Bilimleri','Madde ve Isı','OKUL','GRADE-8',{educationGrade:8});
  const seven=await question('Fen Bilimleri','Madde ve Isı','OKUL','GRADE-7',
   {educationGrade:7,curriculumFramework:'TYMM'});
  const r=await POST(request(ri.id));expect(r.status).toBe(200);
  const body=await r.json();expect(body.curriculum.grade).toBe(7);
  expect(body.questions.map((x:{id:string})=>x.id)).toEqual([seven.id]);
 });
 it('refuses a subject practice request when actual grade is unresolved',async()=>{
  const student=await db.student.update({where:{id:studentId},
   data:{gradeLevel:'Ortaokul 5-6 | Maarif Model'}});
  mock.role.mockResolvedValue({id:'learner',role:'STUDENT',student});
  const resp=await POST(request(reviewId));
  expect(resp.status).toBe(409);
  expect((await resp.json()).code).toBe('EDUCATION_LEVEL_UNRESOLVED');
  expect(await db.practiceQuiz.count()).toBe(0);
 });
 it('never silently recycles questions from personal review queue',async()=>{
  const seen=await question('Matematik','Problemler','TYT','QUEUED');
  await db.reviewQueueItem.create({data:{studentId,questionId:seen.id,dueAt:new Date()}});
  const resp=await POST(request(reviewId));
  expect(resp.status).toBe(404);
  expect((await resp.json()).code).toBe('NO_NEW_APPROVED_GRADE_MATCH');
 });
});
