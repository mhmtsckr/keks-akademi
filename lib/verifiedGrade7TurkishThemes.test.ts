import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE7_TURKISH_THEMES,findVerifiedThemeById} from './verifiedGrade7TurkishThemes';
import {GRADE7_TURKISH_THEME_LESSONS} from './grade7TurkishThemeLessons';
import {ALL_MICRO_LESSONS} from './bankFreeMicroLessons';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';

describe('7. sınıf Türkçe için MEB kaynaklı tema dizini',()=>{
 it('altı resmî MEB temasını kaynak ve doğrulama ayrımıyla sunar',()=>{
  expect(VERIFIED_GRADE7_TURKISH_THEMES).toHaveLength(6);
  expect(new Set(VERIFIED_GRADE7_TURKISH_THEMES.map(t=>t.id)).size).toBe(6);
  for(const theme of VERIFIED_GRADE7_TURKISH_THEMES){
   expect(theme.grade).toBe(7);
   expect(theme.sourceUrl.startsWith('https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/')).toBe(true);
   expect(findVerifiedThemeById(theme.id)).toEqual(theme);
   if(theme.verification==='TEMA_KAPSAMI')expect(theme.outcomeCode).toBeNull();
   if(theme.verification==='KOD_DOGRULANDI')expect(theme.outcomeCode).toMatch(/^T\.O\.7\.\d+$/);
  }
  expect(VERIFIED_GRADE7_TURKISH_THEMES.filter(t=>t.verification==='KOD_DOGRULANDI')).toHaveLength(2);
 });
 it('her tema ayrı özgün örnek ve dört alıştırma alır; aynı cevap gösterimi kullanılmaz',()=>{
  expect(GRADE7_TURKISH_THEME_LESSONS).toHaveLength(6);
  expect(new Set(GRADE7_TURKISH_THEME_LESSONS.flatMap(l=>l.exercises.map(q=>q.prompt))).size).toBe(24);
  expect(new Set(ALL_MICRO_LESSONS.map(l=>l.id)).size).toBe(ALL_MICRO_LESSONS.length);
  for(const lesson of GRADE7_TURKISH_THEME_LESSONS){
   expect(lesson.targetGrades).toEqual([7]);
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.exercises).toHaveLength(4);
   const source=lessonSourceEvidence(lesson);
   expect(source.themeVerified).toBe(true);
   expect(source.sourceUrl).toBe(lesson.sourceUrl);
   expect(source.outcomeCodeVerified).toBe(Boolean(source.outcomeCode));
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(['A','B','C','D']).toContain(q.answer);
    expect(q.explanation.length).toBeGreaterThan(20);
   }
  }
 });
 it('yanlış sınıfa bu tema verilmez ve kaynak kanıtı taklit edilemez',()=>{
  const seven=resolveLearningCurriculumContext({gradeLevel:'7. sınıf'});
  const eight=resolveLearningCurriculumContext({gradeLevel:'8. sınıf'});
  for(const lesson of GRADE7_TURKISH_THEME_LESSONS){
   expect(lessonAllowedForContext(lesson,seven)).toBe(true);
   expect(lessonAllowedForContext(lesson,eight)).toBe(false);
   expect(lessonSourceEvidence({...lesson,sourceUrl:'https://example.org'}).themeVerified).toBe(false);
  }
 });
 it('müfredat haritasında gerçeğe uygun MEB temasını gösterir',()=>{
  const map=getEducationCurriculum('7. sınıf');
  const turkish=map?.subjects.find(x=>x.name==='Türkçe');
  expect(turkish?.units).toHaveLength(6);
  expect(turkish?.units[2].sourceUrl).toContain('/unite/291');
  expect(turkish?.units[2].topics[0].subTopics[0].acquisitions[0].id).toBe('T.O.7.18');
  expect(turkish?.units[0].topics[0].subTopics[0].acquisitions[0].id).toMatch(/^TYMM\.TR\.7\./);
  const coverage=microLessonCoverageSnapshot();
  expect(coverage.totalLessons).toBe(84);
  expect(coverage.totalExercises).toBe(336);
  expect(coverage.verifiedThemeSources.totalThemes).toBe(6);
  expect(coverage.verifiedThemeSources.linkedPilotLessons).toBe(6);
  expect(coverage.verifiedThemeSources.outcomesWithVerifiedCodes).toBe(2);
 });
});
