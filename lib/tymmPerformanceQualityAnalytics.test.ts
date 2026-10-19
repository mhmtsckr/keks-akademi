import {describe,it,expect} from 'vitest';
import {performanceQualitySnapshot,type PerformanceLogRow} from './tymmPerformanceQualityAnalytics';
const now=new Date('2026-10-20T12:00:00.000Z');
const cs=(a:number,b:number,c:number,d:number)=>[
 {id:'geometry',score:a},{id:'light',score:b},{id:'phases',score:c},{id:'reasoning',score:d}
];
function row(createdAt:string,payload:Record<string,unknown>):PerformanceLogRow{
 return {createdAt:new Date(createdAt),payload:{grade:5,subject:'Fen Bilimleri',
  outcomeCode:'FB.5.1.3',...payload,studentId:'PRIVATE-STUDENT-ID',
  response:'PRIVATE WRITTEN EVIDENCE',studentFullName:'NOT FOR REPORT'}};
}
const review=(when:string,vals:number[],extras:Record<string,unknown>={})=>({
 reviewedAt:when,max:8,total:vals.reduce((n,x)=>n+x,0),
 criterionScores:cs(vals[0],vals[1],vals[2],vals[3]),
 criterionEvidence:{geometry:'Bu öğrencinin ifadesindeki kanıt somuttur.',
  light:'Işık ve model ilişkisi açıklandı.',
  phases:'Evre ayrımı açıklandı.',reasoning:'Açıklama yeterli gerekçe içeriyor.'},
 ...extras
});
describe('TYMM pilot yönetici kalite raporu',()=>{
 const rows:PerformanceLogRow[]=[
  row('2026-10-12T10:00:00Z',{type:'TYMM_PERFORMANCE_SUBMISSION'}),
  row('2026-10-13T10:00:00Z',{type:'TYMM_PERFORMANCE_REVIEWED',review:review('2026-10-14T10:00:00Z',[1,1,2,1])}),
  row('2026-10-18T12:00:00Z',{type:'TYMM_TRANSFER_SUBMISSION'}),
  row('2026-10-19T08:00:00Z',{type:'TYMM_TRANSFER_REVIEWED',review:review('2026-10-19T11:00:00Z',[2,2,2,1],{
   comparison:{baselineTotal:5,transferTotal:7,delta:2}
  })}),
  row('2026-10-18T12:00:00Z',{type:'TYMM_PERFORMANCE_REVIEWED',grade:9,subject:'Fizik',
   outcomeCode:'FİZ.9.2.2',review:review('2026-10-19T12:00:00Z',[1,0,1,1],{criterionEvidence:{}})}),
  row('2026-05-01T12:00:00Z',{type:'TYMM_PERFORMANCE_SUBMISSION'}),
  row('2026-10-18T12:00:00Z',{type:'OTHER_KIND_IGNORE'})
 ];
 it('90 günlük dönemde teslim, koç bekleme ve 48 saat uyarılarını doğru toplar',()=>{
  const x=performanceQualitySnapshot(rows,now);
  expect(x.submitted).toBe(5);
  expect(x.baselineSubmitted).toBe(3);
  expect(x.transferSubmitted).toBe(2);
  expect(x.reviewed).toBe(3);
  expect(x.awaitingCoach).toBe(2);
  expect(x.over48Hours).toBe(2);
  expect(x.validRubrics).toBe(3);
  expect(x.lateReviews).toBe(0);
  expect(x.averageReviewHours).toBe(17);
  expect(x.distinctOutcomeCodes).toBe(2);
  expect(x.byGradeAndSubject).toHaveLength(2);
  expect(x.byGradeAndSubject[0].grade).toBe(5);
  expect(x.byGradeAndSubject[1].grade).toBe(9);
 });
 it('bağımsız ikinci rubriği sadece tanımlı ölçüt farkı olarak yorumlar',()=>{
  const x=performanceQualitySnapshot(rows,now);
  expect(x.transfersWithValidComparison).toBe(1);
  expect(x.improved).toBe(1);
  expect(x.struggled).toBe(0);
  expect(x.similar).toBe(0);
  expect(x.averageTransferDelta).toBe(2);
  expect(x.missingReviewRationale).toBe(1);
  expect(x.disclaimers.join(' ')).toContain('kalıcı öğrenme');
 });
 it('öğrenci kimliği, cevap, rubrik notu veya log ID değerlerini dışarı vermez',()=>{
  const report=performanceQualitySnapshot(rows,now);
  const txt=JSON.stringify(report);
  expect(txt).not.toContain('PRIVATE-STUDENT-ID');
  expect(txt).not.toContain('PRIVATE WRITTEN EVIDENCE');
  expect(txt).not.toContain('NOT FOR REPORT');
  expect(txt).not.toContain('Bu öğrencinin ifadesindeki');
 });
 it('veri yoksa başarı veya başarısızlık çıkarmaz; kısmi raporu işaretler',()=>{
  const empty=performanceQualitySnapshot([],now);
  expect(empty.submitted).toBe(0);
  expect(empty.averageReviewHours).toBeNull();
  expect(empty.averageTransferDelta).toBeNull();
  const bounded=performanceQualitySnapshot(rows,now,{days:90,truncated:true});
  expect(bounded.truncated).toBe(true);
  expect(bounded.disclaimers.at(-1)).toContain('limiti aşıldı');
 });
 it('geçersiz, tarih dışı, gelecekteki ve çelişkili karşılaştırmaları saymaz',()=>{
  const extra=[
   row('2026-10-21T00:00:00Z',{type:'TYMM_TRANSFER_SUBMISSION'}),
   row('2026-10-19T10:00:00Z',{type:'TYMM_TRANSFER_REVIEWED',review:review('2026-10-20T10:00:00Z',[2,2,2,2],
    {comparison:{baselineTotal:4,transferTotal:8,delta:1}})})
  ];
  const r=performanceQualitySnapshot([...rows,...extra],now);
  expect(r.submitted).toBe(6);
  expect(r.transfersWithValidComparison).toBe(1);
 });
});
