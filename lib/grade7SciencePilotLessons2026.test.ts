import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE7_SCIENCE_OUTCOMES,findGrade7ScienceOutcome} from './verifiedGrade7ScienceOutcomes';
import {GRADE7_SCIENCE_PILOTS} from './grade7SciencePilotLessons2026';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('MEB TYMM 2026–27: 7. sınıf Fen Bilimleri resmî ünite kaynakları',()=>{
 it('resmî kaynaklardan yedi farklı üniteye ait birer öğrenme çıktısı vardır',()=>{
  expect(VERIFIED_GRADE7_SCIENCE_OUTCOMES).toHaveLength(7);
  expect(VERIFIED_GRADE7_SCIENCE_OUTCOMES.map(x=>x.unit)).toEqual([1,2,3,4,5,6,7]);
  expect(VERIFIED_GRADE7_SCIENCE_OUTCOMES.map(x=>x.code)).toEqual([
   'FB.7.1.1.1','FB.7.2.1.2','FB.7.3.1.1','FB.7.4.2.2',
   'FB.7.5.2.1','FB.7.6.1.3','FB.7.7.1.1'
  ]);
  expect(VERIFIED_GRADE7_SCIENCE_OUTCOMES.every(x=>
    x.url.startsWith('https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/')&&
    x.grade===7&&x.subject==='Fen Bilimleri'&&x.verification==='OFFICIAL_OUTCOME')).toBe(true);
  for(const x of VERIFIED_GRADE7_SCIENCE_OUTCOMES)expect(findGrade7ScienceOutcome(x.code)?.url).toBe(x.url);
 });
 it('her ünitede bir özgün pilot ders, adım adım örnek ve dört gerekçeli soru bulunur',()=>{
  expect(GRADE7_SCIENCE_PILOTS).toHaveLength(7);
  const allPrompts:string[]=[];
  for(const lesson of GRADE7_SCIENCE_PILOTS){
   expect(lesson.targetGrades).toEqual([7]);
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.worked.steps).toHaveLength(3);
   expect(lesson.exercises).toHaveLength(4);
   expect(new Set(lesson.exercises.map(x=>x.prompt)).size).toBe(4);
   expect(findMicroLesson({subject:'Fen Bilimleri',topic:lesson.title})?.id).toBe(lesson.id);
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(['A','B','C','D']).toContain(q.answer);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(q.explanation.length).toBeGreaterThan(22);
    allPrompts.push(q.prompt);
   }
   const source=lessonSourceEvidence(lesson);
   expect(source.outcomeCodeVerified).toBe(true);
   expect(source.outcomeCode).toBe(lesson.sourceThemeId);
   expect(lessonSourceEvidence({...lesson,sourceUrl:'https://example.invalid'}).outcomeCodeVerified).toBe(false);
   expect(lessonSourceEvidence({...lesson,targetGrades:[8]}).outcomeCodeVerified).toBe(false);
  }
  expect(new Set(allPrompts).size).toBe(28);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('sadece yedinci sınıfa atanır, sekizinci sınıf LGS öğrencisine Maarif dersi açılmaz',()=>{
  const seven=resolveLearningCurriculumContext({gradeLevel:'7. sınıf'});
  const eight=resolveLearningCurriculumContext({gradeLevel:'8. sınıf'});
  for(const lesson of GRADE7_SCIENCE_PILOTS){
   expect(lessonAllowedForContext(lesson,seven)).toBe(true);
   expect(lessonAllowedForContext(lesson,eight)).toBe(false);
  }
  expect(findMicroLesson({subject:'Fen Bilimleri',topic:'Maddenin Doğasına Yolculuk'})).toBeNull();
 });
 it('gerçek sınıf müfredatında yedi kaynaklı ünite ve eksiksiz olduğu iddia edilmeyen çıktı alt kümesi vardır',()=>{
  const map=getEducationCurriculum('7. sınıf');
  const units=map?.subjects.find(x=>x.name==='Fen Bilimleri')?.units||[];
  expect(units).toHaveLength(7);
  const ids=units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(st=>st.acquisitions.map(a=>a.id))));
  expect(ids).toEqual(VERIFIED_GRADE7_SCIENCE_OUTCOMES.map(x=>x.code));
  expect(units.every(u=>u.sourceUrl?.startsWith('https://tymm.meb.gov.tr/'))).toBe(true);
  const c=microLessonCoverageSnapshot();
  expect(c.totalLessons).toBe(102);
  expect(c.totalExercises).toBe(408);
  expect(c.verifiedGrade7Science.totalOfficialUnits).toBe(7);
  expect(c.verifiedGrade7Science.verifiedSampleOutcomes).toBe(7);
  expect(c.verifiedGrade7Science.linkedPilotLessons).toBe(7);
  const sci=c.gradeRows.find(x=>x.grade===7)?.subjects.find(x=>x.subject==='Fen Bilimleri');
  expect(sci?.indexedTopics).toBe(7);
  expect(sci?.matchedIndexTopics).toBe(7);
  expect(c.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
