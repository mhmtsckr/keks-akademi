import {describe,it,expect,vi} from 'vitest';
import {getParagrafDetailedSolution} from './paragrafDetailedSolutions';
import {buildOpticalWrongLearningPlan} from './paragrafWrongLearning';
import {paragrafReadingGuide,opticalRecoveryPriority,opticalReasonAction} from './paragrafLearningPlaybook';
import {gradeOptical} from './paragrafOptik';

describe('KEKS Paragraf guided wrong/blank learning v2',()=>{
 it('differentiates wrong, blank by reason, and urgency without asserting psychological diagnoses',()=>{
  expect(opticalRecoveryPriority({wrong:1,blank:1})).toBe(5);
  expect(opticalRecoveryPriority({wrong:0,blank:1,reasons:['SURE']})).toBe(1);
  expect(opticalRecoveryPriority({wrong:0,blank:1,reasons:['BILGI_EKSIKLIGI']})).toBe(2);
  expect(opticalReasonAction('SURE',true)).toContain('süre sınırı olmadan');
  expect(opticalReasonAction('KARARSIZLIK',true)).toContain('iki şıkkı');
  expect(opticalReasonAction(null,true)).toContain('kesin bilinmiyor');
 });
 it('supplies targeted steps for old and planned new paragraph types, without inventing questions',()=>{
  for(const skill of ['Ana düşünce','Örtük anlam','Ulaşılamaz yargı','Çıkarım','Cümle Tamamlama','Paragrafı İkiye Bölme','Cümle Sıralama','Cümle Oluşturma']){
   const guide=paragrafReadingGuide(skill);
   expect(guide.skill).toBe(skill);
   expect(guide.focus.length).toBeGreaterThan(50);
   expect(guide.hints).toHaveLength(3);
   expect(guide.hints.every(s=>s.length>=20)).toBe(true);
   expect(guide.selfCheck.endsWith('?')).toBe(true);
  }
  expect(paragrafReadingGuide('Cümle Tamamlama').hints.join(' ')).toContain('bağlaç');
  expect(paragrafReadingGuide('Paragrafı İkiye Bölme').hints.join(' ')).toContain('Konu');
 });
 it('builds question-grounded, independent-retry prompts for each 1,500 printed question',()=>{
  vi.stubEnv('KEKS_PARAGRAF_QR_SECRET','test-only-paragraf-hmac-qr-secret-of-at-least-32-characters');
  for(let test=1;test<=50;test++){
   const questions=Array.from({length:30},(_,i)=>getParagrafDetailedSolution(String((test-1)*30+i+1).padStart(5,'0'))!);
   const key=questions.map(q=>q.answer).join('');
   const wrong=questions[0].answer==='A'?'B':'A';
   const attempt=wrong+'X'+key.slice(2);
   const plan=buildOpticalWrongLearningPlan(test,attempt,{'1':'KARARSIZLIK','2':'SURE'})!;
   expect(plan.summary).toMatchObject({correct:28,wrong:1,blank:1,reviewCount:2});
   expect(plan.missed).toHaveLength(2);
   expect(plan.missed[0].questionStem).toBe(questions[0].question.stem);
   expect(plan.missed[0].passage).toBe(questions[0].question.passage);
   expect(plan.missed[0].choices).toEqual(questions[0].question.choices);
   expect(plan.missed[0].readingGuide.skill).toBe(questions[0].topic);
   expect(plan.missed[0].firstAction).toContain('iki şıkkı');
   expect(plan.missed[0].rightEvidence).toBeTruthy();
   expect(plan.missed[1].status).toBe('BOŞ');
   expect(plan.missed[1].misconception).toBeNull();
   expect(plan.missed[1].firstAction).toContain('süre sınırı olmadan');
   expect(plan.priorities.reduce((sum,t)=>sum+t.questionNos.length,0)).toBe(2);
   expect(plan.reviewDays).toEqual([0,1,3,7,14,28]);
   const graded=gradeOptical(test,attempt)!;
   expect(graded.details[0].solutionUrl).toContain(questions[0].id);
   expect(graded.details[1].solutionUrl).toContain(questions[1].id);
  }
  vi.unstubAllEnvs();
 });
});
