import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.requireRole}));
import {db,resetDb} from './db';
import {GET,POST} from '@/app/api/student/paragraf/transfer-followup/route';
import {POST as recover} from '@/app/api/student/paragraf/optik/recover/route';
import {getParagrafDetailedSolution} from '@/lib/paragrafDetailedSolutions';

const sourceKey=Array.from({length:30},(_,i)=>
 getParagrafDetailedSolution(String(i+1).padStart(5,'0'))!.answer).join('');
const encoded=(sourceKey[0]==='A'?'B':'A')+'X'+sourceKey.slice(2);
const root='http://localhost/api/student/paragraf/transfer-followup';
let studentA:string,studentB:string;
async function makeStudent(name:string){
 const user=await db.user.create({data:{name,role:'STUDENT',status:'ACTIVE'}});
 return (await db.student.create({data:{userId:user.id,studentCode:'FOLLOWUP_'+name,
  fullName:name,gradeLevel:'12'}})).id;
}
function as(id:string){mocks.requireRole.mockResolvedValue({id:'user-'+id,role:'STUDENT',student:{id,gradeLevel:'12'}});}
function get(testNo=1,sourceQuestionNo=1){
 return GET(new Request(root+'?testNo='+testNo+'&sourceQuestionNo='+sourceQuestionNo));
}
function post(questionId:string,answer:string,evidence='Metindeki ana düşünceyi desteklediği için seçtim.',sourceQuestionNo=1){
 return POST(new Request(root,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({testNo:1,sourceQuestionNo,questionId,answer,evidence})}));
}
async function importFirst(){
 return recover(new Request('http://localhost/api/student/paragraf/optik/recover',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({testNo:1,encoded})
 }));
}
beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 studentA=await makeStudent('A');studentB=await makeStudent('B');as(studentA);
});
describe('student-scoped immutable novel question attempt',()=>{
 it('requires a saved opt-in source, forbids correct-first-try and keeps answers secret in GET',async()=>{
  expect((await get()).status).toBe(404);
  expect((await post('00038','A')).status).toBe(404);
  expect((await importFirst()).status).toBe(200);
  const request=await get();
  expect(request.status).toBe(200);
  const payload=await request.json();
  expect(payload.question.testNo).not.toBe(1);
  expect(payload.question).not.toHaveProperty('correctAnswer');
  expect(payload.question).not.toHaveProperty('teaching');
  expect((await get(1,3)).status).toBe(404);
 });
 it('records one unique different-question event and leaves original test and SRS intact',async()=>{
  expect((await importFirst()).status).toBe(200);
  const original=await db.dailyLog.findUniqueOrThrow({where:{legacyId:'PARAGRAF_OPTIK_FIRST:'+studentA+':01'}});
  const queued=await db.reviewQueueItem.findMany({where:{studentId:studentA},orderBy:{questionId:'asc'}});
  const item=(await (await get()).json()).question;
  const printed=getParagrafDetailedSolution(item.questionId)!;
  const recorded=await post(item.questionId,printed.answer);
  expect(recorded.status).toBe(200);
  expect(await recorded.json()).toMatchObject({ok:true,countsAsMastery:false,result:{correct:true}});
  const attempts=await db.dailyLog.findMany({where:{studentId:studentA}});
  expect(attempts).toHaveLength(2);
  const followup=attempts.find(x=>x.id!==original.id)!;
  expect(followup.payload).toMatchObject({
   kind:'PARAGRAF_INDEPENDENT_FOLLOWUP',correct:true,
   evidenceStatus:'STUDENT_SELF_REPORT_UNVERIFIED',verifiedMastery:false
  });
  const again=await post(item.questionId,printed.answer);
  expect(again.status).toBe(409);
  const next=(await (await get()).json()).question;
  expect(next.questionId).not.toBe(item.questionId);
  expect((await db.dailyLog.findUniqueOrThrow({where:{id:original.id}})).payload).toEqual(original.payload);
  expect(await db.reviewQueueItem.findMany({where:{studentId:studentA},orderBy:{questionId:'asc'}}))
   .toEqual(queued);
 });
 it('rejects forged IDs, missing textual reason and previously correct source',async()=>{
  expect((await importFirst()).status).toBe(200);
  expect((await post('00001','A')).status).toBe(409);
  const candidate=(await (await get()).json()).question;
  expect((await post(candidate.questionId,'A','kısa')).status).toBe(400);
  expect((await post(candidate.questionId,'A','En az 15 karakterlik neden.',3)).status).toBe(404);
  expect(await db.dailyLog.count({where:{studentId:studentA}})).toBe(1);
 });
 it('isolates student B from A and requires student B opt-in',async()=>{
  expect((await importFirst()).status).toBe(200);
  const a=(await (await get()).json()).question;
  as(studentB);
  expect((await get()).status).toBe(404);
  expect((await post(a.questionId,'A')).status).toBe(404);
  expect(await db.dailyLog.count({where:{studentId:studentB}})).toBe(0);
  expect((await importFirst()).status).toBe(200);
  expect((await get()).status).toBe(200);
 });
});
