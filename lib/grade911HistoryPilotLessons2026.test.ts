import {describe,it,expect} from 'vitest';
import {VERIFIED_HISTORY_OUTCOMES,findVerifiedHistoryOutcome} from './verifiedGrade911HistoryOutcomes2026';
import {GRADE911_HISTORY_PILOTS} from './grade911HistoryPilotLessons2026';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';

describe('MEB TYMM 2026-27 grade 9-11 History audited micro lessons',()=>{
 it('six unique official source-checked history outcomes across three exact grades',()=>{
  expect(VERIFIED_HISTORY_OUTCOMES).toHaveLength(6);
  expect(VERIFIED_HISTORY_OUTCOMES.map(x=>x.code)).toEqual([
   'TAR.9.1.2','TAR.9.1.3','TAR.10.1.1','TAR.10.1.2','TAR.11.1.3','TAR.11.1.4'
  ]);
  for(const x of VERIFIED_HISTORY_OUTCOMES){
   expect(x.subject).toBe('Tarih');
   expect(x.url).toMatch(/^https:\/\/tymm\.meb\.gov\.tr\/tarih-dersi\/unite\/\d+$/);
   expect(findVerifiedHistoryOutcome(x.code)).toEqual(x);
   expect(x.verification).toBe('OFFICIAL_OUTCOME');
  }
 });
 it('six new explanations and twenty-four original key-bearing MCQs',()=>{
  expect(GRADE911_HISTORY_PILOTS).toHaveLength(6);
  const allPrompts:string[]=[];
  for(const lesson of GRADE911_HISTORY_PILOTS){
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.exercises).toHaveLength(4);
   const evidence=lessonSourceEvidence(lesson);
   expect(evidence.outcomeCodeVerified).toBe(true);
   expect(evidence.outcomeCode).toBe(lesson.sourceThemeId);
   expect(evidence.sourceUrl).toBe(lesson.sourceUrl);
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(['A','B','C','D']).toContain(q.answer);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(q.explanation.length).toBeGreaterThan(25);
    allPrompts.push(q.prompt);
   }
  }
  expect(new Set(allPrompts).size).toBe(24);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('lesson routing is grade-specific and source spoofing does not claim verified code',()=>{
  for(const l of GRADE911_HISTORY_PILOTS){
   const g=l.targetGrades![0];
   const context=resolveLearningCurriculumContext({gradeLevel:g+'. sınıf'});
   expect(lessonAllowedForContext(l,context)).toBe(true);
   const other=resolveLearningCurriculumContext({gradeLevel:(g===9?10:g===10?11:9)+'. sınıf'});
   expect(lessonAllowedForContext(l,other)).toBe(false);
   expect(findMicroLesson({subject:'Tarih',topic:l.title})?.id).toBe(l.id);
   expect(lessonSourceEvidence({...l,sourceUrl:'https://fake.example/'}).outcomeCodeVerified).toBe(false);
  }
  expect(findMicroLesson({subject:'Tarih',topic:'Türkistan’dan Türkiye’ye'})).toBeNull();
 });
 it('official partial history map and admin gaps, without false completion',()=>{
  for(const grade of [9,10,11]){
   const history=getEducationCurriculum(grade+'. sınıf')?.subjects.find(x=>x.name==='Tarih');
   expect(history).toBeTruthy();
   const codes=history?.units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id))))||[];
   for(const o of VERIFIED_HISTORY_OUTCOMES.filter(x=>x.grade===grade)){
    expect(codes).toContain(o.code);
    expect(history?.units.some(u=>u.sourceUrl===o.url)).toBe(true);
   }
  }
  const c=microLessonCoverageSnapshot();
  expect(c.totalLessons).toBe(108);
  expect(c.totalExercises).toBe(432);
  expect(c.verifiedHistoryOutcomes.officialOutcomeCount).toBe(6);
  expect(c.verifiedHistoryOutcomes.linkedPilotLessons).toBe(6);
  expect(c.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
