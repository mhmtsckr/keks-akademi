import {describe,it,expect} from 'vitest';
import {buildCoachPerformanceQueue} from './tymmCoachQueue';
const students=[{id:'student-a',fullName:'Öğrenci A',gradeLevel:'5. sınıf'},
 {id:'student-b',fullName:'Öğrenci B',gradeLevel:'10. sınıf'}];
const now=new Date('2026-10-12T15:00:00.000Z');
const log=(id:string,studentId:string,type:string,taskId:string,createdAt:string,grade:number)=>
 ({id,studentId,createdAt:new Date(createdAt),payload:{type,taskId,taskVersion:1,grade,response:'özel yanıt - gönderilmeyecek'}});
describe('Koç performans kuyruğu erişimi ve operasyon metrikleri',()=>{
 it('yalnız atanmış öğrenci ve gerçekten bekleyen rubrikleri gösterir',()=>{
  const rows=[
   log('a1','student-a','TYMM_PERFORMANCE_SUBMISSION','perf-g5-moon-model-v1','2026-10-11T12:00:00Z',5),
   log('a2','student-a','TYMM_TRANSFER_SUBMISSION','perf-g5-moon-model-v1','2026-10-12T14:00:00Z',5),
   log('c1','student-c','TYMM_PERFORMANCE_SUBMISSION','perf-g5-moon-model-v1','2026-10-11T12:00:00Z',5),
   log('a3','student-a','TYMM_PERFORMANCE_REVIEWED','perf-g5-moon-model-v1','2026-10-11T12:00:00Z',5),
   log('b1','student-b','TYMM_PERFORMANCE_SUBMISSION','perf-g10-balance-equation-v1','2026-10-12T14:00:00Z',10)
  ];
  const found=buildCoachPerformanceQueue(students,rows,now);
  expect(found.map(x=>x.id)).toEqual(['a1','a2','b1']);
  expect(found[0].priority).toBe('OVERDUE');
  expect(found[0].hoursWaiting).toBe(27);
  expect(found[1].phase).toBe('TRANSFER');
  expect(JSON.stringify(found)).not.toContain('özel yanıt');
 });
 it('geçersiz sürümleri, sahte sınıfı ve gelecek tarihli teslimleri reddeder',()=>{
  const wrong=log('a0','student-a','TYMM_PERFORMANCE_SUBMISSION','perf-g5-moon-model-v1','2026-10-11T12:00:00Z',10);
  const untrusted=log('a9','student-a','TYMM_PERFORMANCE_SUBMISSION','not-a-lesson','2026-10-11T12:00:00Z',5);
  const future=log('a10','student-a','TYMM_PERFORMANCE_SUBMISSION','perf-g5-moon-model-v1','2026-10-14T12:00:00Z',5);
  expect(buildCoachPerformanceQueue(students,[wrong,untrusted,future],now)).toHaveLength(0);
 });
 it('24 saat sınırının altı bekliyor; sınırdaki görev dikkat gerektirir',()=>{
  const before=log('b4','student-a','TYMM_PERFORMANCE_SUBMISSION','perf-g5-moon-model-v1','2026-10-11T15:01:00Z',5);
  const at=log('b5','student-a','TYMM_PERFORMANCE_SUBMISSION','perf-g5-moon-model-v1','2026-10-11T15:00:00Z',5);
  const found=buildCoachPerformanceQueue(students,[before,at],now);
  expect(found.map(x=>x.priority)).toEqual(['OVERDUE','WAITING']);
 });
});
