import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE9_11_TDE_THEMES,literatureThemesForGrade} from './verifiedGrade911LiteratureThemes';
import {GRADE9_11_LITERATURE_PILOTS} from './grade911LiteraturePilotLessons';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';

describe('2026–2027 Türk Dili ve Edebiyatı 9/10/11 resmî temalar',()=>{
 it('MEB 12 temayı gerçek sınıf ve URL ile kaynaklı listeler; yalnız altı tema için kod beyan eder',()=>{
  expect(VERIFIED_GRADE9_11_TDE_THEMES).toHaveLength(12);
  for(const g of [9,10,11]){
   expect(literatureThemesForGrade(g)).toHaveLength(4);
   expect(literatureThemesForGrade(g).filter(x=>x.verification==='OUTCOME_CODE')).toHaveLength(2);
  }
  expect(new Set(VERIFIED_GRADE9_11_TDE_THEMES.map(x=>x.id)).size).toBe(12);
  expect(VERIFIED_GRADE9_11_TDE_THEMES.filter(x=>x.outcomeCode)).toHaveLength(6);
  for(const theme of VERIFIED_GRADE9_11_TDE_THEMES){
   expect(theme.sourceUrl.startsWith('https://tymm.meb.gov.tr/turk-dili-ve-edebiyati-dersi/unite/')).toBe(true);
   if(theme.verification==='THEME_TITLE'){expect(theme.outcomeCode).toBeNull();expect(theme.skill).toBeNull();}
   else expect(theme.outcomeCode).toMatch(/^TDE[1-4]\.\d+$/);
  }
 });
 it('6 pilot = 24 farklı ve cevapları gerekçeli 4 şıklı soru; kaynak kanıtı sahteciliği reddedilir',()=>{
  expect(GRADE9_11_LITERATURE_PILOTS).toHaveLength(6);
  const prompts:string[]=[];
  for(const l of GRADE9_11_LITERATURE_PILOTS){
    expect(l.subject).toBe('Türk Dili ve Edebiyatı');
    expect(l.contentStatus).toBe('PILOT');
    expect(l.targetGrades).toHaveLength(1);
    expect(l.worked.steps).toHaveLength(3);
    expect(l.exercises).toHaveLength(4);
    const evidence=lessonSourceEvidence(l);
    expect(evidence.themeVerified).toBe(true);
    expect(evidence.outcomeCodeVerified).toBe(true);
    expect(evidence.sourceUrl).toBe(l.sourceUrl);
    expect(lessonSourceEvidence({...l,sourceUrl:'https://fake.invalid'}).outcomeCodeVerified).toBe(false);
    expect(lessonSourceEvidence({...l,targetGrades:[12]}).themeVerified).toBe(false);
    for(const q of l.exercises){
      expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
      expect(q.options?.[q.answer]).toBeTruthy();
      expect(q.explanation.length).toBeGreaterThan(20);
      prompts.push(q.prompt);
    }
  }
  expect(new Set(prompts).size).toBe(24);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('müfredat haritası 9/10/11 için ayrı tema içerir, birleşik 9–10 ve 12. sınıf TYMM etiketine dönüşmez',()=>{
  for(const grade of [9,10,11]){
    const map=getEducationCurriculum(grade+'. sınıf');
    const edebiyat=map?.subjects.find(x=>x.name==='Türk Dili ve Edebiyatı');
    expect(edebiyat?.units).toHaveLength(4);
    expect(edebiyat?.units.every(u=>u.sourceUrl?.startsWith('https://tymm.meb.gov.tr/'))).toBe(true);
    const eligible=resolveLearningCurriculumContext({gradeLevel:grade+'. sınıf'});
    const ineligible=resolveLearningCurriculumContext({gradeLevel:(grade===11?10:grade+1)+'. sınıf'});
    for(const lesson of GRADE9_11_LITERATURE_PILOTS.filter(x=>x.targetGrades?.includes(grade))){
      expect(lessonAllowedForContext(lesson,eligible)).toBe(true);
      expect(lessonAllowedForContext(lesson,ineligible)).toBe(false);
      expect(findMicroLesson({subject:lesson.subject,topic:lesson.title})?.id).toBe(lesson.id);
    }
  }
  expect(getEducationCurriculum('Lise 9-10 | Maarif Model (1. Aşama)')?.subjects.find(x=>x.name==='Türk Dili ve Edebiyatı')?.units).toHaveLength(1);
  expect(GRADE9_11_LITERATURE_PILOTS.every(x=>!x.targetGrades?.includes(12))).toBe(true);
 });
 it('kapsama raporu temasız kalan kazanımları tamamlanmış gibi göstermiyor',()=>{
  const c=microLessonCoverageSnapshot();
  expect(c.verifiedLiteraturePrograms).toHaveLength(3);
  expect(c.verifiedLiteraturePrograms.reduce((n,x)=>n+x.totalOfficialThemes,0)).toBe(12);
  expect(c.verifiedLiteraturePrograms.reduce((n,x)=>n+x.linkedPilotLessons,0)).toBe(12);
  expect(c.verifiedLiteraturePrograms.reduce((n,x)=>n+x.verifiedOutcomeContexts,0)).toBe(6);
  expect(c.totalLessons).toBe(106);
  expect(c.totalExercises).toBe(424);
  expect(c.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});