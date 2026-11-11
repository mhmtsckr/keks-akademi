import {describe,it,expect} from 'vitest';
import {selectAcademicPlanRecommendations,academicInterventionKey} from './academicPlanRecommendations';
import type {TopicConcordance} from './academicEvidenceConsistency';
const base:TopicConcordance={
 examType:'TYT',subject:'Türkçe',topic:'Ana düşünce',
 practiceQuestions:24,practiceDays:3,practiceAccuracy:95,
 practiceReportedQuestions:10,examQuestions:12,examDays:2,examAccuracy:45,
 accuracyGapPoints:50,status:'CONFLICTING',action:'',explanation:'Aynı konu için iki kaynak çelişiyor'
};
describe('akademik analizden koç inceleme önerisi',()=>{
 it('yeterli verili çelişkiden açıklamalı ve iki gün kontrollü taslak üretir',()=>{
  const [x]=selectAcademicPlanRecommendations([base]);
  expect(x).toMatchObject({examType:'TYT',topic:'Ana düşünce',status:'CONFLICTING',
    priority:'HIGH',minutes:20,questions:8,differencePoints:50});
  expect(x.instruction).toContain('iki farklı günde');
 });
 it('zayıf iki kaynak için destek önerisi üretir',()=>{
  const [x]=selectAcademicPlanRecommendations([{
    ...base,status:'BOTH_NEED_SUPPORT',accuracyGapPoints:5,practiceAccuracy:52,examAccuracy:47
  }]);
  expect(x.priority).toBe('MEDIUM');
 });
 it('az soru veya tek gün ile yorum oluşturmaz',()=>{
  expect(selectAcademicPlanRecommendations([
    {...base,examDays:1},{...base,practiceQuestions:9}
  ])).toHaveLength(0);
 });
 it('aynı sınav/konu tekrarını ayıklar ancak TYT ile AYT yi birleştirmez',()=>{
  const out=selectAcademicPlanRecommendations([
    base,{...base,subject:'TÜRKÇE',topic:'ANA DÜŞÜNCE'},
    {...base,examType:'AYT'}
  ]);
  expect(out).toHaveLength(2);
  expect(academicInterventionKey(base)).not.toBe(academicInterventionKey({...base,examType:'AYT'}));
 });
 it('yüksek doğruluk çiftini ve belirsiz veriyi zorunlu göreve çevirmez',()=>{
  expect(selectAcademicPlanRecommendations([
    {...base,status:'BOTH_HIGH',accuracyGapPoints:1},
    {...base,status:'INSUFFICIENT',accuracyGapPoints:null},
  ])).toHaveLength(0);
 });
});
