import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.requireRole}));
import {db,resetDb} from './db';
import {GET,POST,PATCH} from '@/app/api/coach/students/[id]/paragraf-interventions/route';
import {detailedQuestions} from '@/lib/paragrafOptik';
import {PARAGRAF_COACH_ACTION_SOURCE} from '@/lib/paragrafInterventionImpact';

const url='http://localhost/api/coach/students/';
const first=detailedQuestions(1)!;
const marks=first.map((q,i)=>i===0?(q.answer==='A'?'B':'A'):q.answer).join('');
const topic=first[0].topic;
const ctx=(id:string)=>({params:Promise.resolve({id})});
const req=(id:string,method:'POST'|'PATCH',body:unknown)=>new Request(url+id+'/paragraf-interventions',{
 method,headers:{'content-type':'application/json'},body:JSON.stringify(body)
});
const assign=(id:string,extra:Record<string,unknown>={})=>
 POST(req(id,'POST',{topic,interventionCode:'EVIDENCE_REVIEW',
  coachNote:'Bu konuda iki farklı metin üzerinden metin kanıtı çalışacağız.',...extra}),ctx(id));
let coach:string,studentA:string,studentB:string;
async function student(name:string,coachId:string|null){
 const user=await db.user.create({data:{name,role:'STUDENT',status:'ACTIVE'}});
 return (await db.student.create({data:{userId:user.id,
  studentCode:'PAR_COACH_'+name,fullName:name,gradeLevel:'12',coachId}})).id;
}
function asCoach(coachId:string|null,userId='coach-user'){
 mocks.requireRole.mockResolvedValue({id:userId,role:'COACH',
  coachProfile:coachId?{id:coachId}:null});
}
beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 const user=await db.user.create({data:{name:'Coach',role:'COACH',status:'ACTIVE'}});
 const p=await db.coachProfile.create({data:{userId:user.id}});
 coach=p.id;
 studentA=await student('A',coach);
 studentB=await student('B',null);
 asCoach(coach,user.id);
 await db.dailyLog.create({data:{studentId:studentA,date:new Date(),
  legacyId:'PARAGRAF_OPTIK_FIRST:'+studentA+':01',
  payload:{kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo:1,encoded:marks,
   reasons:{'1':'KARARSIZLIK'}}}});
});
describe('coach paragraph intervention / PostgreSQL',()=>{
 it('creates real CoachingAction and exposes non-causal empty followup',async()=>{
  const response=await assign(studentA);
  expect(response.status).toBe(201);
  const created=await response.json();
  const actions=await db.coachingAction.findMany({where:{studentId:studentA}});
  expect(actions).toHaveLength(1);
  expect(actions[0]).toMatchObject({id:created.id,subject:'Türkçe',topic,
   status:'ACTIVE',planSource:PARAGRAF_COACH_ACTION_SOURCE,targetValue:2});
  const listing=await GET(new Request(url+studentA+'/paragraf-interventions'),ctx(studentA));
  expect(listing.status).toBe(200);
  const data=await listing.json();
  expect(data.actions).toHaveLength(1);
  expect(data.actions[0].observationStatus).toBe('INSUFFICIENT_BASELINE');
  expect(data.actions[0].changePp).toBeNull();
  expect(data.actions[0].verifiedMastery).toBe(false);
 });
 it('rejects duplicate active interventions and leaves just one database action',async()=>{
  expect((await assign(studentA)).status).toBe(201);
  expect((await assign(studentA)).status).toBe(409);
  expect(await db.coachingAction.count({where:{studentId:studentA}})).toBe(1);
 });
 it('rejects a student from another coach and an unsupported topic',async()=>{
  expect((await assign(studentB)).status).toBe(404);
  const other=await GET(new Request(url+studentB+'/paragraf-interventions'),ctx(studentB));
  expect(other.status).toBe(404);
  const invalid=await assign(studentA,{topic:'Bu öğrenciye ait olmayan kazanım'});
  expect(invalid.status).toBe(409);
  expect(await db.coachingAction.count()).toBe(0);
 });
 it('requires a coach profile before reading student data',async()=>{
  asCoach(null);
  expect((await assign(studentA)).status).toBe(403);
  expect(await db.coachingAction.count()).toBe(0);
 });
 it('validates coach notes and blocks fake intervention codes',async()=>{
  expect((await assign(studentA,{coachNote:'kısa'})).status).toBe(400);
  expect((await assign(studentA,{interventionCode:'PERMANENT_MASTERY'})).status).toBe(400);
  expect(await db.coachingAction.count()).toBe(0);
 });
 it('closes only its own active action, without changing the review queue or mastery',async()=>{
  const created=await (await assign(studentA)).json();
  const r=await PATCH(req(studentA,'PATCH',{actionId:created.id,decision:'COMPLETED'}),ctx(studentA));
  expect(r.status).toBe(200);
  expect((await db.coachingAction.findUniqueOrThrow({where:{id:created.id}})).status).toBe('COMPLETED');
  expect((await PATCH(req(studentA,'PATCH',{actionId:created.id,decision:'CANCELED'}),ctx(studentA))).status).toBe(409);
  expect((await PATCH(req(studentB,'PATCH',{actionId:created.id,decision:'CANCELED'}),ctx(studentB))).status).toBe(404);
  expect(await db.reviewQueueItem.count({where:{studentId:studentA}})).toBe(0);
 });
});
