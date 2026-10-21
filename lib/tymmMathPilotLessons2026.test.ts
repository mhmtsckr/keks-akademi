import {describe,expect,it} from 'vitest';
import {VERIFIED_TYMM_MATH_OUTCOMES,findVerifiedTymmMathOutcome} from './verifiedTymmMathOutcomes2026';
import {TYMM_MATH_PILOT_LESSONS} from './tymmMathPilotLessons2026';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('2026–27 MEB TYMM kaynaklı 9–11 matematik mikro dersleri',()=>{
 it('6 farklı resmî kazanımın kodu, sınıfı ve doğru MEB sayfası bulunur',()=>{
  expect(VERIFIED_TYMM_MATH_OUTCOMES.map(x=>x.code)).toEqual([
   'MAT.9.7.1','MAT.9.7.2','MAT.10.3.1','MAT.10.6.1','MAT.11.3.1','MAT.11.3.3'
  ]);
  expect(new Set(VERIFIED_TYMM_MATH_OUTCOMES.map(x=>x.code)).size).toBe(6);
  for(const x of VERIFIED_TYMM_MATH_OUTCOMES){
   expect(x.code).toMatch(new RegExp('^MAT\\.'+x.grade+'\\.'));
   expect(x.verification).toBe('OFFICIAL_OUTCOME');
   expect(x.checkedOn).toBe('2026-10-20');
   expect(x.url.startsWith('https://tymm.meb.gov.tr/matematik-dersi/unite/')).toBe(true);
   expect(findVerifiedTymmMathOutcome(x.code)).toEqual(x);
  }
 });
 it('6 özgün pilot derste 24 farklı soru, dört seçenek ve gerekçeli anahtar vardır',()=>{
  expect(TYMM_MATH_PILOT_LESSONS).toHaveLength(6);
  const prompts:string[]=[];
  for(const lesson of TYMM_MATH_PILOT_LESSONS){
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.targetGrades).toHaveLength(1);
   expect(lesson.exercises).toHaveLength(4);
   expect(lesson.worked.steps).toHaveLength(3);
   const source=lessonSourceEvidence(lesson);
   expect(source.outcomeCodeVerified).toBe(true);
   expect(source.outcomeCode).toBe(lesson.sourceThemeId);
   expect(lessonSourceEvidence({...lesson,sourceUrl:'https://example.net'}).outcomeCodeVerified).toBe(false);
   expect(lessonSourceEvidence({...lesson,targetGrades:[12]}).outcomeCodeVerified).toBe(false);
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(q.options?.[q.answer]).toBeTruthy();
    expect(q.explanation.length).toBeGreaterThan(20);
    prompts.push(q.prompt);
   }
  }
  expect(new Set(prompts).size).toBe(24);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('matematik cevap anahtarlarında nicel hesaplar doğru ve dağılım dengelidir',()=>{
  const keys=TYMM_MATH_PILOT_LESSONS.flatMap(l=>l.exercises.map(e=>e.answer));
  const counts=Object.fromEntries(['A','B','C','D'].map(k=>[k,keys.filter(x=>x===k).length]));
  expect(counts).toEqual({A:6,B:6,C:6,D:6});
  const expected:{
   [id:string]:readonly string[]
  }={
   "math-g9-empirical-probability-v1":["23/40","%25","%24","Bu örneklemde mavinin göreli sıklığı %47\u0027dir"],
   'math-g9-theoretical-probability-v1':['1/3','1/4','3/5','3/8'],
   'math-g10-prime-divisors-v1':['9','10','6','10'],
   'math-g10-coordinate-distance-v1':['5','(4,6)','(1,4)','6'],
   'math-g11-trig-transformations-v1':['2π/3','[−3,3]','2','π'],
   'math-g11-exponential-functions-v1':['Azalandır','Tüm gerçek sayılar','Bir birim sağa kaydırma','(0,∞)']
  };
  for(const lesson of TYMM_MATH_PILOT_LESSONS)
   expect(lesson.exercises.map(q=>q.options?.[q.answer])).toEqual(expected[lesson.id]);
 });
 it('9,10,11 gerçek sınıf izolasyonu ve dar beceri eşleştirmesi vardır',()=>{
  for(const l of TYMM_MATH_PILOT_LESSONS){
   const grade=l.targetGrades![0];
   expect(lessonAllowedForContext(l,resolveLearningCurriculumContext({gradeLevel:grade+'. sınıf'}))).toBe(true);
   expect(lessonAllowedForContext(l,resolveLearningCurriculumContext({gradeLevel:(grade===9?10:9)+'. sınıf'}))).toBe(false);
   expect(findMicroLesson({subject:'Matematik',topic:l.title})?.id).toBe(l.id);
  }
  expect(findMicroLesson({subject:'Matematik',topic:'Sayılar'})).toBeNull();
  expect(findMicroLesson({subject:'Matematik',topic:'Olasılık'})).toBeNull();
 });
 it('matematik kodları resmî alt kümeye yansır, kapsam tam gösterilmez',()=>{
  for(const grade of [9,10,11]){
   const map=getEducationCurriculum(grade+'. sınıf');
   const math=map?.subjects.find(s=>s.name==='Matematik');
   const ids=math?.units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id))))||[];
   for(const outcome of VERIFIED_TYMM_MATH_OUTCOMES.filter(x=>x.grade===grade))
    expect(ids).toContain(outcome.code);
  }
  const coverage=microLessonCoverageSnapshot();
  expect(coverage.totalLessons).toBe(111);
  expect(coverage.totalExercises).toBe(444);
  expect(coverage.verifiedMath.totalOfficialOutcomes).toBe(6);
  expect(coverage.verifiedMath.linkedPilotLessons).toBe(6);
  expect(coverage.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});
