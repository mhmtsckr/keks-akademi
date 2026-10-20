import {describe,it,expect} from 'vitest';
import {getParagrafDetailedSolution} from './paragrafDetailedSolutions';
import {buildOpticalWrongLearningPlan,opticalAttemptLegacyId,toPrintedReviewQuestion,opticalPrintedQuestionId} from './paragrafWrongLearning';

describe('KEKS Paragraf: 1500 basılı sorudan yanlıştan öğrenme',()=>{
 it('generates a verifiable, unique book reference for each of the 1500 questions',()=>{
  const seen=new Set<string>();
  for(let serial=1;serial<=1500;serial++){
   const q=getParagrafDetailedSolution(String(serial).padStart(5,'0'))!;
   const id=opticalPrintedQuestionId(q);
   expect(id).toBe('KEKS_PRINT_A3_V1_Q'+q.id);
   const row=toPrintedReviewQuestion(q);
   expect(row.id).toBe(id);
   expect(row.topic).toBe(q.topic);
   expect(row.correctAnswer).toBe(q.answer);
   expect(row.prompt).toContain(q.question.passage);
   expect(row.options.A).toBe(q.question.choices.A);
   expect(Object.keys(row.options).sort()).toEqual(['A','B','C','D','E']);
   expect(row.active).toBe(false);
   seen.add(id);
  }
  expect(seen.size).toBe(1500);
 });
 it('distinguishes wrong option evidence from a self-reported root cause',()=>{
  const first=getParagrafDetailedSolution('00001')!;
  const key=Array.from({length:30},(_,i)=>getParagrafDetailedSolution(String(i+1).padStart(5,'0'))!.answer).join('');
  const alt=first.answer==='A'?'B':'A';
  const marked=alt+'X'+key.slice(2);
  const p=buildOpticalWrongLearningPlan(1,marked,{'1':'SORU_KOKU','2':'DIKKAT'});
  expect(p?.summary).toMatchObject({correct:28,wrong:1,blank:1,net:27.75,reviewCount:2});
  expect(p?.missed.map(q=>q.number)).toEqual([1,2]);
  expect(p?.missed[0].reason).toBe('SORU_KOKU');
  expect(p?.missed[0].reasonSource).toBe('STUDENT_SELF_REPORT');
  expect(p?.missed[0].misconception).toContain(first.question.choices[alt]);
  expect(p?.missed[0].rightEvidence).toContain(first.question.choices[first.answer as keyof typeof first.question.choices]);
  expect(p?.missed[1].status).toBe('BOŞ');
  expect(p?.missed[1].misconception).toBeNull();
  expect(p?.priorities.length).toBeGreaterThan(0);
  expect(p?.reviewDays).toEqual([0,1,3,7,14,28]);
 });
 it('does not invent mental diagnosis or import correct questions',()=>{
  const key=Array.from({length:30},(_,i)=>getParagrafDetailedSolution(String(i+1).padStart(5,'0'))!.answer).join('');
  const p=buildOpticalWrongLearningPlan(1,key)!;
  expect(p.missed).toHaveLength(0);
  expect(p.priorities).toHaveLength(0);
  expect(buildOpticalWrongLearningPlan(1,'Z'.repeat(30))).toBeNull();
  const bad=buildOpticalWrongLearningPlan(1,'B'+'X'.repeat(29),{'1':'IMAGINED_REASON'})!;
  expect(bad.missed[0].reason).toBeNull();
  expect(bad.missed[0].reasonSource).toBe('UNCLASSIFIED');
 });
 it('ensures attempt key is per student and test, not dependent on changing answer choices',()=>{
  expect(opticalAttemptLegacyId('studentA',1)).toBe('PARAGRAF_OPTIK_FIRST:studentA:01');
  expect(opticalAttemptLegacyId('studentB',1)).not.toBe(opticalAttemptLegacyId('studentA',1));
  expect(opticalAttemptLegacyId('studentA',2)).not.toBe(opticalAttemptLegacyId('studentA',1));
 });
});
