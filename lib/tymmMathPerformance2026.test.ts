import {describe,it,expect} from 'vitest';
import {TYMM_PERFORMANCE_TASKS,performanceTaskEvidence,evaluateHumanRubric,performanceTasksForGrade} from './tymmPerformanceTasks';
import {TYMM_TRANSFER_VARIANTS,transferVariantFor,transferEligibility,compareTransferRubrics} from './tymmDelayedTransfer';
import {VERIFIED_TYMM_MATH_OUTCOMES} from './verifiedTymmMathOutcomes2026';
import {resolveLearningCurriculumContext} from './curriculumPolicy2026';

const codes=['MAT.9.7.2','MAT.10.6.1','MAT.11.3.1'];
const expected=[
 {code:codes[0],grade:9,source:'https://tymm.meb.gov.tr/matematik-dersi/unite/97',words:['1/2','12/20']},
 {code:codes[1],grade:10,source:'https://tymm.meb.gov.tr/matematik-dersi/unite/263',words:['10','(4,6)']},
 {code:codes[2],grade:11,source:'https://tymm.meb.gov.tr/matematik-dersi/unite/281',words:['2π/3','-1≤g(x)≤3']}
];
describe('2026–27 TYMM 9–11 Matematik insan-rubrikli pilot ve farklı bağlam',()=>{
 it('her sınıf için bir özgün görev ve kayıtlı resmî MEB çıktı kaynağı bulunur',()=>{
  const math=TYMM_PERFORMANCE_TASKS.filter(x=>x.subject==='Matematik');
  expect(math).toHaveLength(3);
  expect(math.map(x=>x.grade)).toEqual([9,10,11]);
  for(const entry of expected){
   const task=math.find(x=>x.outcomeCode===entry.code)!;
   expect(task).toBeTruthy();
   expect(task.grade).toBe(entry.grade);
   expect(task.version).toBe(1);
   expect(task.sourceUrl).toBe(entry.source);
   expect(VERIFIED_TYMM_MATH_OUTCOMES.some(x=>x.code===task.outcomeCode&&x.grade===task.grade&&x.url===task.sourceUrl)).toBe(true);
   expect(performanceTaskEvidence(task).outcomeCodeVerified).toBe(true);
   expect(task.contentStatus).toBe('PILOT');
   expect(task.criteria).toHaveLength(4);
   expect(new Set(task.criteria.map(x=>x.id)).size).toBe(4);
   expect(task.steps).toHaveLength(3);
   for(const word of entry.words)expect(task.instruction+task.steps.join(' ')).toContain(word);
   expect(performanceTaskEvidence({...task,grade:12}).outcomeCodeVerified).toBe(false);
   expect(performanceTaskEvidence({...task,sourceUrl:'https://invalid.example'}).outcomeCodeVerified).toBe(false);
   expect(performanceTaskEvidence({...task,outcomeCode:'MAT.FAKE'}).outcomeCodeVerified).toBe(false);
  }
 });
 it('ikinci görevler ilk soruları kopyalamaz, aynı dört ölçütle ölçülür',()=>{
  const ids=new Set<string>();
  for(const task of TYMM_PERFORMANCE_TASKS.filter(x=>x.subject==='Matematik')){
   const second=transferVariantFor(task.id)!;
   expect(second).not.toBeNull();
   expect(second.title).not.toBe(task.title);
   expect(second.instruction).not.toBe(task.instruction);
   expect(second.grade).toBe(task.grade);
   expect(second.outcomeCode).toBe(task.outcomeCode);
   expect(second.contentStatus).toBe('PILOT');
   expect(second.criteria.map(x=>x.id)).toEqual(task.criteria.map(x=>x.id));
   expect(TYMM_TRANSFER_VARIANTS.some(x=>x.id===second.id)).toBe(true);
   ids.add(second.id);
   const gradeContext=resolveLearningCurriculumContext({gradeLevel:task.grade+'. sınıf'});
   expect(gradeContext.grade).toBe(task.grade);
   expect(performanceTasksForGrade(task.grade).some(x=>x.id===task.id)).toBe(true);
  }
  expect(ids.size).toBe(3);
  expect(performanceTasksForGrade(12).filter(x=>x.subject==='Matematik')).toHaveLength(0);
 });
 it('insan rubriği ve gecikmeli karşılaştırma otomatik öğrenme onayına dönüşmez',()=>{
  for(const task of TYMM_PERFORMANCE_TASKS.filter(x=>x.subject==='Matematik')){
   const scores=Object.fromEntries(task.criteria.map(x=>[x.id,1]));
   const baseline=evaluateHumanRubric(task,scores);
   const variant=transferVariantFor(task.id)!;
   const transfer=evaluateHumanRubric({...task,criteria:variant.criteria},Object.fromEntries(task.criteria.map(x=>[x.id,2])));
   const compared=compareTransferRubrics(baseline,transfer);
   expect(baseline.total).toBe(4);
   expect(transfer.total).toBe(8);
   expect(compared.delta).toBe(4);
   expect(compared.criteria.every(x=>x.delta===1)).toBe(true);
   expect(compared.masteryStatusUnchanged).toBe(true);
   expect(compared.reviewScheduleUnchanged).toBe(true);
  }
 });
 it('ilk insan puanı yokken yedi gün kilidi asla açılmaz',()=>{
  const task=TYMM_PERFORMANCE_TASKS.find(x=>x.outcomeCode===codes[0])!;
  const attempt={id:'submitted',createdAt:new Date('2026-10-01T10:00:00Z'),payload:{type:'TYMM_PERFORMANCE_SUBMISSION',taskId:task.id,taskVersion:1}};
  expect(transferEligibility(task.id,[attempt],new Date('2026-10-20T15:00:00Z')).status).toBe('AWAITING_BASELINE');
  const reviewed={
   ...attempt,payload:{
    type:'TYMM_PERFORMANCE_REVIEWED',taskId:task.id,taskVersion:1,
    review:{reviewedAt:'2026-10-18T12:00:00Z',total:4,max:8,criterionScores:task.criteria.map(c=>({id:c.id,score:1}))}
   }
  };
  expect(transferEligibility(task.id,[reviewed],new Date('2026-10-25T11:59:59Z')).status).toBe('LOCKED');
  expect(transferEligibility(task.id,[reviewed],new Date('2026-10-25T12:00:00Z')).status).toBe('AVAILABLE');
 });
});
