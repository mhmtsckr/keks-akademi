import {describe,expect,it} from 'vitest';
import {buildCoachEvidence} from './coachEvidence';

const now=new Date('2026-11-10T12:00:00.000Z');
const row=(subject:string,date:string,total:number,correct:number,wrong:number,blank:number)=>({
  subject,date:new Date(date),total,correct,wrong,blank
});

describe('Akıllı Koç kanıt ağırlığı',()=>{
  it('tek kötü testten kalıcı eksik çıkarımı yapmaz',()=>{
    const e=buildCoachEvidence([row('Matematik','2026-11-09T11:00:00Z',5,0,5,0)],now);
    expect(e.confidence).toBe('LOW');
    expect(e.subjects[0].priority).toBe('COLLECT_EVIDENCE');
    expect(e.subjects[0].reason).toContain('kanıt yetersiz');
  });
  it('çok günlü yanlış ve boş oranlarını ayrı izler',()=>{
    const e=buildCoachEvidence([
      row('Türkçe','2026-11-08T12:00:00Z',12,6,3,3),
      row('Türkçe','2026-11-09T12:00:00Z',12,7,3,2)
    ],now);
    expect(e.subjects[0]).toMatchObject({
      subject:'Türkçe',questions:24,wrong:6,blank:5,
      confidence:'MEDIUM',priority:'REVIEW'
    });
  });
  it('eski, tutarsız ve gelecekteki beyanlarla tanı üretmez',()=>{
    const e=buildCoachEvidence([
      row('Fen','2026-09-01T12:00:00Z',40,0,30,10),
      row('Fen','2026-11-09T12:00:00Z',10,7,8,0),
      row('Fen','2026-12-09T12:00:00Z',10,0,10,0)
    ],now);
    expect(e.subjects.length).toBe(0);
    expect(e.eligibleRecords).toBe(0);
  });
  it('yüksek doğruluk kaydını riskli diye etiketlemez',()=>{
    const e=buildCoachEvidence([
      row('Tarih','2026-11-07T12:00:00Z',20,19,1,0),
      row('Tarih','2026-11-08T12:00:00Z',20,18,2,0),
      row('Tarih','2026-11-09T12:00:00Z',20,18,2,0)
    ],now);
    expect(e.confidence).toBe('HIGH');
    expect(e.subjects[0].priority).toBe('MAINTAIN');
  });
});
