import {beforeEach,describe,expect,it,vi} from 'vitest';
const auth=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:auth.requireRole}));
import {db,resetDb} from './db';
import {POST} from '@/app/api/student/reviews/route';

let studentId:string,userId:string,reviewId:string,questionId:string;
const request=(payload:unknown)=>new Request('http://localhost/api/student/reviews',{
 method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)
});
beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 const user=await db.user.create({data:{name:'Student review',role:'STUDENT',status:'ACTIVE'}});
 userId=user.id;
 studentId=(await db.student.create({data:{
  userId,fullName:'Student review',studentCode:'BLANK_REVIEW_STUDENT',
  gradeLevel:'İlkokul 4 | Proje Ortaokuluna Hazırlık'
 }})).id;
 const question=await db.questionBankItem.create({data:{
  examType:'OKUL',subject:'Matematik',topic:'Kesirler',
  prompt:'Bir bölü iki kaçtır?',options:{},correctAnswer:'1/2',
  explanation:'İki eş parçadan biridir.',reviewStatus:'STUDENT_PRIVATE',
  sourceKind:'STUDENT_WRONG:'+studentId,active:false
 }});
 questionId=question.id;
 reviewId=(await db.reviewQueueItem.create({data:{
  studentId,questionId,stepIndex:0,status:'DUE',dueAt:new Date(Date.now()-5000)
 }})).id;
 auth.requireRole.mockResolvedValue({id:userId,role:'STUDENT',student:{
  id:studentId,gradeLevel:'İlkokul 4 | Proje Ortaokuluna Hazırlık',academicTrack:null
 }});
});
describe('explicit blank spaced review',()=>{
 it('records blank separately, retains due review, does not claim mastery',async()=>{
  const response=await POST(request({id:reviewId,answer:'',submitBlank:true}));
  expect(response.status).toBe(200);
  const result=await response.json();
  expect(result).toMatchObject({ok:true,blank:true,outcome:'BLANK',correct:false,completed:false});
  const queue=await db.reviewQueueItem.findUniqueOrThrow({where:{id:reviewId}});
  expect(queue.stepIndex).toBe(0);
  expect(queue.status).not.toBe('COMPLETED');
  const events=await db.dailyLog.findMany({where:{
   studentId,payload:{path:['type'],equals:'REVIEW_RESULT'}
  }});
  expect(events).toHaveLength(1);
  expect(events[0].payload).toMatchObject({
   questionId,correct:false,blank:true,outcome:'BLANK'
  });
 });
 it('rejects empty answers without explicit blank action',async()=>{
  const response=await POST(request({id:reviewId,answer:''}));
  expect(response.status).toBe(400);
  expect(await db.dailyLog.count()).toBe(0);
  const invalid=await POST(request({id:reviewId,answer:'1/2',submitBlank:true}));
  expect(invalid.status).toBe(400);
 });
 it('micro review stores blank result independently of incorrect result',async()=>{
  const micro=await db.dailyLog.create({data:{
   studentId,date:new Date(),payload:{type:'MICRO_STARTED',
    kind:'WRONG_1',reviewId,version:1}
  }});
  const response=await POST(request({id:reviewId,answer:'',
   submitBlank:true,microSessionId:micro.id}));
  expect(response.status).toBe(200);
  const finished=await db.dailyLog.findUniqueOrThrow({where:{id:micro.id}});
  expect(finished.payload).toMatchObject({
   type:'MICRO_RESULT',blank:1,wrong:0,correct:0,
   reviewResult:{outcome:'BLANK',blank:true}
  });
 });
});
