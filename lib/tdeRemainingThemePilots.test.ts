import {describe,it,expect} from 'vitest';
import {TDE_REMAINING_THEME_PILOTS} from './tdeRemainingThemePilots';
import {VERIFIED_GRADE9_11_TDE_THEMES} from './verifiedGrade911LiteratureThemes';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('9–11 Türk Dili ve Edebiyatında altı boş MEB tema için özgün pilotlar',()=>{
 it('tamamlanmamış altı tema ayrı beceriyle temsil edilir',()=>{
  expect(TDE_REMAINING_THEME_PILOTS).toHaveLength(6);
  const ids=TDE_REMAINING_THEME_PILOTS.map(l=>l.sourceThemeId);
  expect(ids).toEqual(['TYMM.TDE.9.T3','TYMM.TDE.9.T4',
   'TYMM.TDE.10.T3','TYMM.TDE.10.T4','TYMM.TDE.11.T3','TYMM.TDE.11.T4']);
  expect(new Set(ALL_MICRO_LESSONS.map(l=>l.id)).size).toBe(ALL_MICRO_LESSONS.length);
  for(const l of TDE_REMAINING_THEME_PILOTS){
    const theme=VERIFIED_GRADE9_11_TDE_THEMES.find(t=>t.id===l.sourceThemeId);
    expect(theme).toBeTruthy();
    expect(l.targetGrades).toEqual([theme?.grade]);
    expect(l.contentStatus).toBe('PILOT');
    expect(theme?.verification).toBe('THEME_TITLE');
    expect(theme?.outcomeCode).toBeNull();
    const evidence=lessonSourceEvidence(l);
    expect(evidence.themeVerified).toBe(true);
    expect(evidence.outcomeCodeVerified).toBe(false);
    expect(evidence.outcomeCode).toBeNull();
    expect(evidence.sourceUrl).toBe(theme?.sourceUrl);
    expect(lessonSourceEvidence({...l,sourceUrl:'https://example.org'}).themeVerified).toBe(false);
    expect(findMicroLesson({subject:l.subject,topic:l.title})?.id).toBe(l.id);
    const ctx=resolveLearningCurriculumContext({gradeLevel:l.targetGrades?.[0]+'. sınıf'});
    expect(lessonAllowedForContext(l,ctx)).toBe(true);
    expect(lessonAllowedForContext(l,resolveLearningCurriculumContext({
      gradeLevel:(l.targetGrades?.[0]===9?10:9)+'. sınıf'
    }))).toBe(false);
  }
 });
 it('24 ayrı sorunun doğru anahtarı, çeldiricileri ve öğretici açıklamaları vardır',()=>{
  const prompts:string[]=[];
  const letters:string[]=[];
  for(const lesson of TDE_REMAINING_THEME_PILOTS){
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.worked.answer.length).toBeGreaterThan(20);
   expect(lesson.misconception.length).toBeGreaterThan(35);
   expect(lesson.exercises).toHaveLength(4);
   for(const q of lesson.exercises){
     expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
     expect(q.options?.[q.answer]).toBeTruthy();
     expect(new Set(Object.values(q.options||{})).size).toBe(4);
     expect(q.prompt.length).toBeGreaterThan(45);
     expect(q.explanation.length).toBeGreaterThan(40);
     prompts.push(q.prompt);
     letters.push(q.answer);
   }
  }
  expect(new Set(prompts).size).toBe(24);
  expect(letters.filter(a=>a==='A').length).toBe(6);
  expect(letters.filter(a=>a==='B').length).toBe(6);
  expect(letters.filter(a=>a==='C').length).toBe(6);
  expect(letters.filter(a=>a==='D').length).toBe(6);
 });
 it('temanın ilk pilotu var diye resmî kazanımlar tamamen bitmiş görünmez',()=>{
  const snapshot=microLessonCoverageSnapshot();
  expect(snapshot.totalLessons).toBe(94);
  expect(snapshot.totalExercises).toBe(376);
  expect(snapshot.verifiedLiteraturePrograms.reduce((n,x)=>n+x.totalOfficialThemes,0)).toBe(12);
  expect(snapshot.verifiedLiteraturePrograms.reduce((n,x)=>n+x.linkedPilotLessons,0)).toBe(12);
  expect(snapshot.verifiedLiteraturePrograms.reduce((n,x)=>n+x.verifiedOutcomeContexts,0)).toBe(6);
  expect(snapshot.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
