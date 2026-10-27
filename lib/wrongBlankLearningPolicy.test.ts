import {describe,expect,it} from 'vitest';
import {learnerRecoveryPolicy,recoveryReasonFromAnswers,RECOVERY_REVIEW_DAYS} from './wrongBlankLearningPolicy';

const LEVELS=[
 ['İlkokul 1-2-3 | Maarif Model','PRIMARY_123','GUIDED',1,4],
 ['İlkokul 4 | Proje Ortaokuluna Hazırlık','PRIMARY_4','SCAFFOLDED',2,6],
 ['Ortaokul 5-6 | Maarif Model','MIDDLE_56','SCAFFOLDED',2,8],
 ['Ortaokul 7 | Maarif Model','MIDDLE_7','SCAFFOLDED',2,10],
 ['Ortaokul 8 | Maarif Model','MIDDLE_8','SCAFFOLDED',3,12],
 ['Lise 9-10 | Maarif Model','HIGH_910','INDEPENDENT',3,12],
 ['Lise 11 | Maarif Model','HIGH_11','INDEPENDENT',3,15],
 ['Lise 12 | YKS','HIGH_12','INDEPENDENT',4,20],
 ['Mezun | YKS','GRADUATE_YKS','INDEPENDENT',4,20]
] as const;

describe('all education levels wrong / blank learning guidance',()=>{
 it.each(LEVELS)('%s has age-appropriate tasks without automatic mastery',(gradeLevel,key,mode,daily)=>{
  const p=learnerRecoveryPolicy({gradeLevel,wrong:4,blank:5,examType:'OKUL'});
  expect(p.levelKey).toBe(key);
  expect(p.supportMode).toBe(mode);
  expect(p.dailyReviewTarget).toBe(daily);
  expect(p.wrongInstruction).not.toBe(p.blankInstruction);
  expect(p.masteryVerified).toBe(false);
  expect(p.nextEvidence).toContain(p.requiresGradeConfirmation
   ?'Sınıf/sınav grubu':'onaylı soru');
 });
 it('separates a blank from a wrong when importing exact submission',()=>{
  expect(recoveryReasonFromAnswers('a',{a:null})).toBe('BLANK');
  expect(recoveryReasonFromAnswers('a',{a:''})).toBe('BLANK');
  expect(recoveryReasonFromAnswers('a',{a:'  '})).toBe('BLANK');
  expect(recoveryReasonFromAnswers('a',{a:'C'})).toBe('WRONG');
  expect(recoveryReasonFromAnswers('a',{a:'C'},'BLANK')).toBe('BLANK');
  expect(recoveryReasonFromAnswers('a',null)).toBe('WRONG');
  expect(recoveryReasonFromAnswers('a',{a:'C'},'MARKED')).toBe('MARKED');
 });
 it('routes AGS / ÖABT / KPSS / ALES exam candidates to independent adult-style recovery',()=>{
  for(const examType of ['AGS','ÖABT','KPSS','ALES','DGS','YDS','YÖKDİL']){
   const p=learnerRecoveryPolicy({gradeLevel:'Sınav adayı',examType,wrong:4,blank:2});
   expect(p.framework).toBe('OSYM');
   expect(p.supportMode).toBe('INDEPENDENT');
   expect(p.dailyReviewTarget).toBe(4);
   expect(p.requiresGradeConfirmation).toBe(false);
   expect(p.masteryVerified).toBe(false);
  }
 });
 it('refuses to attribute a definite grade to a multi-grade learner',()=>{
  const p=learnerRecoveryPolicy({gradeLevel:'İlkokul 1-2-3 | Maarif Model',wrong:1,blank:3});
  expect(p.grade).toBeNull();
  expect(p.framework).toBe('UNRESOLVED');
  expect(p.requiresGradeConfirmation).toBe(true);
  expect(p.supportMode).toBe('GUIDED');
  expect(p.blankInstruction).toContain('yetişkin');
 });
 it('adjusts diagnostic for blank-heavy work without calling it a wrong answer',()=>{
  const p=learnerRecoveryPolicy({gradeLevel:'Lise 12 | YKS',examType:'TYT',wrong:1,blank:6});
  expect(p.blankInstruction).toContain('Boşlar yoğun');
  expect(p.grade).toBe(12);
  expect(p.newQuestionTarget).toBe(4);
 });
 it('never fabricates student grade or durable mastery',()=>{
  const p=learnerRecoveryPolicy({gradeLevel:'belirsiz',wrong:1});
  expect(p.requiresGradeConfirmation).toBe(true);
  expect(p.levelKey).toBeNull();
  expect(p.masteryVerified).toBe(false);
  expect(RECOVERY_REVIEW_DAYS).toEqual([0,1,3,7,14,28]);
 });
});
