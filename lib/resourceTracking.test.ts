import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({
  libraryCreate:vi.fn(),
  libraryFindFirst:vi.fn(),
  libraryFindMany:vi.fn(),
  dailyCreate:vi.fn(),
  dailyFindMany:vi.fn()
}));

vi.mock('@/lib/db',()=>({
  db:{
    libraryItem:{
      create:mocks.libraryCreate,
      findFirst:mocks.libraryFindFirst,
      findMany:mocks.libraryFindMany
    },
    dailyLog:{
      create:mocks.dailyCreate,
      findMany:mocks.dailyFindMany
    }
  }
}));

import {
  addResourceProgress,
  createStudyResource,
  encodeResourceMeta,
  listResourceTracking,
  parseResourceMeta,
  parseResourceProgress
} from './resourceTracking';

beforeEach(()=>{
  vi.clearAllMocks();
});

describe('resourceTracking metadata',()=>{
  it('kaynak metadata bilgisini kayıpsız kodlar ve çözer',()=>{
    const encoded=encodeResourceMeta({
      examType:'TYT',
      subject:'Matematik',
      publisher:'KEKS',
      totalPages:320
    });
    expect(encoded.startsWith('KEKS_RESOURCE_V1:')).toBe(true);
    expect(parseResourceMeta(encoded)).toEqual({
      kind:'STUDY_RESOURCE',
      examType:'TYT',
      subject:'Matematik',
      publisher:'KEKS',
      totalPages:320
    });
  });

  it('geçersiz veya kaynak olmayan notu kaynak saymaz',()=>{
    expect(parseResourceMeta(null)).toBeNull();
    expect(parseResourceMeta('normal not')).toBeNull();
    expect(parseResourceMeta('KEKS_RESOURCE_V1:{bozuk')).toBeNull();
    expect(parseResourceMeta('KEKS_RESOURCE_V1:'+JSON.stringify({kind:'OTHER'}))).toBeNull();
  });

  it('ilerleme payloadını normalize eder',()=>{
    expect(parseResourceProgress({
      kind:'RESOURCE_PROGRESS',
      resourceId:'r1',
      topic:'Problemler',
      pageStart:10,
      pageEnd:15,
      questions:20,
      correct:15,
      wrong:4,
      blank:1
    })).toEqual({
      kind:'RESOURCE_PROGRESS',
      resourceId:'r1',
      topic:'Problemler',
      pageStart:10,
      pageEnd:15,
      questions:20,
      correct:15,
      wrong:4,
      blank:1
    });
    expect(parseResourceProgress({kind:'OTHER'})).toBeNull();
  });
});

describe('resourceTracking persistence',()=>{
  it('kaynağı LibraryItem içinde tiplenmiş metadata ile oluşturur',async()=>{
    mocks.libraryCreate.mockResolvedValue({
      id:'r1',title:'TYT Matematik',createdAt:new Date('2026-09-25T10:00:00Z')
    });
    await createStudyResource('s1','u1',{
      title:'  TYT Matematik  ',
      examType:' TYT ',
      subject:' Matematik ',
      publisher:' KEKS ',
      totalPages:300
    });
    expect(mocks.libraryCreate).toHaveBeenCalledTimes(1);
    const arg=mocks.libraryCreate.mock.calls[0][0];
    expect(arg.data.studentId).toBe('s1');
    expect(arg.data.title).toBe('TYT Matematik');
    expect(parseResourceMeta(arg.data.note)).toMatchObject({
      examType:'TYT',subject:'Matematik',publisher:'KEKS',totalPages:300
    });
  });

  it('kaynak ilerlemesini DailyLog olayına dönüştürür',async()=>{
    const note=encodeResourceMeta({examType:'TYT',subject:'Matematik',publisher:null,totalPages:200});
    mocks.libraryFindFirst.mockResolvedValue({id:'r1',note});
    mocks.dailyCreate.mockResolvedValue({id:'d1'});
    await addResourceProgress('s1',{
      resourceId:'r1',
      topic:'Problemler',
      pageStart:20,pageEnd:25,
      questions:10,correct:7,wrong:2,blank:1
    });
    expect(mocks.dailyCreate).toHaveBeenCalledTimes(1);
    const payload=mocks.dailyCreate.mock.calls[0][0].data.payload;
    expect(payload).toMatchObject({
      kind:'RESOURCE_PROGRESS',
      resourceId:'r1',
      topic:'Problemler',
      questions:10,
      correct:7,
      wrong:2,
      blank:1
    });
  });

  it('öğrenciye ait geçerli kaynak bulunamazsa ilerleme yazmaz',async()=>{
    mocks.libraryFindFirst.mockResolvedValue(null);
    await expect(addResourceProgress('s1',{
      resourceId:'missing',questions:0,correct:0,wrong:0,blank:0
    })).rejects.toThrow('RESOURCE_NOT_FOUND');
    expect(mocks.dailyCreate).not.toHaveBeenCalled();
  });

  it('kaynak çalışma kayıtlarını doğruluk, sayfa ve tempo sinyaline toplar',async()=>{
    const note=encodeResourceMeta({examType:'TYT',subject:'Matematik',publisher:'KEKS',totalPages:100});
    mocks.libraryFindMany.mockResolvedValue([
      {id:'r1',title:'Matematik Kaynağı',note,createdAt:new Date('2026-09-01T10:00:00Z')},
      {id:'x',title:'Normal not',note:'serbest not',createdAt:new Date('2026-09-01T10:00:00Z')}
    ]);
    const rows=[
      ['d1','2026-09-20T10:00:00Z',10,11,10,6,3,1],
      ['d2','2026-09-21T10:00:00Z',11,12,10,6,3,1],
      ['d3','2026-09-22T10:00:00Z',12,13,10,6,3,1],
      ['d4','2026-09-23T10:00:00Z',13,14,10,6,3,1]
    ].map(([id,date,pageStart,pageEnd,questions,correct,wrong,blank])=>({
      id,date:new Date(String(date)),
      payload:{
        kind:'RESOURCE_PROGRESS',
        resourceId:'r1',
        topic:'Problemler',
        pageStart,pageEnd,questions,correct,wrong,blank
      }
    }));
    mocks.dailyFindMany.mockResolvedValue(rows);

    const result=await listResourceTracking('s1');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id:'r1',
      questions:40,
      correct:24,
      wrong:12,
      blank:4,
      accuracy:60,
      currentPage:14,
      pageProgress:14
    });
    expect(result[0].topics).toEqual(['Problemler']);
    expect(result[0].paceSignal).toContain('sayfa ilerlemesi sınırlı');
    expect(result[0].recentEntries).toHaveLength(4);
  });
});
