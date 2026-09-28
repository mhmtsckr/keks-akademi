import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const auth=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:auth.requireRole}));
vi.mock('@/lib/systemConfig',()=>({isFeatureEnabled:async()=>true}));
import {db,resetDb} from './db';
import {POST as micro} from '@/app/api/student/micro-learning/route';
import {POST as review} from '@/app/api/student/reviews/route';
const req=(body:unknown)=>new Request('http://localhost/api/student/micro-learning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
let studentId:string;
beforeEach(async()=>{
  await resetDb();
  const s=await db.student.create({data:{studentCode:'MICRO_TEST',fullName:'Test Öğrenci',gradeLevel:'YDS'}});
  studentId=s.id;auth.requireRole.mockResolvedValue({student:{id:s.id,studentCode:s.studentCode}});
});
afterEach(async()=>{await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS test_micro_review_fail ON "ReviewQueueItem"')});
async function wrongSession(){
  const q=await db.questionBankItem.create({data:{examType:'TYT',subject:'Matematik',topic:'Toplama',prompt:'2 + 2 = ?',options:{},correctAnswer:'4',sourceKind:'STUDENT_WRONG:'+studentId}});
  const r=await db.reviewQueueItem.create({data:{studentId,questionId:q.id,dueAt:new Date(Date.now()-1000)}});
  const start=await micro(req({action:'start',kind:'WRONG_1'}));
  expect(start.status).toBe(200);
  return {queue:r,session:(await start.json()).sessionId};
}
describe('micro learning real persistence',()=>{
  it('counts one result when identical submissions arrive together',async()=>{
    const start=await micro(req({action:'start',kind:'WORDS_5'}));
    const sessionId=(await start.json()).sessionId;
    const responses=await Promise.all([micro(req({action:'submit',sessionId,answers:{'0':'kanıt'}})),micro(req({action:'submit',sessionId,answers:{'0':'kanıt'}}))]);
    expect(responses.some(x=>x.status===200)).toBe(true);
    expect(responses.every(x=>[200,409].includes(x.status))).toBe(true);
    expect(await db.dailyLog.count({where:{studentId,payload:{path:['type'],equals:'MICRO_RESULT'}}})).toBe(1);
  });
  it('updates the personal review once and returns the saved result on retry',async()=>{
    const {queue,session}=await wrongSession();
    const body={id:queue.id,answer:'4',microSessionId:session};
    expect((await review(req(body))).status).toBe(200);
    expect((await review(req(body))).status).toBe(200);
    expect((await db.reviewQueueItem.findUniqueOrThrow({where:{id:queue.id}})).stepIndex).toBe(1);
    expect(await db.dailyLog.count({where:{studentId,payload:{path:['type'],equals:'REVIEW_RESULT'}}})).toBe(1);
    expect(await db.dailyLog.count({where:{studentId,payload:{path:['type'],equals:'MICRO_RESULT'}}})).toBe(1);
  });
  it('rolls back micro completion if updating the review queue fails',async()=>{
    const {queue,session}=await wrongSession();
    await db.$executeRawUnsafe("CREATE OR REPLACE FUNCTION test_micro_review_fail_fn() RETURNS trigger AS $fn$ BEGIN RAISE EXCEPTION 'TEST_MICRO_FAIL'; END; $fn$ LANGUAGE plpgsql");
    await db.$executeRawUnsafe('CREATE TRIGGER test_micro_review_fail BEFORE UPDATE ON "ReviewQueueItem" FOR EACH ROW EXECUTE FUNCTION test_micro_review_fail_fn()');
    expect((await review(req({id:queue.id,answer:'4',microSessionId:session}))).status).toBe(500);
    expect((await db.dailyLog.findUniqueOrThrow({where:{id:session}})).payload).toMatchObject({type:'MICRO_STARTED'});
    expect((await db.reviewQueueItem.findUniqueOrThrow({where:{id:queue.id}})).stepIndex).toBe(0);
  });
});
