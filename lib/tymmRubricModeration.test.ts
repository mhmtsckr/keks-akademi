import {describe,expect,it} from 'vitest';
import {compareIndependentRubrics,validateModeratorEvidence} from './tymmRubricModeration';
import type {RubricSnapshot} from './tymmDelayedTransfer';

const ids=['geometry','light','phases','reasoning'];
const snap=(scores:number[]):RubricSnapshot=>({
 total:scores.reduce((n,x)=>n+x,0),max:8,
 criterionScores:ids.map((id,i)=>({id,score:scores[i]}))
});
describe('TYMM bağımsız ikinci değerlendirici kalite kontrolü',()=>{
 it('dört ölçütün tamamen aynı puanlanması tam uyumdur',()=>{
  const c=compareIndependentRubrics(snap([1,2,0,1]),snap([1,2,0,1]));
  expect(c.decision).toBe('AGREEMENT');
  expect(c.criterionExactMatches).toBe(4);
  expect(c.absoluteTotalGap).toBe(0);
  expect(c.studentMasteryUnchanged).toBe(true);
  expect(c.reviewScheduleUnchanged).toBe(true);
 });
 it('bir ölçütte bir puan farkı küçük ayrışmadır',()=>{
  const c=compareIndependentRubrics(snap([1,2,1,1]),snap([1,1,1,1]));
  expect(c.decision).toBe('MINOR_DIFFERENCE');
  expect(c.absoluteTotalGap).toBe(1);
  expect(c.criterionExactMatches).toBe(3);
  expect(c.needsAcademicFollowUp).toBe(false);
 });
 it('iki toplam puan farkı veya tek ölçütte iki puan farkı akademik takip gerektirir',()=>{
  const a=compareIndependentRubrics(snap([0,0,1,1]),snap([1,1,1,1]));
  expect(a.decision).toBe('ESCALATE');
  expect(a.absoluteTotalGap).toBe(2);
  const b=compareIndependentRubrics(snap([0,2,2,2]),snap([2,2,2,2]));
  expect(b.decision).toBe('ESCALATE');
  expect(b.highestCriterionGap).toBe(2);
  const compensating=compareIndependentRubrics(snap([0,2,1,1]),snap([2,0,1,1]));
  expect(compensating.absoluteTotalGap).toBe(0);
  expect(compensating.decision).toBe('ESCALATE');
 });
 it('eksik, yinelenmiş, sahte veya toplamı tutarsız rubrikler karşılaştırılmaz',()=>{
  const original=snap([1,1,1,1]);
  const duplicate={total:4,max:8,criterionScores:[
    {id:'geometry',score:1},{id:'geometry',score:1},{id:'phases',score:1},{id:'reasoning',score:1}
  ]};
  expect(()=>compareIndependentRubrics(original,duplicate)).toThrow();
  expect(()=>compareIndependentRubrics(original,{...original,total:8})).toThrow();
  expect(()=>compareIndependentRubrics(original,{...original,criterionScores:original.criterionScores.slice(0,3)})).toThrow();
  expect(()=>compareIndependentRubrics(original,{
    ...original,criterionScores:[...original.criterionScores.slice(0,3),{id:'invented',score:1}]
  })).toThrow();
 });
 it('ikinci değerlendirici her ölçütte en az 20 karakterli somut gerekçe vermelidir',()=>{
  const good=Object.fromEntries(ids.map(id=>[id,'Öğrenci metninden alınan somut kanıt ve açıklama.']));
  expect(Object.keys(validateModeratorEvidence(ids,good))).toEqual(ids);
  expect(()=>validateModeratorEvidence(ids,{...good,light:'kısa'})).toThrow();
  expect(()=>validateModeratorEvidence(ids,{...good,extra:'Ayrı bir kanıt.'})).toThrow();
  expect(()=>validateModeratorEvidence(ids,{geometry:good.geometry})).toThrow();
 });
});