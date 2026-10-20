import {describe,it,expect} from 'vitest';
import {VERIFIED_GRADE57_SOCIAL,findGrade57SocialOutcome} from './verifiedGrade57SocialOutcomes';
import {GRADE57_SOCIAL_PILOTS} from './grade57SocialPilotLessons2026';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('MEB 2026–27 Sosyal Bilgiler 5, 6 ve 7. sınıf pilotları',()=>{
 it('altı MEB çıktısını kesin resmî URL ve sınıfla doğrular',()=>{
  expect(VERIFIED_GRADE57_SOCIAL).toHaveLength(6);
  expect(new Set(VERIFIED_GRADE57_SOCIAL.map(x=>x.code)).size).toBe(6);
  expect(VERIFIED_GRADE57_SOCIAL.map(x=>x.code)).toEqual([
   'SB.5.1.1','SB.5.6.1','SB.6.2.1','SB.6.2.2','SB.7.5.2','SB.7.6.1'
  ]);
  for(const x of VERIFIED_GRADE57_SOCIAL){
   expect(x.subject).toBe('Sosyal Bilgiler');
   expect(x.grade).toBe(Number(x.code.split('.')[1]));
   expect(x.url).toMatch(/^https:\/\/tymm\.meb\.gov\.tr\/sosyal-bilgiler-dersi\/unite\/\d+$/);
   expect(findGrade57SocialOutcome(x.code)).toEqual(x);
  }
 });
 it('her özgün derste dört farklı soru, tek doğru seçenek ve 3 aşamalı çözüm vardır',()=>{
  expect(GRADE57_SOCIAL_PILOTS).toHaveLength(6);
  const ids=ALL_MICRO_LESSONS.map(x=>x.id);
  expect(new Set(ids).size).toBe(ids.length);
  const prompts:string[]=[];
  for(const l of GRADE57_SOCIAL_PILOTS){
   expect(l.contentStatus).toBe('PILOT');
   expect(l.targetGrades).toHaveLength(1);
   expect(l.worked.steps).toHaveLength(3);
   expect(l.exercises).toHaveLength(4);
   expect(lessonSourceEvidence(l).outcomeCodeVerified).toBe(true);
   expect(lessonSourceEvidence({...l,sourceUrl:'https://wrong.example'}).outcomeCodeVerified).toBe(false);
   expect(lessonSourceEvidence({...l,targetGrades:[8]}).outcomeCodeVerified).toBe(false);
   for(const q of l.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(['A','B','C','D']).toContain(q.answer);
    expect(q.explanation.length).toBeGreaterThan(25);
    prompts.push(q.prompt);
   }
  }
  expect(new Set(prompts).size).toBe(24);
 });
 it('6. sınıf konusu 5. sınıfa veya eski müfredat 8. sınıfa önerilmez',()=>{
  for(const l of GRADE57_SOCIAL_PILOTS){
   const grade=l.targetGrades![0];
   const ctx=resolveLearningCurriculumContext({gradeLevel:grade+'. sınıf'});
   expect(lessonAllowedForContext(l,ctx)).toBe(true);
   const other=resolveLearningCurriculumContext({gradeLevel:(grade===5?6:5)+'. sınıf'});
   expect(lessonAllowedForContext(l,other)).toBe(false);
   expect(findMicroLesson({subject:'Sosyal Bilgiler',topic:l.title})?.id).toBe(l.id);
  }
  expect(findMicroLesson({subject:'Sosyal Bilgiler',topic:'Evimiz Dünya'})).toBeNull();
 });
 it('resmî alt küme içeriği sınıf müfredatında ve yönetici raporunda gösterilir',()=>{
  for(const grade of [5,6,7]){
   const subject=getEducationCurriculum(grade+'. sınıf')?.subjects.find(x=>x.name==='Sosyal Bilgiler');
   const ids=subject?.units.flatMap(u=>u.topics.flatMap(t=>t.subTopics.flatMap(s=>s.acquisitions.map(a=>a.id))))||[];
   for(const output of VERIFIED_GRADE57_SOCIAL.filter(x=>x.grade===grade)){
    expect(ids).toContain(output.code);
    expect(subject?.units.some(u=>u.sourceUrl===output.url)).toBe(true);
   }
   expect(subject?.units.every(x=>x.name.includes('tam çıktı listesi değildir'))).toBe(true);
  }
  const coverage=microLessonCoverageSnapshot();
  expect(coverage.verifiedSocialOutcomes.officialOutcomeCount).toBe(6);
  expect(coverage.verifiedSocialOutcomes.linkedPilotLessons).toBe(6);
  expect(coverage.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
 });
});