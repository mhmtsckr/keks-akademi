import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({requireRole:vi.fn(),findMany:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.requireRole}));
vi.mock('@/lib/db',()=>({db:{reviewQueueItem:{findMany:mocks.findMany}}}));
import {GET} from './route';
import {AuthError} from '@/lib/apiGuard';
beforeEach(()=>{
  vi.resetAllMocks();
  mocks.requireRole.mockResolvedValue({role:'STUDENT',student:{id:'student-7'}});
  mocks.findMany.mockResolvedValue([]);
});
describe('Basılı paragraf kişisel tekrar listesi',()=>{
  it('yalnız oturumdaki öğrencinin basılı tekrarlarını ister',async()=>{
    const response=await GET();
    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where:{
        studentId:'student-7',
        status:{in:['DUE','PENDING']},
        question:{sourceKind:'PARAGRAF_PRINT_A3_V1'}
      }
    }));
  });
  it('doğru yanıtı veya soru bankasındaki diğer öğrenci verilerini göstermez',async()=>{
    mocks.findMany.mockResolvedValue([{
      id:'review-1',questionId:'KEKS_PRINT_A3_V1_Q00001',dueAt:new Date(0),
      status:'DUE',stepIndex:0,
      question:{id:'KEKS_PRINT_A3_V1_Q00001',prompt:'Kitaptan tekrar çöz',
        topic:'Ana düşünce',options:{
          A:'A',B:'B',C:'C',D:'D',E:'E',_testNo:1,_questionNo:1,_pageInTest:1
        },correctAnswer:'C'}
    }]);
    const response=await GET();
    const data=await response.json();
    expect(response.status).toBe(200);
    expect(data.items[0]).toMatchObject({
      id:'review-1',isDue:true,question:{testNo:1,questionNo:1,pageInTest:1}
    });
    expect(JSON.stringify(data)).not.toContain('correctAnswer');
  });
  it('oturumsuz isteğe 401 verir',async()=>{
    mocks.requireRole.mockRejectedValue(new AuthError(401,'Oturum açılmalı'));
    expect((await GET()).status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
