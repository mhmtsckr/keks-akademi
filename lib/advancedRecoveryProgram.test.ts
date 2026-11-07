import {describe,expect,it} from 'vitest';
import {buildAdvancedRecoveryProgram} from './advancedRecoveryProgram';
import {buildWrongRecovery,WRONG_REFLECTION_TYPE} from './wrongQuestionRecovery';
import {levelAwareErrorRecovery} from './levelAwareErrorRecovery';
import {buildSubjectRecoveryPlan} from './subjectRecoveryPlan';

const cases=[
 {band:'HIGH_910',examType:'GENEL',reason:'BILGI_EKSIKLIGI',label:'Lise 9–10',minutes:10,count:3},
 {band:'HIGH_11',examType:'AYT',reason:'YONTEM_BILMEME',label:'Lise 11',minutes:12,count:3},
 {band:'HIGH_12',examType:'TYT',reason:'SORU_KOKU',label:'Lise 12',minutes:12,count:4},
 {band:'GRADUATE_YKS',examType:'AYT',reason:'SURE',label:'Mezun',minutes:15,count:4},
 {band:'EXAM_CANDIDATE',examType:'KPSS',reason:'UNUTMA',label:'Yetişkin',minutes:15,count:4}
] as const;

describe('advanced wrong/blank recovery for high school and adult candidates',()=>{
 it.each(cases)('provides an actionable, bounded three-stage protocol for $label',({band,examType,reason,label,minutes,count})=>{
  const p=buildAdvancedRecoveryProgram({
   band,examType,reason,bankReason:'BLANK',subject:'Matematik',topic:'Problemler'
  });
  expect(p).not.toBeNull();
  expect(p?.heading).toContain(label);
  expect(p?.questionTarget).toBe(count);
  expect(p?.totalMinutes).toBe(minutes);
  expect(p?.steps).toHaveLength(3);
  expect(p?.steps.reduce((sum,s)=>sum+s.minutes,0)).toBe(minutes);
  expect(p?.steps.every(x=>x.instruction.length>50)).toBe(true);
  expect(p?.transferEvidenceRule).toContain('farklı sorularda');
 });
 it('keeps different self-reported reasons on distinct learning paths',()=>{
  const base={band:'GRADUATE_YKS' as const,examType:'AYT',subject:'Matematik',topic:'Problemler'};
  const timed=buildAdvancedRecoveryProgram({...base,reason:'SURE'});
  const recall=buildAdvancedRecoveryProgram({...base,reason:'UNUTMA'});
  const indecision=buildAdvancedRecoveryProgram({...base,reason:'KARARSIZLIK'});
  expect(timed?.method).toBe('UNTIMED_TO_TIMED');
  expect(timed?.steps[1].instruction).toContain('süreyi ölç');
  expect(recall?.method).toBe('ACTIVE_RECALL');
  expect(recall?.steps[0].instruction).toContain('bakmadan');
  expect(indecision?.method).toBe('DISTRACTOR_ANALYSIS');
  expect(indecision?.diagnosticCheck).toContain('kanıtı');
 });
 it('never assigns an advanced adult protocol to primary school or unknown level',()=>{
  expect(buildAdvancedRecoveryProgram({band:'PRIMARY_123'})).toBeNull();
  expect(buildAdvancedRecoveryProgram({band:'UNRESOLVED',examType:'GENEL'})).toBeNull();
 });
 it('gives repeated failures a coach-intervention note, not extra question pressure',()=>{
  const p=buildAdvancedRecoveryProgram({
   band:'EXAM_CANDIDATE',reason:'BELIRLENEMEDI',
   bankReason:'BLANK',consecutiveUnsuccessfulReviews:3,examType:'YDS'
  });
  expect(p?.method).toBe('DIAGNOSTIC');
  expect(p?.note).toContain('koçla');
  expect(p?.questionTarget).toBe(4);
 });
 it('adult AGS ÖABT KPSS ALES DGS YDS YÖKDİL are not misrouted as school students',()=>{
  for(const exam of ['AGS','ÖABT','KPSS','ALES','DGS','YDS','YÖKDİL']){
   const r=levelAwareErrorRecovery({gradeLevel:'Lise 12 | YKS',examType:exam,bankReason:'BLANK'});
   expect(r.band).toBe('EXAM_CANDIDATE');
  }
  expect(levelAwareErrorRecovery({gradeLevel:'Mezun',examType:'TYT'}).band).toBe('GRADUATE_YKS');
  expect(levelAwareErrorRecovery({gradeLevel:'Yetişkin',examType:'GENEL'}).band).toBe('UNRESOLVED');
 });
 it('YKS and adult exam scopes retain their actual exam and track when known',()=>{
  const school=buildAdvancedRecoveryProgram({
   band:'HIGH_11',examType:'GENEL',academicTrack:'Eşit Ağırlık',reason:'DIKKAT'
  });
  expect(school?.examScope).toContain('Eşit Ağırlık');
  const graduate=buildAdvancedRecoveryProgram({band:'GRADUATE_YKS',examType:'AYT'});
  expect(graduate?.examScope).toContain('AYT');
  const adult=buildAdvancedRecoveryProgram({band:'EXAM_CANDIDATE',examType:'YÖKDİL'});
  expect(adult?.examScope).toContain('YÖKDİL');
 });
 it('learning plans expose advanced steps but do not change 0-1-3-7-14-28 repeat days',()=>{
  const plan=buildSubjectRecoveryPlan({
   subject:'Türk Dili ve Edebiyatı',topic:'Divan Edebiyatı',
   bankReason:'WRONG',gradeLevel:'Mezun | YKS',examType:'AYT',
   errorReason:'KARARSIZLIK',classificationConfidence:1
  });
  expect(plan.adaptation.band).toBe('GRADUATE_YKS');
  expect(plan.advancedProgram?.method).toBe('DISTRACTOR_ANALYSIS');
  expect(plan.reviewDays).toEqual([0,1,3,7,14,28]);
 });
 it('personal reflection exposes protocol without asserting mastery or publishing answers',()=>{
  const logs=[
   {id:'r',createdAt:new Date('2026-11-01T08:00:00Z'),payload:{
    type:WRONG_REFLECTION_TYPE,questionId:'question-a',reason:'SURE',
    mistakenStep:'Yetiştiremedim',correctedPrinciple:'Süresiz kontrol',
    nextTimeCheck:'Sonraki soruda süreyi izle'
   }},
   {id:'b',createdAt:new Date('2026-11-03T08:00:00Z'),payload:{
    type:'REVIEW_RESULT',questionId:'question-a',correct:false,blank:true,outcome:'BLANK'
   }}
  ];
  const r=buildWrongRecovery('question-a',logs,{
   gradeLevel:'Mezun | YKS',bankReason:'BLANK',subject:'Matematik',topic:'Problemler',
   examType:'TYT',classificationConfidence:1
  });
  expect(r.advancedProgram?.method).toBe('UNTIMED_TO_TIMED');
  expect(r.advancedProgram?.examScope).toContain('TYT');
  expect(r.evidence.blankReviews).toBe(1);
  expect(r.nextTask.code).toBe('RELEARN');
  expect(r.masteryStatusUnchanged).toBe(true);
  expect(r.reviewScheduleUnchanged).toBe(true);
 });
});
