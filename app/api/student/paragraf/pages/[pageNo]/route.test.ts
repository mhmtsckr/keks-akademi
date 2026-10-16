import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>{
  const tx={
    dailyLog:{findUnique:vi.fn(),create:vi.fn()},
    practiceLog:{create:vi.fn()},
    studentReport:{create:vi.fn()},
    questionBankItem:{upsert:vi.fn()},
    reviewQueueItem:{upsert:vi.fn()}
  };
  return {
    tx,
    requireRole:vi.fn(),
    answerKey:vi.fn(),
    db:{
      dailyLog:{findUnique:vi.fn()},
      $transaction:vi.fn(async(callback:(dbTx:typeof tx)=>unknown)=>callback(tx))
    }
  };
});
vi.mock('@/lib/auth',()=>({requireRole:mocks.requireRole}));
vi.mock('@/lib/db',()=>({db:mocks.db}));
vi.mock('@/lib/paragrafPrintAnswerKey',()=>({
  PRINT_EDITION:'KEKS_TYT_PARAGRAF_A3_V1',paragrafPrintedPageAnswerKey:mocks.answerKey
}));
import {AuthError} from '@/lib/apiGuard';
import {GET,POST} from './route';

const q=[
  {id:'KEKS50-00001',testNo:1,questionNo:1,topic:'Ana düşünce',correctAnswer:'C'},
  {id:'KEKS50-00002',testNo:1,questionNo:2,topic:'Örtük anlam',correctAnswer:'B'},
  {id:'KEKS50-00003',testNo:1,questionNo:3,topic:'Çıkarım',correctAnswer:'A'},
  {id:'KEKS50-00004',testNo:1,questionNo:4,topic:'Yazarın amacı',correctAnswer:'C'}
];

function req(data:unknown) {
  return new Request('http://localhost/api/student/paragraf/pages/001',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)
  });
}
const params={params:Promise.resolve({pageNo:'001'})};

beforeEach(()=>{
  vi.resetAllMocks();
  mocks.requireRole.mockResolvedValue({id:'user1',role:'STUDENT',student:{id:'s1'}});
  mocks.answerKey.mockReturnValue(q);
  mocks.db.$transaction.mockImplementation(async(cb:(tx:typeof mocks.tx)=>unknown)=>cb(mocks.tx));
  mocks.db.dailyLog.findUnique.mockResolvedValue(null);
  mocks.tx.dailyLog.findUnique.mockResolvedValue(null);
  mocks.tx.questionBankItem.upsert.mockImplementation(async({create}:{create:unknown})=>create);
  mocks.tx.reviewQueueItem.upsert.mockResolvedValue({id:'review-1'});
  mocks.tx.dailyLog.create.mockResolvedValue({id:'page-attempt'});
  mocks.tx.practiceLog.create.mockResolvedValue({id:'practice-log'});
  mocks.tx.studentReport.create.mockResolvedValue({id:'student-report'});
});

describe('KEKS Paragraf basılı sayfa -> kişisel tekrar motoru',()=>{
  it('GET hides correct answers and filters by logged-in student',async()=>{
    const response=await GET(new Request('http://localhost/api/student/paragraf/pages/001'),params);
    const data=await response.json();
    expect(response.status).toBe(200);
    expect(data.questions[0]).not.toHaveProperty('correctAnswer');
    expect(JSON.stringify(data)).not.toContain('"correctAnswer"');
    expect(mocks.db.dailyLog.findUnique).toHaveBeenCalledWith({
      where:{legacyId:'PARAGRAF_PAGE_V1:s1:001'},select:{payload:true}
    });
  });
  it('only wrong questions enqueue due-now reviews with paper references',async()=>{
    const response=await POST(req({answers:{'1':'A','2':'B','3':null,'4':'C'}}),params);
    expect(response.status).toBe(200);
    const data=await response.json();
    expect(data.attempt).toMatchObject({correct:2,wrong:1,blank:1,net:1.75,reviewLinked:1});
    expect(mocks.tx.questionBankItem.upsert).toHaveBeenCalledTimes(1);
    const create=mocks.tx.questionBankItem.upsert.mock.calls[0][0].create;
    expect(create).toMatchObject({
      id:'KEKS_PRINT_A3_V1_Q00001',correctAnswer:'C',
      topic:'Ana düşünce',sourceKind:'PARAGRAF_PRINT_A3_V1',
      reviewStatus:'PRINT_PROOF',active:false
    });
    expect(create.prompt).toContain('Test 1 · Soru 1');
    expect(create.prompt).not.toContain('Paragraf metni:');
    expect(mocks.tx.reviewQueueItem.upsert).toHaveBeenCalledTimes(1);
    const entry=mocks.tx.reviewQueueItem.upsert.mock.calls[0][0];
    expect(entry.where.studentId_questionId).toEqual({
      studentId:'s1',questionId:'KEKS_PRINT_A3_V1_Q00001'
    });
    expect(entry.create).toMatchObject({studentId:'s1',stepIndex:0,status:'DUE',lastCorrect:false});
    expect(mocks.tx.practiceLog.create).toHaveBeenCalledTimes(1);
    expect(mocks.tx.studentReport.create).toHaveBeenCalledTimes(1);
  });
  it('all-correct page does not enqueue any question',async()=>{
    const response=await POST(req({answers:{'1':'C','2':'B','3':'A','4':'C'}}),params);
    expect(response.status).toBe(200);
    expect(mocks.tx.reviewQueueItem.upsert).not.toHaveBeenCalled();
    expect(mocks.tx.questionBankItem.upsert).not.toHaveBeenCalled();
  });
  it('existing page attempt is idempotent and adds no further review rows',async()=>{
    mocks.db.dailyLog.findUnique.mockResolvedValue({payload:{kind:'PARAGRAF_PAGE_ATTEMPT',correct:2}});
    const response=await POST(req({answers:{'1':'A','2':'B','3':'A','4':'C'}}),params);
    expect((await response.json()).alreadySubmitted).toBe(true);
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
    expect(mocks.tx.reviewQueueItem.upsert).not.toHaveBeenCalled();
  });
  it('rejects extraneous question number and never creates a queue',async()=>{
    const response=await POST(req({answers:{'1':'A','2':'B','3':null,'5':'A'}}),params);
    expect(response.status).toBe(400);
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
  it('rejects a logged-out student before reading personal answers',async()=>{
    mocks.requireRole.mockRejectedValue(new AuthError(401,'Oturum açmanız gerekiyor.'));
    const response=await GET(new Request('http://localhost/api/student/paragraf/pages/001'),params);
    expect(response.status).toBe(401);
    expect(mocks.db.dailyLog.findUnique).not.toHaveBeenCalled();
  });
  it('rolls back if answer key conflicts with a historical bank item',async()=>{
    mocks.tx.questionBankItem.upsert.mockResolvedValue({...q[0],sourceKind:'ORIGINAL'});
    const response=await POST(req({answers:{'1':'A','2':'B','3':null,'4':'C'}}),params);
    expect(response.status).toBe(409);
    expect(mocks.tx.reviewQueueItem.upsert).not.toHaveBeenCalled();
  });
});
