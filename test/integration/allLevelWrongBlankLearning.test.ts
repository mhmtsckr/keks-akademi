import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({role:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.role}));

import {db,resetDb} from './db';
import {POST as submitQuiz} from '@/app/api/student/quizzes/[id]/attempt/route';
import {GET as reviewList} from '@/app/api/student/reviews/route';
import {GET as personalBank} from '@/app/api/student/personal-question-bank/route';
import {createPersonalBankQuiz} from '@/lib/personalQuestionBank';

type Learner={id:string;userId:string;gradeLevel:string;academicTrack:null};
let student:Learner,other:Learner;

async function makeStudent(code:string,gradeLevel:string):Promise<Learner>{
 const u=await db.user.create({data:{role:'STUDENT',name:code,status:'ACTIVE'}});
 const s=await db.student.create({data:{
  userId:u.id,fullName:code,studentCode:code,gradeLevel
 }});
 return {id:s.id,userId:u.id,gradeLevel,academicTrack:null};
}
function asStudent(s:Learner){
 mocks.role.mockResolvedValue({id:s.userId,role:'STUDENT',
  student:{id:s.id,gradeLevel:s.gradeLevel,academicTrack:s.academicTrack}});
}
async function makeQuestion(idSuffix:string,owner?:string){
 return db.questionBankItem.create({data:{
  examType:'TYT',subject:'Türkçe',topic:'Paragrafta Ana Düşünce',
  prompt:'Tamamen özgün test metni '+idSuffix,
  options:{A:'Birinci',B:'İkinci',C:'Üçüncü',D:'Dördüncü',E:'Beşinci'},
  correctAnswer:'C',
  active:!owner,reviewStatus:owner?'STUDENT_PRIVATE':'APPROVED',
  sourceKind:owner?'STUDENT_WRONG:'+owner:'ORIGINAL'
 }});
}
async function makeQuiz(ownerId:string,questions:string[],examType='TYT'){
 return db.practiceQuiz.create({data:{
  studentId:ownerId,title:'Yanlış ve Boş Testi',
  examType,subject:'Türkçe',topic:'Paragrafta Ana Düşünce',
  questionIds:questions
 }});
}
const post=(quizId:string,answers:Record<string,string|null>)=>
 submitQuiz(new Request('http://localhost/api/student/quizzes/'+quizId+'/attempt',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({answers})
 }),{params:Promise.resolve({id:quizId})});

beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 student=await makeStudent('QUIZ_STUDENT','Lise 12 | YKS');
 other=await makeStudent('QUIZ_OTHER','Lise 12 | YKS');
 asStudent(student);
});
describe('all-level server-verified wrong and blank learning / PostgreSQL',()=>{
 it('records two separate wrong/blank causes and enqueues both in 0-day SRS atomically',async()=>{
  const [qWrong,qBlank,qCorrect]=await Promise.all([
   makeQuestion('WRONG'),makeQuestion('BLANK'),makeQuestion('CORRECT')
  ]);
  const quiz=await makeQuiz(student.id,[qWrong.id,qBlank.id,qCorrect.id]);
  const response=await post(quiz.id,{[qWrong.id]:'B',[qBlank.id]:' ',[qCorrect.id]:'C'});
  expect(response.status).toBe(200);
  const payload=await response.json();
  expect(payload).toMatchObject({
   reviewAdded:2,wrongReviewAdded:1,blankReviewAdded:1,alreadySubmitted:false,
   attempt:{correct:1,wrong:1,blank:1}
  });
  expect(payload.remediation).toMatchObject({
   levelKey:'HIGH_12',supportMode:'INDEPENDENT',masteryVerified:false,
   evidenceStatus:'ANSWER_KEY_VERIFIED_SUBMISSION_NOT_MASTERY'
  });
  const rows=await db.reviewQueueItem.findMany({
   where:{studentId:student.id},orderBy:{questionId:'asc'},include:{sourceAttempt:true}
  });
  expect(rows).toHaveLength(2);
  expect(rows.every(x=>x.stepIndex===0&&x.status==='DUE'&&x.lastCorrect===false)).toBe(true);
  expect(rows.every(x=>x.sourceAttemptId===payload.attempt.id)).toBe(true);
  const event=await db.dailyLog.findFirstOrThrow({where:{
   studentId:student.id,payload:{path:['type'],equals:'QUIZ_WRONG_BLANK_V2'}
  }});
  const data=event.payload as Record<string,unknown>;
  expect(data.wrongQuestionIds).toEqual([qWrong.id]);
  expect(data.blankQuestionIds).toEqual([qBlank.id]);
  expect(data.independentMasteryVerified).toBe(false);
  expect(await db.studentReport.count({where:{studentId:student.id}})).toBe(1);
  expect(await db.practiceLog.count({where:{studentId:student.id}})).toBe(1);
 });
 it('preserves first immutable result when same quiz is sent again with different answers',async()=>{
  const q=await makeQuestion('BLANK-RETRY');
  const quiz=await makeQuiz(student.id,[q.id]);
  const first=await (await post(quiz.id,{})).json();
  expect(first).toMatchObject({attempt:{blank:1},blankReviewAdded:1});
  const repeated=await post(quiz.id,{[q.id]:'C'});
  expect(repeated.status).toBe(200);
  const p=await repeated.json();
  expect(p).toMatchObject({
   alreadySubmitted:true,reviewAdded:0,blankReviewAdded:0,attempt:{blank:1,correct:0}
  });
  expect(await db.practiceQuizAttempt.count({where:{quizId:quiz.id}})).toBe(1);
  expect(await db.dailyLog.count({where:{studentId:student.id,
   payload:{path:['type'],equals:'QUIZ_WRONG_BLANK_V2'}}})).toBe(1);
  expect(await db.reviewQueueItem.count({where:{studentId:student.id}})).toBe(1);
 });
 it('labels blank origins correctly on review and personal bank without leaking the answer',async()=>{
  const [qBlank,qWrong]=await Promise.all([makeQuestion('BLANK'),makeQuestion('WRONG')]);
  const quiz=await makeQuiz(student.id,[qBlank.id,qWrong.id]);
  await post(quiz.id,{[qBlank.id]:null,[qWrong.id]:'A'});
  const review=await reviewList();
  expect(review.status).toBe(200);
  const body=await review.json();
  const b=body.items.find((x:{question:{id:string}})=>x.question.id===qBlank.id);
  expect(b.originReason).toBe('BLANK');
  expect(b.support.learningPlan.status).toBe('BLANK');
  expect(JSON.stringify(b.question)).not.toContain('correctAnswer');
  expect(body.recoveryPolicy.levelKey).toBe('HIGH_12');
  const bank=await personalBank();
  expect(bank.status).toBe(200);
  const bankBody=await bank.json();
  expect(bankBody.stats).toMatchObject({wrong:1,blank:1});
  expect(bankBody.items.find((x:{questionId:string})=>x.questionId===qBlank.id).reason).toBe('BLANK');
 });
 it('keeps essay-style reviewed items answerable and hides choice metadata from learners',async()=>{
  const free=await db.questionBankItem.create({data:{
   examType:'OKUL',subject:'Türkçe',topic:'Kısa Cevap',prompt:'Kendi cümlelerinle açıkla.',
   options:{},correctAnswer:'Örnek cevap',active:true,reviewStatus:'APPROVED',
   sourceKind:'ORIGINAL'
  }});
  const choice=await db.questionBankItem.create({data:{
   examType:'TYT',subject:'Türkçe',topic:'Paragraf',prompt:'Hangi seçenek?',
   options:{A:'A şıkkı',B:'B şıkkı',C:'C şıkkı',D:'D şıkkı',E:'E şıkkı',
    _privateSolution:'DO_NOT_SEND_KEY',correctAnswer:'DO_NOT_SEND_KEY'},
   correctAnswer:'C',active:true,reviewStatus:'APPROVED',sourceKind:'ORIGINAL'
  }});
  await db.reviewQueueItem.createMany({data:[free,choice].map(q=>({
   studentId:student.id,questionId:q.id,stepIndex:0,dueAt:new Date(),status:'DUE'
  }))});
  const response=await reviewList();
  expect(response.status).toBe(200);
  const data=await response.json();
  const f=data.items.find((x:{question:{id:string}})=>x.question.id===free.id);
  const c=data.items.find((x:{question:{id:string}})=>x.question.id===choice.id);
  expect(f.question.inputMode).toBe('TEXT');
  expect(c.question.inputMode).toBe('CHOICE');
  expect(Object.keys(c.question.options)).toEqual(['A','B','C','D','E']);
  expect(JSON.stringify(c.question)).not.toContain('DO_NOT_SEND_KEY');
 });
 it('rejects answer IDs outside the quiz and cannot include foreign student uploads',async()=>{
  const own=await makeQuestion('OWN');
  const foreign=await makeQuestion('FOREIGN',other.id);
  const quiz=await makeQuiz(student.id,[own.id]);
  expect((await post(quiz.id,{[foreign.id]:'C'})).status).toBe(400);
  const quiz2=await makeQuiz(student.id,[foreign.id]);
  expect((await post(quiz2.id,{[foreign.id]:'C'})).status).toBe(403);
  expect(await db.practiceQuizAttempt.count()).toBe(0);
 });
 it('prevents one student from accessing another learner\'s quiz',async()=>{
  const q=await makeQuestion('UNRELATED');
  const quiz=await makeQuiz(student.id,[q.id]);
  asStudent(other);
  expect((await post(quiz.id,{})).status).toBe(404);
  expect(await db.practiceQuizAttempt.count()).toBe(0);
 });
 it('caps generated personal quiz load by learner level instead of 15–24 questions',async()=>{
  const records=[
   ['İlkokul 1-2-3 | Maarif Model',4],
   ['İlkokul 4 | Proje Ortaokuluna Hazırlık',6],
   ['Ortaokul 5-6 | Maarif Model',8],
   ['Ortaokul 7 | Maarif Model',10],
   ['Ortaokul 8 | Maarif Model',12],
   ['Lise 9-10 | Maarif Model',12],
   ['Lise 11 | Maarif Model',15],
   ['Lise 12 | YKS',20],
   ['Mezun | YKS',20]
  ] as const;
  const common=[];
  for(let i=0;i<24;i++)common.push(await makeQuestion('SHARED-'+i));
  for(const [grade,cap] of records){
   const s=await makeStudent('LEVEL_'+cap+'_'+grade.replace(/\W/g,'').slice(0,10),grade);
   // Use a distinct student's opt-in reviews; never assign someone else's private upload.
   await db.reviewQueueItem.createMany({data:common.map(q=>({
    studentId:s.id,questionId:q.id,stepIndex:0,dueAt:new Date(),status:'DUE'
   }))});
   const generated=await createPersonalBankQuiz({
    studentId:s.id,userId:s.userId,kind:'WEEKLY_WRONGS',count:40
   });
   expect(generated?.questions).toHaveLength(cap);
   expect(generated?.quiz.maxQuestions).toBe(cap);
  }
 });
});
