import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE9_GEOGRAPHY,findGrade9GeographyOutcome} from './verifiedGrade9GeographyOutcomes';
import {GRADE9_GEOGRAPHY_PILOTS} from './grade9GeographyPilotLessons';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('2026–27 TYMM 9. sınıf Coğrafya kaynaklı içerikler',()=>{
 it('beş MEB çıktı kodunu tema ve kaynak URL ile ilişkilendirir',()=>{
  expect(VERIFIED_GRADE9_GEOGRAPHY).toHaveLength(5);
  expect(VERIFIED_GRADE9_GEOGRAPHY.map(x=>x.code)).toEqual([
   'COĞ.9.2.1','COĞ.9.2.2','COĞ.9.3.2','COĞ.9.4.1','COĞ.9.7.1'
  ]);
  for(const x of VERIFIED_GRADE9_GEOGRAPHY){
   expect(x.grade).toBe(9);
   expect(x.subject).toBe('Coğrafya');
   expect(x.url.startsWith('https://tymm.meb.gov.tr/cografya-dersi/unite/')).toBe(true);
   expect(findGrade9GeographyOutcome(x.code)).toEqual(x);
  }
 });
 it('her mikro ders pilot, sınıfa özel ve 4 farklı açıklamalı MCQ içerir',()=>{
  expect(GRADE9_GEOGRAPHY_PILOTS).toHaveLength(5);
  const prompts:string[]=[];
  for(const lesson of GRADE9_GEOGRAPHY_PILOTS){
   expect(lesson.targetGrades).toEqual([9]);
   expect(lesson.subject).toBe('Coğrafya');
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.exercises).toHaveLength(4);
   expect(lesson.topicTags).toEqual([lesson.title]);
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(new Set(Object.values(q.options||{})).size).toBe(4);
    expect(q.explanation.length).toBeGreaterThan(15);
    prompts.push(q.prompt);
   }
   const source=lessonSourceEvidence(lesson);
   expect(source.outcomeCodeVerified).toBe(true);
   expect(source.outcomeCode).toBe(lesson.sourceThemeId);
   expect(lessonSourceEvidence({...lesson,sourceUrl:'https://fake.example'}).outcomeCodeVerified).toBe(false);
   expect(lessonSourceEvidence({...lesson,targetGrades:[10]}).outcomeCodeVerified).toBe(false);
  }
  expect(new Set(prompts).size).toBe(20);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('öğrenciye yanlış sınıfta açılmaz ve yalnız dar konu etiketiyle otomatik önerilir',()=>{
  const nine=resolveLearningCurriculumContext({gradeLevel:'Lise 9-10 | Maarif Model (1. Aşama)',selectedGrade:9});
  const ten=resolveLearningCurriculumContext({gradeLevel:'Lise 9-10 | Maarif Model (1. Aşama)',selectedGrade:10});
  for(const lesson of GRADE9_GEOGRAPHY_PILOTS){
   expect(lessonAllowedForContext(lesson,nine)).toBe(true);
   expect(lessonAllowedForContext(lesson,ten)).toBe(false);
   expect(findMicroLesson({subject:'Coğrafya',topic:lesson.title})?.id).toBe(lesson.id);
  }
  expect(findMicroLesson({subject:'Coğrafya',topic:'Mekânsal Bilgi Teknolojileri'})).toBeNull();
 });
 it('resmî çıktı haritasını doğru sınıfa ekler ama tüm programın tamamlandığını iddia etmez',()=>{
  const nine=getEducationCurriculum('9. sınıf');
  const geo=nine?.subjects.find(x=>x.name==='Coğrafya');
  const codes=geo?.units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id))))||[];
  expect(codes).toEqual(expect.arrayContaining(VERIFIED_GRADE9_GEOGRAPHY.map(x=>x.code)));
  expect(getEducationCurriculum('10. sınıf')?.subjects.find(x=>x.name==='Coğrafya')?.units.flatMap(
    u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id)))
  )).not.toContain('COĞ.9.2.1');
  const coverage=microLessonCoverageSnapshot();
  expect(coverage.verifiedGrade9Geography.grade).toBe(9);
  expect(coverage.verifiedGrade9Geography.totalOfficialOutcomes).toBe(5);
  expect(coverage.verifiedGrade9Geography.distinctThemes).toBe(4);
  expect(coverage.verifiedGrade9Geography.linkedPilotLessons).toBe(5);
  expect(coverage.totalLessons).toBe(84);
  expect(coverage.totalExercises).toBe(336);
  expect(coverage.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
