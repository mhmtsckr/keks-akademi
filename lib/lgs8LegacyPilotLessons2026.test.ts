import {describe,it,expect} from 'vitest';
import {VERIFIED_LGS8_OUTCOMES,findLgs8Outcome} from './verifiedLgs8Outcomes2026';
import {LGS8_LEGACY_PILOT_LESSONS} from './lgs8LegacyPilotLessons2026';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('8. sınıf LGS / önceki MEB programı / kaynaklı pilot',()=>{
 it('6 kodu resmî TTKB belgesine bağlar, TYMM kodu gibi sunmaz',()=>{
  expect(VERIFIED_LGS8_OUTCOMES).toHaveLength(6);
  expect(VERIFIED_LGS8_OUTCOMES.map(x=>x.code)).toEqual([
    'T.8.3.17','T.8.3.25','T.8.3.32','F.8.1.1.1','F.8.1.2.1','F.8.2.1.3'
  ]);
  expect(new Set(VERIFIED_LGS8_OUTCOMES.map(x=>x.code)).size).toBe(6);
  for(const x of VERIFIED_LGS8_OUTCOMES){
   expect(x.grade).toBe(8);
   expect(x.framework).toBe('MEB_LEGACY_8');
   expect(x.sourceUrl).toMatch(/^https:\/\/ttkb\.meb\.gov\.tr\//);
   expect(findLgs8Outcome(x.code)).toEqual(x);
  }
 });
 it('her birinde üç adımlı özgün örnek ve 4 seçenekli gerekçeli 24 farklı soru var',()=>{
  expect(LGS8_LEGACY_PILOT_LESSONS).toHaveLength(6);
  const prompts:string[]=[];
  for(const l of LGS8_LEGACY_PILOT_LESSONS){
    expect(l.targetGrades).toEqual([8]);
    expect(l.contentStatus).toBe('PILOT');
    expect(l.sourceThemeId).toBeTruthy();
    expect(l.worked.steps).toHaveLength(3);
    expect(l.exercises).toHaveLength(4);
    expect(l.explanation.length).toBeGreaterThan(70);
    const evidence=lessonSourceEvidence(l);
    expect(evidence.outcomeCodeVerified).toBe(true);
    expect(evidence.outcomeCode).toBe(l.sourceThemeId);
    expect(evidence.interpretation).toContain('önceki MEB');
    expect(lessonSourceEvidence({...l,sourceUrl:'https://invalid.example'}).outcomeCodeVerified).toBe(false);
    for(const q of l.exercises){
      expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
      expect(new Set(Object.values(q.options||{})).size).toBe(4);
      expect(q.options?.[q.answer]).toBeTruthy();
      expect(q.explanation.length).toBeGreaterThan(25);
      prompts.push(q.prompt);
    }
  }
  expect(new Set(prompts).size).toBe(24);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('8 dışındaki sınıflara ve mezun ÖSYM grubuna ait değildir',()=>{
  const l=LGS8_LEGACY_PILOT_LESSONS[0];
  const eight=resolveLearningCurriculumContext({gradeLevel:'8. sınıf'});
  const seven=resolveLearningCurriculumContext({gradeLevel:'7. sınıf'});
  const nine=resolveLearningCurriculumContext({gradeLevel:'9. sınıf'});
  const graduate=resolveLearningCurriculumContext({gradeLevel:'Mezun | YKS',examType:'TYT'});
  expect(eight.framework).toBe('MEB_LEGACY');
  for(const lesson of LGS8_LEGACY_PILOT_LESSONS){
   expect(lessonAllowedForContext(lesson,eight)).toBe(true);
   expect(lessonAllowedForContext(lesson,seven)).toBe(false);
   expect(lessonAllowedForContext(lesson,nine)).toBe(false);
   expect(lessonAllowedForContext(lesson,graduate)).toBe(false);
   expect(findMicroLesson({subject:lesson.subject,topic:lesson.title})?.id).toBe(lesson.id);
  }
  expect(findMicroLesson({subject:'Türkçe',topic:'Tüm Paragraf Soruları'})).toBeNull();
 });
 it('8. sınıfın kaynaklı kodları haritaya girer, kalan KEKS LGS konuları korunur',()=>{
   const curriculum=getEducationCurriculum('8. sınıf');
   expect(curriculum?.educationLevelKey).toBe('MIDDLE_8');
   expect(curriculum?.framework).toBe('EXAM');
   expect(curriculum?.sourceLabel).toContain('Önceki MEB');
   for(const subject of ['Türkçe','Fen Bilimleri']){
     const units=curriculum?.subjects.find(x=>x.name===subject)?.units||[];
     expect(units.some(x=>x.name.includes('doğrulanmış eski MEB'))).toBe(true);
     expect(units.some(x=>x.name.includes('LGS hazırlık konu dizini'))).toBe(true);
     const ids=units.flatMap(x=>x.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id))));
     for(const row of VERIFIED_LGS8_OUTCOMES.filter(x=>x.subject===subject))expect(ids).toContain(row.code);
   }
   const snap=microLessonCoverageSnapshot();
   expect(snap.verifiedLgs8.verifiedSelectedOutcomes).toBe(6);
   expect(snap.verifiedLgs8.linkedPilotLessons).toBe(6);
   expect(snap.gradeRows.find(x=>x.grade===8)?.framework).toBe('MEB_LEGACY');
   expect(snap.totalLessons).toBe(111);
   expect(snap.totalExercises).toBe(444);
   expect(snap.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
