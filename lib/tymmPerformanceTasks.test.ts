import {describe,expect,it} from 'vitest';
import {TYMM_PERFORMANCE_TASKS,performanceTaskById,performanceTasksForGrade,performanceTaskEvidence,evaluateHumanRubric} from './tymmPerformanceTasks';
import {resolveLearningCurriculumContext} from './curriculumPolicy2026';

describe('MEB TYMM insan rubrikli performans görevleri',()=>{
 it('altı görev üç gerçek türde ve doğru sınıf/kaynağa bağlıdır',()=>{
  expect(TYMM_PERFORMANCE_TASKS).toHaveLength(8);
  expect(new Set(TYMM_PERFORMANCE_TASKS.map(x=>x.id)).size).toBe(8);
  expect(new Set(TYMM_PERFORMANCE_TASKS.map(x=>x.kind))).toEqual(new Set(['MODEL','OPEN_RESPONSE','EXPERIMENT_DESIGN']));
  for(const task of TYMM_PERFORMANCE_TASKS){
   expect(task.contentStatus).toBe('PILOT');
   expect(task.steps).toHaveLength(3);
   expect(task.criteria).toHaveLength(4);
   expect(new Set(task.criteria.map(c=>c.id)).size).toBe(4);
   expect(performanceTaskEvidence(task).outcomeCodeVerified).toBe(true);
   expect(task.sourceUrl).toContain('https://tymm.meb.gov.tr/');
   expect(performanceTaskById(task.id,task.version)?.grade).toBe(task.grade);
   expect(performanceTaskById(task.id,task.version+1)).toBeNull();
   expect(performanceTasksForGrade(task.grade).some(x=>x.id===task.id)).toBe(true);
   expect(task.safety.length).toBeGreaterThan(30);
  }
 });
 it('öğrencinin grubuna yanlış sınıf performans görevi gösterilemez',()=>{
  const five=resolveLearningCurriculumContext({gradeLevel:'Ortaokul 5-6 | Maarif Model',selectedGrade:5});
  const six=resolveLearningCurriculumContext({gradeLevel:'Ortaokul 5-6 | Maarif Model',selectedGrade:6});
  const unresolved=resolveLearningCurriculumContext({gradeLevel:'Ortaokul 5-6 | Maarif Model'});
  expect(unresolved.grade).toBeNull();
  expect(five.grade).toBe(5);
  expect(six.grade).toBe(6);
  expect(performanceTasksForGrade(five.grade!).every(x=>x.grade===5)).toBe(true);
  expect(performanceTasksForGrade(six.grade!).every(x=>x.grade===6)).toBe(true);
  expect(performanceTasksForGrade(8)).toHaveLength(0);
  expect(performanceTasksForGrade(12)).toHaveLength(0);
 });
 it('0-2 puanlı dört ölçüt insan incelemesiyle 8 üzerinden hesaplanır; hâkimiyet ilerlemez',()=>{
  const task=TYMM_PERFORMANCE_TASKS[0];
  const scores=Object.fromEntries(task.criteria.map(c=>[c.id,2]));
  const outcome=evaluateHumanRubric(task,scores);
  expect(outcome.total).toBe(8);
  expect(outcome.max).toBe(8);
  expect(outcome.percentage).toBe(100);
  expect(outcome.masteryStatusUnchanged).toBe(true);
  expect(outcome.requiresFurtherEvidence).toBe(false);
  const partial=evaluateHumanRubric(task,{...scores,[task.criteria[0].id]:0});
  expect(partial.total).toBe(6);
  expect(partial.percentage).toBe(75);
  expect(partial.requiresFurtherEvidence).toBe(true);
 });
 it('eksik, ek, kesirli ve sınır dışı rubrik puanını reddeder',()=>{
  const task=TYMM_PERFORMANCE_TASKS[2];
  const all=Object.fromEntries(task.criteria.map(c=>[c.id,2]));
  expect(()=>evaluateHumanRubric(task,{})).toThrow();
  expect(()=>evaluateHumanRubric(task,{...all,other:0})).toThrow();
  expect(()=>evaluateHumanRubric(task,{...all,[task.criteria[0].id]:-1})).toThrow();
  expect(()=>evaluateHumanRubric(task,{...all,[task.criteria[0].id]:3})).toThrow();
  expect(()=>evaluateHumanRubric(task,{...all,[task.criteria[0].id]:0.5})).toThrow();
  const partial={...all};
  delete partial[task.criteria[2].id];
  expect(()=>evaluateHumanRubric(task,partial)).toThrow();
 });
 it('resmî kaynak URL ve sınıfı sahteyse kaynak onayı üretmez',()=>{
  const task=TYMM_PERFORMANCE_TASKS[0];
  expect(performanceTaskEvidence({...task,sourceUrl:'https://invalid.example'}).outcomeCodeVerified).toBe(false);
  expect(performanceTaskEvidence({...task,grade:12}).outcomeCodeVerified).toBe(false);
  expect(performanceTaskEvidence({...task,outcomeCode:'FAKE.MEB.CODE'}).outcomeCodeVerified).toBe(false);
 });
});
