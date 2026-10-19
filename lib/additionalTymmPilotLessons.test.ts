import {describe,expect,it} from 'vitest';
import {VERIFIED_ADDITIONAL_TYMM_OUTCOMES} from './verifiedAdditionalTymmOutcomes';
import {ADDITIONAL_TYMM_PILOT_LESSONS} from './additionalTymmPilotLessons';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {getEducationCurriculum} from './educationCurriculumMap';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('MEB TYMM 5/6 Fen ve 9/10/11 kaynaklı pilot genişleme',()=>{
 it('resmî kaynaklara bağlanan sekiz benzersiz öğrenme çıktısı kodunu doğrular',()=>{
  expect(VERIFIED_ADDITIONAL_TYMM_OUTCOMES).toHaveLength(8);
  expect(VERIFIED_ADDITIONAL_TYMM_OUTCOMES.map(x=>x.code)).toEqual([
   'FB.5.3.1','FB.5.3.2','FB.6.4.1','FB.6.4.3',
   'FİZ.9.2.2','KİM.10.1.1','KİM.10.1.6','BİY.11.1.3'
  ]);
  for(const x of VERIFIED_ADDITIONAL_TYMM_OUTCOMES){
   expect(x.url.startsWith('https://tymm.meb.gov.tr/')).toBe(true);
   expect(x.scope).toBe('OFFICIAL_OUTCOME');
  }
 });
 it('her derste özgün çözüm, dört ayrı çoktan seçmeli soru ve gerekçeler vardır',()=>{
  expect(ADDITIONAL_TYMM_PILOT_LESSONS).toHaveLength(8);
  const prompts:string[]=[];
  for(const lesson of ADDITIONAL_TYMM_PILOT_LESSONS){
   expect(lesson.targetGrades).toHaveLength(1);
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.exercises).toHaveLength(4);
   expect(lesson.skill.length).toBeGreaterThan(10);
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(q.explanation.length).toBeGreaterThan(20);
    prompts.push(q.prompt);
   }
   const source=lessonSourceEvidence(lesson);
   expect(source.themeVerified).toBe(true);
   expect(source.outcomeCodeVerified).toBe(true);
   expect(source.outcomeCode).toBe(lesson.sourceThemeId);
   expect(lessonSourceEvidence({...lesson,sourceUrl:'https://invalid.test'}).outcomeCodeVerified).toBe(false);
  }
  expect(new Set(prompts).size).toBe(32);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('5/6 ve 9/10/11 sınıfları birbirinden ayırır, geniş konu adına ders uydurmaz',()=>{
  for(const lesson of ADDITIONAL_TYMM_PILOT_LESSONS){
    const grade=lesson.targetGrades![0];
    const eligible=resolveLearningCurriculumContext({gradeLevel:grade+'. sınıf'});
    const wrong=resolveLearningCurriculumContext({gradeLevel:(grade===5?6:grade===6?5:grade===9?10:grade===10?11:9)+'. sınıf'});
    expect(lessonAllowedForContext(lesson,eligible)).toBe(true);
    expect(lessonAllowedForContext(lesson,wrong)).toBe(false);
    expect(findMicroLesson({subject:lesson.subject,topic:lesson.title})?.id).toBe(lesson.id);
  }
  expect(findMicroLesson({subject:'Kimya',topic:'Etkileşim'})).toBeNull();
  expect(findMicroLesson({subject:'Fen Bilimleri',topic:'Işığın Yansıması ve Renkler'})).toBeNull();
 });
 it('sınıf haritasında doğru resmî kodlar yer alır, tam müfredat denmez',()=>{
  const found=(grade:number,subject:string)=>getEducationCurriculum(grade+'. sınıf')?.subjects.find(s=>s.name===subject);
  const acquisitions=(grade:number,subject:string)=>found(grade,subject)?.units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id))))||[];
  expect(acquisitions(5,'Fen Bilimleri')).toContain('FB.5.3.1');
  expect(acquisitions(5,'Fen Bilimleri')).toContain('FB.5.3.2');
  expect(acquisitions(6,'Fen Bilimleri')).toContain('FB.6.4.1');
  expect(acquisitions(6,'Fen Bilimleri')).toContain('FB.6.4.3');
  expect(acquisitions(9,'Fizik')).toContain('FİZ.9.2.2');
  expect(acquisitions(10,'Kimya')).toContain('KİM.10.1.1');
  expect(acquisitions(10,'Kimya')).toContain('KİM.10.1.6');
  expect(acquisitions(11,'Biyoloji')).toContain('BİY.11.1.3');
  expect(getEducationCurriculum('Lise 9-10 | Maarif Model (1. Aşama)')?.subjects.find(x=>x.name==='Kimya')?.units[0].name).toBe('Düzey Müfredat Haritası');
  const coverage=microLessonCoverageSnapshot();
  expect(coverage.totalLessons).toBe(66);
  expect(coverage.totalExercises).toBe(264);
  expect(coverage.verifiedAdditionalOutcomes.totalOfficialOutcomes).toBe(8);
  expect(coverage.verifiedAdditionalOutcomes.linkedPilotLessons).toBe(8);
  expect(coverage.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
