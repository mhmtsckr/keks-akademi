import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE8_12_LEGACY,findVerifiedLegacyOutcome} from './verifiedGrade812LegacyOutcomes';
import {GRADE8_LGS_PILOTS} from './grade8LgsLegacyPilots';
import {GRADE12_AYT_LEGACY_PILOTS} from './grade12AytLegacyPilots';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {getEducationCurriculum} from './educationCurriculumMap';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('2026–2027 eski MEB programı · 8. sınıf LGS / 12. sınıf AYT',()=>{
 it('resmî eski program kaynağıyla sekiz kazanımı doğrular, yanlışlıkla TYMM etiketlemez',()=>{
  expect(VERIFIED_GRADE8_12_LEGACY).toHaveLength(8);
  expect(new Set(VERIFIED_GRADE8_12_LEGACY.map(x=>x.grade+':'+x.code)).size).toBe(8);
  expect(VERIFIED_GRADE8_12_LEGACY.filter(x=>x.grade===8).map(x=>x.code))
    .toEqual(['T.8.3.17','T.8.3.25','T.8.3.29','T.8.3.31']);
  expect(VERIFIED_GRADE8_12_LEGACY.filter(x=>x.grade===12).map(x=>x.code))
    .toEqual(['A.1.8','A.1.9','A.2.9','A.2.12']);
  for(const x of VERIFIED_GRADE8_12_LEGACY){
   expect(x.sourceUrl).toContain('.meb.gov.tr/');
   expect(x.programVersion).toMatch(/^MEB_(TURKCE_2019|TDE_2018)$/);
   expect(findVerifiedLegacyOutcome(x.code)).toEqual(x);
  }
 });
 it('8. sınıfta dört, 12. sınıfta beş şık, özgün çözümler ve açıklamalar sunar',()=>{
  expect(GRADE8_LGS_PILOTS).toHaveLength(4);
  expect(GRADE12_AYT_LEGACY_PILOTS).toHaveLength(4);
  const all=[...GRADE8_LGS_PILOTS,...GRADE12_AYT_LEGACY_PILOTS];
  const prompts=new Set<string>();
  for(const l of all){
   expect(l.targetGrades).toHaveLength(1);
   expect(l.contentStatus).toBe('PILOT');
   expect(l.worked.steps).toHaveLength(3);
   expect(l.exercises).toHaveLength(4);
   const source=lessonSourceEvidence(l);
   expect(source.themeVerified).toBe(true);
   expect(source.outcomeCodeVerified).toBe(true);
   expect(source.outcomeCode).toBe(l.sourceThemeId?.split('LEGACY.'+l.targetGrades![0]+'.')[1]);
   expect(source.interpretation).toContain('TYMM');
   for(const e of l.exercises){
    const letters=Object.keys(e.options||{});
    expect(letters).toEqual(l.targetGrades![0]===8?['A','B','C','D']:['A','B','C','D','E']);
    expect(letters).toContain(e.answer);
    expect(Object.values(e.options||{}).every(v=>v.length>1)).toBe(true);
    expect(new Set(Object.values(e.options||{})).size).toBe(letters.length);
    expect(e.explanation.length).toBeGreaterThan(18);
    expect(prompts.has(e.prompt)).toBe(false);
    prompts.add(e.prompt);
   }
   expect(lessonSourceEvidence({...l,sourceUrl:'https://example.invalid/'}).themeVerified).toBe(false);
  }
  expect(prompts.size).toBe(32);
  expect(new Set(ALL_MICRO_LESSONS.map(l=>l.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('LGS ile AYT sınıfı karışmaz ve geniş tema otomatik kazanım gibi atanmaz',()=>{
  const g8=resolveLearningCurriculumContext({gradeLevel:'8. sınıf'});
  const g12=resolveLearningCurriculumContext({gradeLevel:'12. sınıf'});
  expect(g8.framework).toBe('MEB_LEGACY');
  expect(g12.framework).toBe('MEB_LEGACY');
  for(const l of GRADE8_LGS_PILOTS){
   expect(lessonAllowedForContext(l,g8)).toBe(true);
   expect(lessonAllowedForContext(l,g12)).toBe(false);
   expect(findMicroLesson({subject:l.subject,topic:l.skill})?.id).toBe(l.id);
  }
  for(const l of GRADE12_AYT_LEGACY_PILOTS){
   expect(lessonAllowedForContext(l,g12)).toBe(true);
   expect(lessonAllowedForContext(l,g8)).toBe(false);
   expect(findMicroLesson({subject:l.subject,topic:l.skill})?.id).toBe(l.id);
  }
  expect(findMicroLesson({subject:'Türkçe',topic:'Paragraf'})).toBeNull();
 });
 it('8. ve 12. sınıf haritasında yalnız doğrulanmış kodları ayrı sunar, toplam kapsama uydurmaz',()=>{
  const m8=getEducationCurriculum('8. sınıf');
  const m12=getEducationCurriculum('12. sınıf');
  const t8=m8?.subjects.find(x=>x.name==='Türkçe');
  const t12=m12?.subjects.find(x=>x.name==='Türk Dili ve Edebiyatı');
  expect(t8?.units[0].topics.map(t=>t.subTopics[0].acquisitions[0].id))
   .toEqual(['T.8.3.17','T.8.3.25','T.8.3.29','T.8.3.31']);
  expect(t12?.units[0].topics.map(t=>t.subTopics[0].acquisitions[0].id))
   .toEqual(['A.1.8','A.1.9','A.2.9','A.2.12']);
  expect(t8?.units.length).toBeGreaterThan(1); // Legacy KEKS LGS backlog preserved
  const coverage=microLessonCoverageSnapshot();
  expect(coverage.verifiedLegacyPrograms.selectedOfficialOutcomes).toBe(8);
  expect(coverage.verifiedLegacyPrograms.linkedPilotLessons).toBe(8);
  expect(coverage.totalLessons).toBe(108);
  expect(coverage.totalExercises).toBe(432);
  expect(coverage.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
