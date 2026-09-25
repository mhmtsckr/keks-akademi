import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({
  reviewFindMany:vi.fn(),
  examFindFirst:vi.fn(),
  planFindFirst:vi.fn(),
  actionFindMany:vi.fn(),
  dailyFindMany:vi.fn(),
  dailyCreate:vi.fn()
}));

vi.mock('@/lib/db',()=>({
  db:{
    reviewQueueItem:{findMany:mocks.reviewFindMany},
    examResult:{findFirst:mocks.examFindFirst},
    studyPlan:{findFirst:mocks.planFindFirst},
    coachingAction:{findMany:mocks.actionFindMany},
    dailyLog:{findMany:mocks.dailyFindMany,create:mocks.dailyCreate}
  }
}));

import {
  acknowledgeSmartNotification,
  buildNotificationCandidates,
  buildSmartNotifications,
  parseNotificationAck,
  trDateKey,
  trDayStart,
  weekKey
} from './smartNotifications';

beforeEach(()=>{
  vi.clearAllMocks();
  mocks.reviewFindMany.mockResolvedValue([]);
  mocks.examFindFirst.mockResolvedValue({createdAt:new Date('2026-09-22T12:00:00Z')});
  mocks.planFindFirst.mockResolvedValue(null);
  mocks.actionFindMany.mockResolvedValue([]);
  mocks.dailyFindMany.mockResolvedValue([]);
  mocks.dailyCreate.mockResolvedValue({id:'log1'});
});

describe('smart notification date helpers',()=>{
  it('İstanbul tarihini UTC sınırından bağımsız hesaplar',()=>{
    expect(trDateKey(new Date('2026-09-24T21:30:00Z'))).toBe('2026-09-25');
    expect(trDayStart(new Date('2026-09-24T21:30:00Z')).toISOString()).toBe('2026-09-24T21:00:00.000Z');
  });

  it('hafta anahtarını pazartesine sabitler',()=>{
    expect(weekKey(new Date('2026-09-21T12:00:00Z'))).toBe('2026-09-21');
    expect(weekKey(new Date('2026-09-27T12:00:00Z'))).toBe('2026-09-21');
  });

  it('yalnız akıllı bildirim okunma kayıtlarını tanır',()=>{
    expect(parseNotificationAck({kind:'SMART_NOTIFICATION_ACK',notificationId:'n1'})).toBe('n1');
    expect(parseNotificationAck({kind:'OTHER',notificationId:'n1'})).toBeNull();
    expect(parseNotificationAck(null)).toBeNull();
  });
});

describe('buildNotificationCandidates',()=>{
  const now=new Date('2026-09-25T08:00:00Z');

  it('yalnız anlamlı dört sinyali üretir ve yüksek önceliği önce getirir',()=>{
    const items=buildNotificationCandidates({
      now,
      dueReviewDates:[
        new Date('2026-09-24T10:00:00Z'),
        new Date('2026-09-25T09:00:00Z'),
        new Date('2026-09-25T12:00:00Z')
      ],
      latestExamAt:new Date('2026-09-10T08:00:00Z'),
      latestPlan:{id:'p1',title:'27 Eylül Haftası',updatedAt:new Date('2026-09-24T08:00:00Z')},
      partialTasks:[{id:'a1',title:'Kimya 20 soru',completionRate:45}]
    });

    expect(items.map(x=>x.kind)).toEqual([
      'PARTIAL_TASK','REVIEW_DUE','EXAM_STALE','PLAN_UPDATED'
    ]);
    expect(items.find(x=>x.kind==='REVIEW_DUE')).toMatchObject({
      priority:'HIGH',title:'3 tekrarın zamanı geldi'
    });
    expect(items.find(x=>x.kind==='PARTIAL_TASK')?.message).toContain('%45');
    expect(items.find(x=>x.kind==='EXAM_STALE')?.id).toBe('exam-stale:2026-09-21');
    expect(items.find(x=>x.kind==='PLAN_UPDATED')?.id).toContain('p1');
  });

  it('yakın zamanda deneme yapıldıysa, eski plan varsa ve yarım görev yoksa gereksiz bildirim üretmez',()=>{
    const items=buildNotificationCandidates({
      now,
      dueReviewDates:[],
      latestExamAt:new Date('2026-09-23T08:00:00Z'),
      latestPlan:{id:'p1',title:'Eski plan',updatedAt:new Date('2026-09-01T08:00:00Z')},
      partialTasks:[]
    });
    expect(items).toEqual([]);
  });

  it('deneme hiç yoksa haftada bir ölçüm hatırlatması üretir',()=>{
    const items=buildNotificationCandidates({
      now,dueReviewDates:[],latestExamAt:null,latestPlan:null,partialTasks:[]
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({kind:'EXAM_STALE',priority:'MEDIUM'});
  });
});

describe('buildSmartNotifications',()=>{
  const now=new Date('2026-09-25T08:00:00Z');

  it('DB durumundan bildirimleri türetir ve okunmuş olanı filtreler',async()=>{
    mocks.reviewFindMany.mockResolvedValue([{dueAt:new Date('2026-09-25T06:00:00Z')}]);
    mocks.examFindFirst.mockResolvedValue({createdAt:new Date('2026-09-10T08:00:00Z')});
    mocks.planFindFirst.mockResolvedValue({id:'p1',title:'Haftalık plan',updatedAt:new Date('2026-09-24T08:00:00Z')});
    mocks.actionFindMany.mockResolvedValue([{
      id:'a1',title:'Matematik 20 soru',currentValue:10,targetValue:20,
      submission:{completionRate:50}
    }]);
    mocks.dailyFindMany.mockResolvedValue([{
      payload:{kind:'SMART_NOTIFICATION_ACK',notificationId:'exam-stale:2026-09-21'}
    }]);

    const items=await buildSmartNotifications('s1',now);
    expect(items.some(x=>x.kind==='EXAM_STALE')).toBe(false);
    expect(items.map(x=>x.kind)).toEqual(['PARTIAL_TASK','REVIEW_DUE','PLAN_UPDATED']);
    expect(mocks.actionFindMany).toHaveBeenCalledTimes(1);
  });

  it('includeAcknowledged=true ise mevcut adayların tamamını döndürür',async()=>{
    mocks.examFindFirst.mockResolvedValue(null);
    mocks.dailyFindMany.mockResolvedValue([{
      payload:{kind:'SMART_NOTIFICATION_ACK',notificationId:'exam-stale:2026-09-21'}
    }]);
    const items=await buildSmartNotifications('s1',now,true);
    expect(items.some(x=>x.kind==='EXAM_STALE')).toBe(true);
  });
});

describe('acknowledgeSmartNotification',()=>{
  const now=new Date('2026-09-25T08:00:00Z');

  it('güncel bildirimi DailyLog içinde okundu olarak kaydeder',async()=>{
    mocks.examFindFirst.mockResolvedValue(null);
    const item=await acknowledgeSmartNotification('s1','exam-stale:2026-09-21',now);
    expect(item?.kind).toBe('EXAM_STALE');
    expect(mocks.dailyCreate).toHaveBeenCalledWith({data:{
      studentId:'s1',
      date:now,
      payload:{
        kind:'SMART_NOTIFICATION_ACK',
        notificationId:'exam-stale:2026-09-21',
        acknowledgedAt:now.toISOString()
      }
    }});
  });

  it('artık güncel olmayan bildirimi yazmaz',async()=>{
    const item=await acknowledgeSmartNotification('s1','yok',now);
    expect(item).toBeNull();
    expect(mocks.dailyCreate).not.toHaveBeenCalled();
  });
});
