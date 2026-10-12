import {describe,it,expect} from 'vitest';
import {TYMM_PERFORMANCE_TASKS} from './tymmPerformanceTasks';
import {CRITERION_INTERVENTIONS,interventionFor,suggestRubricInterventions} from './tymmRubricInterventions';

describe('Koç onaylı ölçüte özel TYMM telafi aksiyonları',()=>{
 it('sekiz görev ve 32 ölçütün hepsinde güvenli, somut kısa telafi bulunur',()=>{
  expect(TYMM_PERFORMANCE_TASKS).toHaveLength(8);
  expect(CRITERION_INTERVENTIONS).toHaveLength(32);
  expect(new Set(CRITERION_INTERVENTIONS.map(x=>x.taskId+'|'+x.criterionId)).size).toBe(32);
  for(const t of TYMM_PERFORMANCE_TASKS){
   expect(t.criteria).toHaveLength(4);
   for(const c of t.criteria){
    const action=interventionFor(t.id,c.id);
    expect(action).not.toBeNull();
    expect(action?.task.length).toBeGreaterThan(45);
    expect(action?.expectedEvidence.length).toBeGreaterThan(20);
    expect(action?.minutes).toBeGreaterThanOrEqual(5);
    expect(action?.minutes).toBeLessThanOrEqual(10);
    expect(action?.mode).toBe('WRITTEN_SAFE_PRACTICE');
   }
  }
 });
 it('önce en düşük puanlı ölçüt önerilir, koç atamadıkça durum öneri kalır',()=>{
  const t=TYMM_PERFORMANCE_TASKS[0];
  const scores=t.criteria.map((c,i)=>({id:c.id,label:c.label,score:[2,1,0,1][i]}));
  const proposed=suggestRubricInterventions(t.id,scores,2);
  expect(proposed.map(x=>x.criterionId)).toEqual([t.criteria[2].id,t.criteria[1].id]);
  expect(proposed.map(x=>x.score)).toEqual([0,1]);
  expect(proposed.every(x=>x.status==='SUGGESTED_NOT_ASSIGNED')).toBe(true);
  expect(proposed.every(x=>x.masteryStatusUnchanged===true)).toBe(true);
 });
 it('tam puanda telafi zorlanmaz; tanı ve kalıcı öğrenme sonucu üretilmez',()=>{
  const t=TYMM_PERFORMANCE_TASKS[5];
  const full=t.criteria.map(c=>({id:c.id,label:c.label,score:2}));
  expect(suggestRubricInterventions(t.id,full)).toEqual([]);
  expect(interventionFor('UNKNOWN',t.criteria[0].id)).toBeNull();
  expect(interventionFor(t.id,'UNKNOWN')).toBeNull();
 });
 it('eksik, yinelenen, negatif, kesirli ve bilinmeyen puanlara güvenilmez',()=>{
  const t=TYMM_PERFORMANCE_TASKS[0];
  const full=t.criteria.map(c=>({id:c.id,label:c.label,score:1}));
  expect(suggestRubricInterventions(t.id,full.slice(1))).toEqual([]);
  expect(suggestRubricInterventions(t.id,[...full.slice(0,3),full[2]])).toEqual([]);
  expect(suggestRubricInterventions(t.id,full.map((c,i)=>i===1?{...c,score:-1}:c))).toEqual([]);
  expect(suggestRubricInterventions(t.id,full.map((c,i)=>i===1?{...c,score:0.5}:c))).toEqual([]);
  expect(suggestRubricInterventions(t.id,full.map((c,i)=>i===1?{...c,id:'UNAUTHORIZED'}:c))).toEqual([]);
  expect(suggestRubricInterventions(t.id,full,0)).toEqual([]);
 });
});
