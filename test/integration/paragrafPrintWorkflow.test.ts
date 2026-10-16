import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

// Authentication and printed answer key are injected; all Prisma queries and
// transactions below use a REAL isolated PostgreSQL test database.
const dependencies=vi.hoisted(()=>({
  requireRole:vi.fn(),
  answerKey:vi.fn()
}));
vi.mock('@/lib/auth',()=>({requireRole:dependencies.requireRole}));
vi.mock('@/lib/paragrafPrintAnswerKey',()=>({
  PRINT_EDITION:'KEKS_TYT_PARAGRAF_A3_V1',
  paragrafPrintedPageAnswerKey:dependencies.answerKey
}));

import {db,resetDb} from './db';
import {GET as pageGET,POST as pagePOST} from '@/app/api/student/paragraf/pages/[pageNo]/route';
import {GET as reviewsGET} from '@/app/api/student/paragraf/reviews/route';
import {POST as reviewPOST} from '@/app/api/student/reviews/route';

const QUESTIONS=[
  {id:'KEKS50-00001',testNo:1,questionNo:1,topic:'Ana düşünce',correctAnswer:'C'},
  {id:'KEKS50-00002',testNo:1,questionNo:2,topic:'Örtük anlam',correctAnswer:'B'},
  {id:'KEKS50-00003',testNo:1,questionNo:3,topic:'Çıkarım',correctAnswer:'A'},
  {id:'KEKS50-00004',testNo:1,questionNo:4,topic:'Yazarın amacı',correctAnswer:'C'}
];
const GOOD={answers:{'1':'C','2':'B','3':'A','4':'C'}};
const MIXED={answers:{'1':'A','2':'B','3':null,'4':'C'}}; // wrong, right, blank, right
const PAGE={params:Promise.resolve({pageNo:'001'})};
const request=(data:unknown,path='/api/student/paragraf/pages/001')=>
  new Request('http://localhost'+path,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)
  });

let studentA:string;
let studentB:string;
function signIn(studentId:string){
  dependencies.requireRole.mockResolvedValue({
    id:'user-'+studentId,role:'STUDENT',student:{id:studentId,gradeLevel:'12'}
  });
}
async function createStudent(label:string){
  const user=await db.user.create({data:{name:'Pilot '+label,role:'STUDENT',status:'ACTIVE'}});
  return db.student.create({data:{
    userId:user.id,studentCode:'PARAGRAF_TEST_'+label,
    fullName:'Pilot '+label,gradeLevel:'12'
  }});
}
async function removeTrigger(){
  await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS test_paragraf_report_failure ON "StudentReport"');
}

beforeEach(async()=>{
  await resetDb();
  vi.clearAllMocks();
  dependencies.answerKey.mockImplementation((testNo:number,questionNos:number[])=>{
    if(testNo!==1)return [];
    return QUESTIONS.filter(q=>questionNos.includes(q.questionNo));
  });
  studentA=(await createStudent('A')).id;
  studentB=(await createStudent('B')).id;
  signIn(studentA);
  vi.spyOn(console,'error').mockImplementation(()=>{});
});
afterEach(async()=>{
  await removeTrigger();
  vi.restoreAllMocks();
});

