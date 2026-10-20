import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE12_LITERATURE} from './verifiedGrade12LiteratureOutcomes';
import {GRADE12_AYT_LEGACY_PILOTS} from './grade12AytLegacyPilots';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {getEducationCurriculum} from './educationCurriculumMap';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';
describe('2026–2027 12. sınıf, önceki MEB 2018 programına göre özgün AYT pilotları',()=>{
 it('dört resmî kazanımı doğru kaynaktan ve okul programından eşler',()=>{
  expect(VERIFIED_GRADE12_LITERATURE).toHaveLength(4);
  expect(VERIFIED_GRADE12_LITERATURE.map(x=>x.code)).toEqual(['A.1.8','A.1.9','A.2.9','A.2.12']);
  expect(VERIFIED_GRADE12_LITERATURE.every(x=>x.grade===12&&x.programVersion==='MEB_TDE_2018'&&x.sourceUrl.includes('.meb.gov.tr/'))).toBe(true);
 });
 it('4 ders 16 yeni beş seçenekli tek doğru anahtarlı sorudan oluşur',()=>{
  expect(GRADE12_AYT_LEGACY_PILOTS).toHaveLength(4);
  const prompts=new Set<string>();
  for(const l of GRADE12_AYT_LEGACY_PILOTS){
   expect(l.targetGrades).toEqual([12]);
   expect(l.contentStatus).toBe('PILOT');
   expect(l.worked.steps).toHaveLength(3);
   expect(l.exercises).toHaveLength(4);
   const src=lessonSourceEvidence(l);
   expect(src.outcomeCodeVerified).toBe(true);
   expect(src.outcomeCode).toBe(l.sourceThemeId?.replace('LEGACY.12.',''));
   expect(src.interpretation).toContain('TYMM');
   expect(lessonSourceEvidence({...l,sourceUrl:'https://invalid.example'}).outcomeCodeVerified).toBe(false);
   for(const q of l.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D','E']);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(new Set(Object.values(q.options||{})).size).toBe(5);
    expect(q.explanation.length).toBeGreaterThan(18);
    expect(prompts.has(q.prompt)).toBe(false);
    prompts.add(q.prompt);
   }
  }
  expect(prompts.size).toBe(16);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('AYT 12. sınıf sorusu TYMM 11 veya LGS 8. sınıfa atanmaz',()=>{
  const a=resolveLearningCurriculumContext({gradeLevel:'12. sınıf'});
  const b=resolveLearningCurriculumContext({gradeLevel:'11. sınıf'});
  const c=resolveLearningCurriculumContext({gradeLevel:'8. sınıf'});
  expect(a.framework).toBe('MEB_LEGACY');
  for(const l of GRADE12_AYT_LEGACY_PILOTS){
   expect(lessonAllowedForContext(l,a)).toBe(true);
   expect(lessonAllowedForContext(l,b)).toBe(false);
   expect(lessonAllowedForContext(l,c)).toBe(false);
   expect(findMicroLesson({subject:l.subject,topic:l.skill})?.id).toBe(l.id);
  }
 });
 it('müfredat haritası ve eksik raporu yalnız kaynaklı dört kazanımı tanır',()=>{
  const m=getEducationCurriculum('12. sınıf');
  const lit=m?.subjects.find(x=>x.name==='Türk Dili ve Edebiyatı');
  expect(lit?.units[0].topics.map(t=>t.subTopics[0].acquisitions[0].id)).toEqual(['A.1.8','A.1.9','A.2.9','A.2.12']);
  expect(m?.sourceLabel).toContain('Önceki MEB');
  const c=microLessonCoverageSnapshot();
  expect(c.verifiedGrade12Literature.totalSelectedOutcomes).toBe(4);
  expect(c.verifiedGrade12Literature.linkedPilotLessons).toBe(4);
  expect(c.totalLessons).toBe(110);
  expect(c.totalExercises).toBe(440);
  expect(c.gradeRows.every(g=>g.topicIndexComplete===false)).toBe(true);
 });
});