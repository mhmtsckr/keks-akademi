import {describe,expect,it} from 'vitest';
import {buildExamNetChange,previousSessionDecisions,summarizeSessionActions,summarizeSessionReviews} from './coachSessionPrep';

describe('otomatik koç görüşme hazırlığı',()=>{
  const now=new Date('2026-09-27T12:00:00Z');

  it('aynı sınav türündeki son iki denemeden net değişimini hesaplar',()=>{
    const result=buildExamNetChange([
      {examType:'TYT',createdAt:new Date('2026-09-27T10:00:00Z'),payload:{net:62}},
      {examType:'AYT',createdAt:new Date('2026-09-25T10:00:00Z'),payload:{net:40}},
      {examType:'TYT',createdAt:new Date('2026-09-20T10:00:00Z'),payload:{net:55}}
    ]);
    expect(result?.examType).toBe('TYT');
    expect(result?.delta).toBe(7);
  });

  it('bu hafta yapılan ve yapılmayan görevleri ayırır',()=>{
    const rows=[
      {id:'1',title:'Paragraf',status:'ACTIVE',periodEnd:new Date('2026-09-26T12:00:00Z'),updatedAt:new Date('2026-09-26T12:00:00Z'),submission:{id:'s1',submittedAt:new Date('2026-09-26T12:00:00Z')}},
      {id:'2',title:'Problem',status:'ACTIVE',periodEnd:new Date('2026-09-26T12:00:00Z'),updatedAt:new Date('2026-09-26T12:00:00Z'),submission:null}
    ];
    const result=summarizeSessionActions(rows,now);
    expect(result.completedCount).toBe(1);
    expect(result.notCompletedCount).toBe(1);
  });

  it('tekrarları tamamlanan, bugün gelen ve geciken olarak ayırır',()=>{
    const rows=[
      {id:'1',status:'COMPLETED',dueAt:new Date('2026-09-26T09:00:00Z'),completedAt:new Date('2026-09-26T10:00:00Z'),lastCorrect:true,question:{subject:'Tarih',topic:'İlk Türk Devletleri'}},
      {id:'2',status:'DUE',dueAt:new Date('2026-09-27T10:00:00Z'),completedAt:null,lastCorrect:null,question:{subject:'Matematik',topic:'Problemler'}},
      {id:'3',status:'PENDING',dueAt:new Date('2026-09-25T10:00:00Z'),completedAt:null,lastCorrect:null,question:{subject:'Türkçe',topic:'Paragraf'}}
    ];
    const result=summarizeSessionReviews(rows,now);
    expect(result.completedCount).toBe(1);
    expect(result.successPercent).toBe(100);
    expect(result.dueTodayCount).toBe(1);
    expect(result.overdueCount).toBe(1);
  });

  it('geçen görüşme kararlarını güvenli biçimde metin listesine dönüştürür',()=>{
    expect(previousSessionDecisions(['30 paragraf','10 problem',5,null])).toEqual(['30 paragraf','10 problem']);
  });
});
