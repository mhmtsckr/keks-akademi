import {describe,expect,it} from 'vitest';
import {buildRubricReviewQueue,validateRubricEvidence} from './tymmRubricReviewQuality';
import {TYMM_PERFORMANCE_TASKS} from './tymmPerformanceTasks';

const criteria=TYMM_PERFORMANCE_TASKS[0].criteria;
const all=Object.fromEntries(criteria.map(c=>[c.id,2]));
const weak=Object.fromEntries(criteria.map((c,i)=>[c.id,i===0?0:i===1?1:2]));
describe('TYMM koç rubrik gerekçe ve teslim sırası standardı',()=>{
 it('0 veya 1 puan için her ölçüte özgü en az 20 karakter somut gerekçe ister',()=>{
  expect(()=>validateRubricEvidence(criteria,weak,{})).toThrow();
  const firstNote='Öğrenci modelde konumları yeterince göstermemiş.';
  const secondNote='Işık kaynağı ve yansıma ilişkisini henüz açıklamamış.';
  const evidence=validateRubricEvidence(criteria,weak,{
   [criteria[0].id]:firstNote,[criteria[1].id]:secondNote
  });
  expect(evidence[criteria[0].id]).toBe(firstNote);
  expect(evidence[criteria[1].id]).toBe(secondNote);
  expect(Object.keys(evidence)).toHaveLength(2);
 });
 it('tam puan verilen ölçüt için kanıt isteğe bağlıdır; geçersiz girişler reddedilir',()=>{
  expect(validateRubricEvidence(criteria,all,{})).toEqual({});
  expect(()=>validateRubricEvidence(criteria,weak,{
   [criteria[0].id]:'Bu çok kısa.',
   [criteria[1].id]:'Yansımanın gerekçesi ve ışık kaynağı açıklanmamış.'
  })).toThrow();
  expect(()=>validateRubricEvidence(criteria,all,{
    [criteria[0].id]:'a'.repeat(501)
  })).toThrow();
  expect(()=>validateRubricEvidence(criteria,all,{bogus:'Rubrik ölçütü olmayan başka bir açıklama'})).toThrow();
  expect(()=>validateRubricEvidence(criteria,all,{
    [criteria[0].id]:'Kısa'
  })).toThrow();
  expect(()=>validateRubricEvidence(criteria,{...all,[criteria[0].id]:3},{})).toThrow();
  expect(()=>validateRubricEvidence(criteria,all,{[criteria[0].id]:31 as unknown as string})).toThrow();
 });
 it('bekleyen incelemeleri teslim sırasına göre sıralar, bitenleri dışarıda bırakır',()=>{
  const now=new Date('2026-10-19T12:00:00Z');
  const q=buildRubricReviewQueue([
   {id:'recent',status:'WAITING_FOR_COACH',submittedAt:'2026-10-19T08:00:00Z',phase:'BASELINE'},
   {id:'done',status:'REVIEWED',submittedAt:'2026-10-15T06:00:00Z',phase:'TRANSFER'},
   {id:'old',status:'WAITING_FOR_COACH',submittedAt:'2026-10-15T06:00:00Z',phase:'TRANSFER'},
   {id:'medium',status:'WAITING_FOR_COACH',submittedAt:'2026-10-18T08:00:00Z',phase:'BASELINE'}
  ],now);
  expect(q.pending.map(x=>x.id)).toEqual(['old','medium','recent']);
  expect(q.count).toBe(3);
  expect(q.waitingOver48Hours).toBe(1);
  expect(q.oldestWaitingHours).toBe(102);
  expect(q.pending[0].phase).toBe('TRANSFER');
  expect(q.note).toContain('garantisi değildir');
 });
 it('henüz bekleyen yokken yanlış gecikme ve öncelik göstermez',()=>{
  const q=buildRubricReviewQueue([{id:'done',status:'REVIEWED',submittedAt:'2026-10-01T00:00:00Z'}],new Date('2026-10-19T12:00:00Z'));
  expect(q.count).toBe(0);
  expect(q.oldestWaitingHours).toBe(0);
  expect(q.waitingOver48Hours).toBe(0);
  expect(q.pending).toEqual([]);
 });
});
