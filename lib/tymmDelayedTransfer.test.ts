import {describe,expect,it} from 'vitest';
import {TYMM_TRANSFER_VARIANTS,transferVariantFor,transferDueAt,transferEligibility,compareTransferRubrics,readableRubric} from './tymmDelayedTransfer';
import {TYMM_PERFORMANCE_TASKS} from './tymmPerformanceTasks';

const baselineReview=(at:string)=>({
 total:5,max:8,reviewedAt:at,criterionScores:[
  {id:'geometry',score:1},{id:'light',score:1},{id:'phases',score:2},{id:'reasoning',score:1}
 ]
});
function row(type:string,id:string,taskId:string,at:string,review?:unknown){
 return {id,createdAt:new Date(at),payload:{type,taskId,taskVersion:1,review}};
}
describe('Bağımsız gecikmeli TYMM performans ölçümü',()=>{
 it('altı görev için özgün ikinci bağlam ve aynı dört rubrik boyutunu korur',()=>{
  expect(TYMM_TRANSFER_VARIANTS).toHaveLength(11);
  expect(new Set(TYMM_TRANSFER_VARIANTS.map(x=>x.id)).size).toBe(11);
  for(const task of TYMM_PERFORMANCE_TASKS){
   const v=transferVariantFor(task.id);
   expect(v).not.toBeNull();
   expect(v?.grade).toBe(task.grade);
   expect(v?.sourceUrl).toBe(task.sourceUrl);
   expect(v?.outcomeCode).toBe(task.outcomeCode);
   expect(v?.criteria.map(c=>c.id)).toEqual(task.criteria.map(c=>c.id));
   expect(v?.title).not.toBe(task.title);
   expect(v?.instruction).not.toBe(task.instruction);
   expect(v?.contentStatus).toBe('PILOT');
  }
 });
 it('7 gün tam dolmadan görev kapalı, insan rubriği yoksa hiç açılmaz',()=>{
  const task='perf-g5-moon-model-v1';
  const original=row('TYMM_PERFORMANCE_REVIEWED','base1',task,'2026-10-01T11:00:00Z',baselineReview('2026-10-02T12:00:00Z'));
  expect(transferDueAt(new Date('2026-10-02T12:00:00Z')).toISOString()).toBe('2026-10-09T12:00:00.000Z');
  expect(transferEligibility(task,[row('TYMM_PERFORMANCE_SUBMISSION','base1',task,'2026-10-01T11:00:00Z')],new Date('2026-10-12'))?.status).toBe('AWAITING_BASELINE');
  expect(transferEligibility(task,[original],new Date('2026-10-09T11:59:59Z')).status).toBe('LOCKED');
  expect(transferEligibility(task,[original],new Date('2026-10-09T12:00:00Z')).status).toBe('AVAILABLE');
  expect(transferEligibility(task,[original],new Date('2026-10-08T23:59:00Z')).dueAt).toBe('2026-10-09T12:00:00.000Z');
 });
 it('ikincil görev tekrar gönderilemez ve koç onayından sonra reviewed görünür',()=>{
  const id='perf-g5-moon-model-v1';
  const base=row('TYMM_PERFORMANCE_REVIEWED','base1',id,'2026-10-01T11:00:00Z',baselineReview('2026-10-02T12:00:00Z'));
  const sent=row('TYMM_TRANSFER_SUBMISSION','transfer1',id,'2026-10-10T12:00:00Z');
  expect(transferEligibility(id,[sent,base],new Date('2026-10-12')).status).toBe('WAITING_FOR_COACH');
  const graded=row('TYMM_TRANSFER_REVIEWED','transfer1',id,'2026-10-10T12:00:00Z');
  expect(transferEligibility(id,[graded,base],new Date('2026-10-12')).status).toBe('REVIEWED');
 });
 it('aynı kriterde 0-2 puan farkını hesaplar ama kalıcılık üretmez',()=>{
  const first=baselineReview('2026-10-02T12:00:00Z');
  const after={total:7,max:8,criterionScores:[
   {id:'geometry',score:2},{id:'light',score:2},{id:'phases',score:2},{id:'reasoning',score:1}
  ]};
  const c=compareTransferRubrics(first,after);
  expect(c.delta).toBe(2);
  expect(c.criteria.map(x=>x.delta)).toEqual([1,1,0,0]);
  expect(c.interpretation).toContain('gelişim');
  expect(c.masteryStatusUnchanged).toBe(true);
  expect(c.reviewScheduleUnchanged).toBe(true);
  const lower=compareTransferRubrics(first,{total:3,max:8,criterionScores:[
   {id:'geometry',score:1},{id:'light',score:0},{id:'phases',score:1},{id:'reasoning',score:1}
  ]});
  expect(lower.delta).toBe(-2);
  expect(lower.interpretation).toContain('güçlük');
 });
 it('eşleşmeyen rubrik, eksik veri ve uydurma ölçütü reddeder',()=>{
  const first=baselineReview('2026-10-02T12:00:00Z');
  expect(readableRubric({})).toBeNull();
  expect(readableRubric({total:8,max:8,criterionScores:[]})).toBeNull();
  expect(readableRubric({total:8,max:8,criterionScores:first.criterionScores})).toBeNull(); // 1+1+2+1=5, not 8
  expect(readableRubric({total:5,max:8,criterionScores:[
    {id:'geometry',score:1},{id:'geometry',score:1},{id:'phases',score:2},{id:'reasoning',score:1}
  ]})).toBeNull();
  const bad=row('TYMM_PERFORMANCE_REVIEWED','baseBad','perf-g5-moon-model-v1',
    '2026-10-01T10:00:00Z',baselineReview('2026-09-30T10:00:00Z'));
  expect(transferEligibility('perf-g5-moon-model-v1',[bad],new Date('2026-10-12')).status).toBe('AWAITING_BASELINE');
  const wrongVersion=row('TYMM_PERFORMANCE_REVIEWED','baseWrong','perf-g5-moon-model-v1',
    '2026-10-01T10:00:00Z',baselineReview('2026-10-02T10:00:00Z'));
  wrongVersion.payload.taskVersion=999;
  expect(transferEligibility('perf-g5-moon-model-v1',[wrongVersion],new Date('2026-10-12')).status).toBe('AWAITING_BASELINE');
  expect(()=>compareTransferRubrics(first,{total:4,max:10,criterionScores:first.criterionScores})).toThrow();
  expect(()=>compareTransferRubrics(first,{total:4,max:8,criterionScores:[
   {id:'alien',score:1},{id:'light',score:1},{id:'phases',score:1},{id:'reasoning',score:1}
  ]})).toThrow();
 });
});