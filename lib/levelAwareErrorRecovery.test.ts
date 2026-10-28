import {describe,expect,it} from 'vitest';
import {levelAwareErrorRecovery} from './levelAwareErrorRecovery';
import {buildSubjectRecoveryPlan} from './subjectRecoveryPlan';

describe('every education level wrong and blank learning',()=>{
 const levels=[
  ['İlkokul 1-2-3','PRIMARY_123',1],
  ['İlkokul 4 | Proje Ortaokuluna Hazırlık','PRIMARY_4',2],
  ['Ortaokul 5-6 | Maarif Model','MIDDLE_56',2],
  ['Ortaokul 7 | Maarif Model','MIDDLE_7',2],
  ['Ortaokul 8 | Maarif Model','MIDDLE_8',3],
  ['Lise 9-10 | Maarif Model (1.Aşama)','HIGH_910',3],
  ['Lise 11 | Maarif Model (Alan)','HIGH_11',3],
  ['Lise 12 | YKS','HIGH_12',4],
  ['Mezun | YKS','GRADUATE_YKS',4]
 ] as const;
 it.each(levels)('%s için yaşa uygun günlük çalışma önerisi üretir',(grade,band,count)=>{
  const support=levelAwareErrorRecovery({gradeLevel:grade,bankReason:'BLANK'});
  expect(support.band).toBe(band);
  expect(support.suggestedFreshQuestions).toBe(count);
  expect(support.intervention).toContain('Boş bırakma');
  expect(support.completionRule).toBe('REVIEW_PLUS_NEW_QUESTION_EVIDENCE');
  const plan=buildSubjectRecoveryPlan({
   subject:'Matematik',topic:'Problemler',bankReason:'BLANK',gradeLevel:grade,
   classificationConfidence:1
  });
  expect(plan.adaptation.band).toBe(band);
  expect(plan.status).toBe('BLANK');
  expect(plan.reviewDays).toEqual([0,1,3,7,14,28]);
  expect(plan.note).toContain('tek başına kalıcı öğrenme değildir');
 });
 it('requires short guided support for early primary, not a large test load',()=>{
  const primary=levelAwareErrorRecovery({gradeLevel:'İlkokul 1-2-3',bankReason:'WRONG'});
  expect(primary.guidedBy).toContain('veli');
  expect(primary.maxSessionMinutes).toBe(5);
  expect(primary.blankReasonOptions).toContain('Bilmiyordum');
  expect(primary.blankReasonOptions).not.toContain('Kavram yanılgısı');
 });
 it('handles AGS, KPSS, ALES, DGS and YDS candidates without an invented school grade',()=>{
  for(const examType of ['AGS','KPSS','ALES','DGS','YDS','YÖKDİL']){
   expect(levelAwareErrorRecovery({examType,bankReason:'BLANK'}).band)
     .toBe('EXAM_CANDIDATE');
  }
 });
 it('does not invent student grade when only a general school label exists',()=>{
  const x=levelAwareErrorRecovery({gradeLevel:'Seviye belirsiz'});
  expect(x.band).toBe('UNRESOLVED');
  expect(x.suggestedFreshQuestions).toBe(0);
 });
});
