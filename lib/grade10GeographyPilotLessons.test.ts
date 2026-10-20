import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE10_GEOGRAPHY,findVerifiedGeographyOutcome} from './verifiedGrade10GeographyOutcomes';
import {GRADE10_GEOGRAPHY_PILOTS} from './grade10GeographyPilotLessons';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {TYMM_PERFORMANCE_TASKS,performanceTaskEvidence} from './tymmPerformanceTasks';
import {TYMM_TRANSFER_VARIANTS,transferVariantFor} from './tymmDelayedTransfer';

describe('2026–27 10. sınıf Coğrafya MEB TYMM kaynağı ve 8 pilot mikro ders',()=>{
 it('MEB kaynaklı 8 resmî çıktıyı 7 ayrı temadan doğrular',()=>{
  expect(VERIFIED_GRADE10_GEOGRAPHY).toHaveLength(8);
  expect(new Set(VERIFIED_GRADE10_GEOGRAPHY.map(x=>x.code)).size).toBe(8);
  expect(new Set(VERIFIED_GRADE10_GEOGRAPHY.map(x=>x.theme)).size).toBe(7);
  expect(VERIFIED_GRADE10_GEOGRAPHY.map(x=>x.code)).toEqual([
   'COĞ.10.1.1','COĞ.10.2.1','COĞ.10.2.2','COĞ.10.3.1',
   'COĞ.10.4.2','COĞ.10.5.1','COĞ.10.6.1','COĞ.10.7.1'
  ]);
  for(const x of VERIFIED_GRADE10_GEOGRAPHY){
   expect(x.grade).toBe(10);
   expect(x.url.startsWith('https://tymm.meb.gov.tr/cografya-dersi/unite/')).toBe(true);
   expect(findVerifiedGeographyOutcome(x.code)?.url).toBe(x.url);
  }
 });
 it('8 farklı çözümlü ders ve 32 yeni MCQ vardır; soru/gerekçe bütünlüğü korunur',()=>{
  expect(GRADE10_GEOGRAPHY_PILOTS).toHaveLength(8);
  const prompts:string[]=[];
  for(const x of GRADE10_GEOGRAPHY_PILOTS){
   expect(x.contentStatus).toBe('PILOT');
   expect(x.subject).toBe('Coğrafya');
   expect(x.targetGrades).toEqual([10]);
   expect(x.worked.steps).toHaveLength(3);
   expect(x.exercises).toHaveLength(4);
   const evidence=lessonSourceEvidence(x);
   expect(evidence.themeVerified).toBe(true);
   expect(evidence.outcomeCodeVerified).toBe(true);
   expect(evidence.outcomeCode).toBe(x.sourceThemeId);
   expect(lessonSourceEvidence({...x,sourceUrl:'https://example.org'}).outcomeCodeVerified).toBe(false);
   for(const q of x.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(['A','B','C','D']).toContain(q.answer);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(new Set(Object.values(q.options||{})).size).toBe(4);
    expect(q.explanation.length).toBeGreaterThan(20);
    prompts.push(q.prompt);
   }
   expect(findMicroLesson({subject:'Coğrafya',topic:x.title})?.id).toBe(x.id);
  }
  expect(prompts).toHaveLength(32);
  expect(new Set(prompts).size).toBe(32);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('9, 11 ve mezun sınıfına 10. sınıf TYMM mikro dersi atamaz',()=>{
  const lesson=GRADE10_GEOGRAPHY_PILOTS[0];
  const valid=resolveLearningCurriculumContext({gradeLevel:'10. sınıf'});
  const lower=resolveLearningCurriculumContext({gradeLevel:'9. sınıf'});
  const higher=resolveLearningCurriculumContext({gradeLevel:'11. sınıf'});
  expect(lessonAllowedForContext(lesson,valid)).toBe(true);
  expect(lessonAllowedForContext(lesson,lower)).toBe(false);
  expect(lessonAllowedForContext(lesson,higher)).toBe(false);
  expect(findMicroLesson({subject:'Coğrafya',topic:'Mekânsal Bilgi Teknolojileri'})).toBeNull();
 });
 it('10. sınıf Coğrafya haritasında doğrulanmış çıkışların tam alt kümesi vardır',()=>{
  const curriculum=getEducationCurriculum('10. sınıf');
  const geo=curriculum?.subjects.find(x=>x.name==='Coğrafya');
  expect(geo).toBeTruthy();
  const ids=geo?.units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id))))||[];
  for(const x of VERIFIED_GRADE10_GEOGRAPHY)expect(ids).toContain(x.code);
  const cov=microLessonCoverageSnapshot();
  expect(cov.totalLessons).toBe(88);
  expect(cov.totalExercises).toBe(352);
  expect(cov.verifiedGeography.distinctThemes).toBe(7);
  expect(cov.verifiedGeography.totalOfficialOutcomes).toBe(8);
  expect(cov.verifiedGeography.linkedPilotLessons).toBe(8);
  expect(cov.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
 it('iki yeni coğrafya performans görevi, özgün transfer ve gerçek kaynak kanıtına sahiptir',()=>{
  const tasks=TYMM_PERFORMANCE_TASKS.filter(x=>x.grade===10&&x.subject==='Coğrafya');
  expect(tasks).toHaveLength(2);
  for(const task of tasks){
   expect(task.contentStatus).toBe('PILOT');
   expect(task.criteria).toHaveLength(4);
   expect(performanceTaskEvidence(task).outcomeCodeVerified).toBe(true);
   expect(performanceTaskEvidence({...task,sourceUrl:'https://invalid.example'}).outcomeCodeVerified).toBe(false);
   const followup=transferVariantFor(task.id);
   expect(followup?.grade).toBe(10);
   expect(followup?.outcomeCode).toBe(task.outcomeCode);
   expect(followup?.criteria.map(x=>x.id)).toEqual(task.criteria.map(x=>x.id));
   expect(followup?.instruction).not.toBe(task.instruction);
  }
  expect(TYMM_PERFORMANCE_TASKS).toHaveLength(8);
  expect(TYMM_TRANSFER_VARIANTS).toHaveLength(8);
 });
});
