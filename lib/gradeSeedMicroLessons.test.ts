import {describe,it,expect} from 'vitest';
import {GRADE_SEED_LESSONS} from './gradeSeedMicroLessons';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('1–12. sınıflar için özgün başlangıç mikro dersleri',()=>{
 it('her sınıfta tam bir ayrı pilot ders ve dört çözümlü alıştırma bulunur',()=>{
  expect(GRADE_SEED_LESSONS).toHaveLength(12);
  expect(GRADE_SEED_LESSONS.map(x=>x.targetGrades?.[0])).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]);
  for(const lesson of GRADE_SEED_LESSONS){
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.topicTags?.length).toBeGreaterThan(0);
   expect(lesson.exercises).toHaveLength(4);
   for(const q of lesson.exercises){
    expect(q.options&&Object.keys(q.options)).toEqual(['A','B','C','D']);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(q.explanation.length).toBeGreaterThan(12);
   }
  }
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('1. sınıf sorusu 3. sınıf öğrencisine veya mezun sınav grubuna açılmaz',()=>{
  const lesson=GRADE_SEED_LESSONS[0];
  const first=resolveLearningCurriculumContext({gradeLevel:'İlkokul 1-2-3',selectedGrade:1});
  const third=resolveLearningCurriculumContext({gradeLevel:'İlkokul 1-2-3',selectedGrade:3});
  const exam=resolveLearningCurriculumContext({gradeLevel:'Mezun | YKS',examType:'TYT'});
  expect(lessonAllowedForContext(lesson,first)).toBe(true);
  expect(lessonAllowedForContext(lesson,third)).toBe(false);
  expect(lessonAllowedForContext(lesson,exam)).toBe(false);
  expect(findMicroLesson({subject:'Türkçe',topic:'Genel',selectedLessonId:lesson.id})?.id).toBe(lesson.id);
 });
 it('konu dizininde eksikler tamamlanmış gibi gösterilmez',()=>{
  const coverage=microLessonCoverageSnapshot();
  expect(coverage.gradeRows).toHaveLength(12);
  expect(coverage.gradeRows.find(x=>x.grade===8)?.framework).toBe('MEB_LEGACY');
  expect(coverage.gradeRows.find(x=>x.grade===12)?.framework).toBe('MEB_LEGACY');
  expect(coverage.totalExercises).toBe(288);
  expect(coverage.totalLessons).toBe(72);
  expect(coverage.status).toBe('EDITORIAL_BACKLOG_NOT_OFFICIAL_ALIGNMENT');
  expect(coverage.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
