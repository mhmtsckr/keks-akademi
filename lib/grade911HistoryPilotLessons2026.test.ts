import {describe,it,expect} from 'vitest';
import {VERIFIED_GRADE911_HISTORY_UNITS,VERIFIED_GRADE911_HISTORY_OUTCOMES,historyUnitsForGrade,verifiedHistoryOutcome} from './verifiedGrade911HistoryOutcomes2026';
import {GRADE911_HISTORY_PILOT_LESSONS} from './grade911HistoryPilotLessons2026';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {getEducationCurriculum} from './educationCurriculumMap';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('2026–27 MEB TYMM 9–11 Tarih müfredatına kaynaklı pilot',()=>{
 it('üç sınıfın dokuz resmî ünite başlığını ve yalnız altı doğrulanmış çıktı kodunu gösterir',()=>{
  expect(VERIFIED_GRADE911_HISTORY_UNITS).toHaveLength(9);
  expect(VERIFIED_GRADE911_HISTORY_OUTCOMES).toHaveLength(6);
  for(const grade of [9,10,11])expect(historyUnitsForGrade(grade)).toHaveLength(3);
  expect(VERIFIED_GRADE911_HISTORY_OUTCOMES.map(x=>x.code)).toEqual([
   'TAR.9.1.3','TAR.9.2.3','TAR.10.1.1','TAR.10.1.3','TAR.11.1.3','TAR.11.2.4'
  ]);
  for(const unit of VERIFIED_GRADE911_HISTORY_UNITS){
   expect(unit.url.startsWith('https://tymm.meb.gov.tr/tarih-dersi/unite/')).toBe(true);
  }
  for(const outcome of VERIFIED_GRADE911_HISTORY_OUTCOMES){
   expect(verifiedHistoryOutcome(outcome.code)).toEqual(outcome);
   expect(VERIFIED_GRADE911_HISTORY_UNITS.some(u=>u.grade===outcome.grade&&u.unit===outcome.unit&&u.url===outcome.url)).toBe(true);
  }
 });
 it('altı ayrı pilot derste 24 özgün soru, açıklamalı anahtar ve çapraz sınıf izolasyonu bulunur',()=>{
  expect(GRADE911_HISTORY_PILOT_LESSONS).toHaveLength(6);
  const allPrompts:string[]=[];
  for(const lesson of GRADE911_HISTORY_PILOT_LESSONS){
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.targetGrades).toHaveLength(1);
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.exercises).toHaveLength(4);
   expect(lessonSourceEvidence(lesson).outcomeCodeVerified).toBe(true);
   expect(lessonSourceEvidence({...lesson,sourceUrl:'https://example.com'}).outcomeCodeVerified).toBe(false);
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(Object.values(q.options||{}).filter(v=>v===q.options?.[q.answer])).toHaveLength(1);
    expect(q.explanation.length).toBeGreaterThan(25);
    allPrompts.push(q.prompt);
   }
   const correct=resolveLearningCurriculumContext({gradeLevel:lesson.targetGrades![0]+'. sınıf'});
   const incorrect=resolveLearningCurriculumContext({gradeLevel:(lesson.targetGrades![0]===9?10:9)+'. sınıf'});
   expect(lessonAllowedForContext(lesson,correct)).toBe(true);
   expect(lessonAllowedForContext(lesson,incorrect)).toBe(false);
   expect(findMicroLesson({subject:'Tarih',topic:lesson.title})?.id).toBe(lesson.id);
  }
  expect(new Set(allPrompts).size).toBe(24);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('öğretim programında henüz kodlanmayan üniteleri tamamlanmış göstermez',()=>{
  for(const grade of [9,10,11]){
   const map=getEducationCurriculum(grade+'. sınıf');
   const history=map?.subjects.find(s=>s.name==='Tarih');
   expect(history?.units).toHaveLength(3);
   const officialIds=history!.units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(x=>x.id))));
   const expected=VERIFIED_GRADE911_HISTORY_OUTCOMES.filter(x=>x.grade===grade).map(x=>x.code);
   expect(officialIds).toEqual(expected);
   const sourceOnlyUnit=history?.units.filter(u=>u.topics[0].subTopics[0].acquisitions.length===0);
   expect(sourceOnlyUnit?.length).toBeGreaterThanOrEqual(1);
  }
  const cov=microLessonCoverageSnapshot();
  expect(cov.verifiedHistoryPrograms).toHaveLength(3);
  expect(cov.verifiedHistoryPrograms.reduce((n,x)=>n+x.totalOfficialUnits,0)).toBe(9);
  expect(cov.verifiedHistoryPrograms.reduce((n,x)=>n+x.checkedOutcomeSubset,0)).toBe(6);
  expect(cov.verifiedHistoryPrograms.reduce((n,x)=>n+x.linkedPilotLessons,0)).toBe(6);
  expect(cov.totalLessons).toBe(100);
  expect(cov.totalExercises).toBe(400);
  expect(cov.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
