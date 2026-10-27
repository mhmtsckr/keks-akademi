import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({requireRole:vi.fn(),awardXp:vi.fn(async()=>{})}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.requireRole}));
vi.mock('@/lib/gamification',()=>({awardXp:mocks.awardXp}));
import {db,resetDb} from './db';
import {POST as coachPOST,PATCH as coachPATCH,GET as coachGET} from '@/app/api/coach/students/[id]/paragraf-interventions/route';
import {POST as studentTaskPOST} from '@/app/api/student/task-submissions/route';
import {GET as studentDailyGET} from '@/app/api/student/daily-tasks/route';
import {detailedQuestions} from '@/lib/paragrafOptik';
import {PARAGRAF_COACH_ACTION_SOURCE} from '@/lib/paragrafInterventionImpact';

const q=detailedQuestions(1)!;
const topic=q[0].topic;
const encoded=q.map((v,i)=>i===0?(v.answer==='A'?'B':'A'):v.answer).join('');
let coachId:string,coachUserId:string,studentId:string,studentUserId:string,unrelatedId:string;
const ctx=(id:string)=>({params:Promise.resolve({id})});
const url=(id:string)=>'http://localhost/api/coach/students/'+id+'/paragraf-interventions';
const req=(link:string,body:unknown,method='POST')=>new Request(link,{
 method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
function asCoach(){mocks.requireRole.mockResolvedValue({
 id:coachUserId,role:'COACH',coachProfile:{id:coachId}
});}
function asStudent(id=studentId,uid=studentUserId){
 mocks.requireRole.mockResolvedValue({id:uid,role:'STUDENT',student:{id,gradeLevel:'12'}});
}
async function assign(id=studentId){
 return coachPOST(req(url(id),{
  topic,interventionCode:'EVIDENCE_REVIEW',
  coachNote:'Yeni metinlerde soru kökünü kanıt üzerinden inceleyeceğiz.'
 }),ctx(id));
}
async function submit(actionId:string){
 return studentTaskPOST(req('http://localhost/api/student/task-submissions',{
  actionId,totalQuestions:2,correct:1,wrong:1,blank:0,errorReason:'SORU_KOKU'
 }));
}
beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 const c=await db.user.create({data:{name:'Coach',role:'COACH',status:'ACTIVE'}});
 coachUserId=c.id;
 coachId=(await db.coachProfile.create({data:{userId:c.id}})).id;
 const u=await db.user.create({data:{name:'Learner',role:'STUDENT',status:'ACTIVE'}});
 studentUserId=u.id;
 studentId=(await db.student.create({data:{
  userId:u.id,coachId,fullName:'Learner',studentCode:'ACCEPT_ONE',gradeLevel:'12'
 }})).id;
 const unrelated=await db.user.create({data:{name:'Other',role:'STUDENT',status:'ACTIVE'}});
 unrelatedId=(await db.student.create({data:{
  userId:unrelated.id,coachId,fullName:'Other',studentCode:'ACCEPT_TWO',gradeLevel:'12'
 }})).id;
 await db.dailyLog.create({data:{
  studentId,date:new Date(),legacyId:'PARAGRAF_OPTIK_FIRST:'+studentId+':01',
  payload:{kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo:1,encoded}
 }});
 asCoach();
});

describe('end to end student/coach intervention integrity',()=>{
 it('student submits work but cannot silently close coach-only action',async()=>{
  const response=await assign();
  expect(response.status).toBe(201);
  const {id}=await response.json();
  asStudent();
  const record=await submit(id);
  expect(record.status).toBe(200);
  expect(await record.json()).toMatchObject({
   ok:true,requiresCoachClosure:true,evidenceSource:'STUDENT_SELF_REPORT'
  });
  const action=await db.coachingAction.findUniqueOrThrow({where:{id}});
  expect(action).toMatchObject({
   planSource:PARAGRAF_COACH_ACTION_SOURCE,status:'ACTIVE',currentValue:2
  });
  const daily=(await studentDailyGET());
  expect(daily.status).toBe(200);
  const tasks=await daily.json();
  expect(tasks.actions.some((x:{id:string;status:string})=>x.id===id&&x.status==='ACTIVE')).toBe(true);
  expect(await db.taskSubmission.count({where:{studentId,actionId:id}})).toBe(1);
  asCoach();
  const panel=(await coachGET(new Request(url(studentId)),ctx(studentId))).json();
  expect((await panel).actions[0]).toMatchObject({
   status:'ACTIVE',verifiedMastery:false,changePp:null
  });
 });
 it('coach closes explicitly and student cannot change a closed intervention',async()=>{
  const {id}=await (await assign()).json();
  asStudent();
  expect((await submit(id)).status).toBe(200);
  asCoach();
  const closed=await coachPATCH(req(url(studentId),{
   actionId:id,decision:'COMPLETED'
  },'PATCH'),ctx(studentId));
  expect(closed.status).toBe(200);
  asStudent();
  const retry=await submit(id);
  expect(retry.status).toBe(409);
  expect((await db.coachingAction.findUniqueOrThrow({where:{id}})).status).toBe('COMPLETED');
  expect(await db.taskSubmission.count({where:{studentId,actionId:id}})).toBe(1);
 });
 it('student B cannot send task results for student A intervention',async()=>{
  const {id}=await (await assign()).json();
  asStudent(unrelatedId);
  expect((await submit(id)).status).toBe(404);
  expect(await db.taskSubmission.count()).toBe(0);
 });
 it('cannot create an intervention from a forged unapproved generic workspace log',async()=>{
  await db.dailyLog.create({data:{
   studentId:unrelatedId,date:new Date(),
   payload:{kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo:1,encoded}
  }});
  expect((await assign(unrelatedId)).status).toBe(409);
  expect(await db.coachingAction.count({where:{studentId:unrelatedId}})).toBe(0);
 });
 it('cannot re-open an intervention with a task submission after cancellation',async()=>{
  const {id}=await (await assign()).json();
  expect((await coachPATCH(req(url(studentId),{
   actionId:id,decision:'CANCELED'
  },'PATCH'),ctx(studentId))).status).toBe(200);
  asStudent();
  expect((await submit(id)).status).toBe(409);
  expect(await db.taskSubmission.count()).toBe(0);
 });
});