describe('KEKS basılı Paragraf QR -> real PostgreSQL -> kişisel tekrar',()=>{
  it('stores one immutable attempt and only wrong answers enter DUE day-zero queue',async()=>{
    const response=await pagePOST(request(MIXED),PAGE);
    expect(response.status).toBe(200);
    const result=await response.json();
    expect(result.attempt).toMatchObject({
      correct:2,wrong:1,blank:1,net:1.75,reviewLinked:1
    });
    const attempt=await db.dailyLog.findUnique({
      where:{legacyId:'PARAGRAF_PAGE_V1:'+studentA+':001'}
    });
    expect(attempt).toBeTruthy();
    expect(await db.practiceLog.count({where:{studentId:studentA}})).toBe(1);
    expect(await db.studentReport.count({where:{studentId:studentA}})).toBe(1);
    const review=await db.reviewQueueItem.findMany({
      where:{studentId:studentA},include:{question:true}
    });
    expect(review).toHaveLength(1);
    expect(review[0].status).toBe('DUE');
    expect(review[0].stepIndex).toBe(0);
    expect(review[0].dueAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(review[0].question).toMatchObject({
      id:'KEKS_PRINT_A3_V1_Q00001',sourceKind:'PARAGRAF_PRINT_A3_V1',
      reviewStatus:'PRINT_PROOF',active:false,correctAnswer:'C'
    });
    const before=await pageGET(new Request('http://localhost/api/student/paragraf/pages/001'),PAGE);
    expect((await before.json()).attempt).toMatchObject({wrong:1,reviewLinked:1});
  });

  it('preserves idempotency on repeated submissions, changing answers cannot regrade',async()=>{
    expect((await pagePOST(request(MIXED),PAGE)).status).toBe(200);
    const again=await pagePOST(request(GOOD),PAGE);
    expect(again.status).toBe(200);
    expect((await again.json())).toMatchObject({
      alreadySubmitted:true,attempt:{correct:2,wrong:1}
    });
    expect(await db.dailyLog.count({where:{studentId:studentA}})).toBe(1);
    expect(await db.practiceLog.count({where:{studentId:studentA}})).toBe(1);
    expect(await db.studentReport.count({where:{studentId:studentA}})).toBe(1);
    expect(await db.reviewQueueItem.count({where:{studentId:studentA}})).toBe(1);
  });

  it('concurrent identical page submissions never produce two scores or queue entries',async()=>{
    const result=await Promise.all([
      pagePOST(request(MIXED),PAGE),
      pagePOST(request(MIXED),PAGE)
    ]);
    expect(result.some(x=>x.status===200)).toBe(true);
    expect(await db.dailyLog.count({where:{studentId:studentA}})).toBe(1);
    expect(await db.practiceLog.count({where:{studentId:studentA}})).toBe(1);
    expect(await db.studentReport.count({where:{studentId:studentA}})).toBe(1);
    expect(await db.reviewQueueItem.count({where:{studentId:studentA}})).toBe(1);
  });

  it('rolls back every earlier write if reporting fails at the end of transaction',async()=>{
    await db.$executeRawUnsafe(
      "CREATE OR REPLACE FUNCTION test_paragraf_report_failure_fn() RETURNS trigger AS $fn$ BEGIN RAISE EXCEPTION 'TEST_PARAGRAF_ROLLBACK'; END; $fn$ LANGUAGE plpgsql"
    );
    await db.$executeRawUnsafe(
      'CREATE TRIGGER test_paragraf_report_failure BEFORE INSERT ON "StudentReport" FOR EACH ROW EXECUTE FUNCTION test_paragraf_report_failure_fn()'
    );
    const response=await pagePOST(request(MIXED),PAGE);
    expect(response.status).toBe(500);
    expect(await db.dailyLog.count({where:{studentId:studentA}})).toBe(0);
    expect(await db.practiceLog.count({where:{studentId:studentA}})).toBe(0);
    expect(await db.studentReport.count({where:{studentId:studentA}})).toBe(0);
    expect(await db.questionBankItem.count()).toBe(0);
    expect(await db.reviewQueueItem.count()).toBe(0);
  });

  it('isolates page submissions and personal review rows by student',async()=>{
    expect((await pagePOST(request(MIXED),PAGE)).status).toBe(200);
    const ownRows=await reviewsGET();
    const own=(await ownRows.json()).items;
    expect(own).toHaveLength(1);
    expect(own[0].isDue).toBe(true);
    expect(JSON.stringify(own)).not.toContain('correctAnswer');
    signIn(studentB);
    const otherRows=await reviewsGET();
    expect((await otherRows.json()).items).toHaveLength(0);
    const otherPage=await pageGET(new Request('http://localhost/api/student/paragraf/pages/001'),PAGE);
    expect((await otherPage.json()).attempt).toBe(null);
    const foreignReview=await reviewPOST(request({
      id:own[0].id,answer:'C'
    },'/api/student/reviews'));
    expect(foreignReview.status).toBe(404);
    expect(await db.reviewQueueItem.count({where:{studentId:studentB}})).toBe(0);
  });

  it('first correct spaced review moves due date forward and keeps review history',async()=>{
    expect((await pagePOST(request(MIXED),PAGE)).status).toBe(200);
    const listed=await reviewsGET();
    const list=(await listed.json()).items;
    expect(list).toHaveLength(1);
    const now=Date.now();
    const completed=await reviewPOST(request({
      id:list[0].id,answer:'C'
    },'/api/student/reviews'));
    expect(completed.status).toBe(200);
    const payload=await completed.json();
    expect(payload).toMatchObject({correct:true,completed:false,nextIntervalDays:1});
    const row=await db.reviewQueueItem.findUniqueOrThrow({where:{id:list[0].id}});
    expect(row.status).toBe('PENDING');
    expect(row.stepIndex).toBe(1);
    expect(row.dueAt.getTime()).toBeGreaterThan(now+23*60*60*1000);
    expect(await db.dailyLog.count({
      where:{studentId:studentA,payload:{path:['type'],equals:'REVIEW_RESULT'}}
    })).toBe(1);
    const double=await reviewPOST(request({id:list[0].id,answer:'C'},'/api/student/reviews'));
    expect(double.status).toBe(409);
    expect(await db.dailyLog.count({
      where:{studentId:studentA,payload:{path:['type'],equals:'REVIEW_RESULT'}}
    })).toBe(1);
  });

  it('all-correct page creates no review queue and leaks no answer key before submit',async()=>{
    const get=await pageGET(new Request('http://localhost/api/student/paragraf/pages/001'),PAGE);
    const initial=await get.json();
    expect(initial.attempt).toBeNull();
    expect(JSON.stringify(initial)).not.toContain('correctAnswer');
    expect((await pagePOST(request(GOOD),PAGE)).status).toBe(200);
    expect(await db.reviewQueueItem.count()).toBe(0);
    expect(await db.questionBankItem.count()).toBe(0);
  });
});
