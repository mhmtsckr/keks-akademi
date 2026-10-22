import {describe,expect,it} from 'vitest';
import {BLANK_CAUSES,buildParagrafRemediation,canonicalParagrafSkill,isBlankCause} from './paragrafRemediationEngine';
import {buildOpticalWrongLearningPlan} from './paragrafWrongLearning';
import {getParagrafDetailedSolution} from './paragrafDetailedSolutions';

describe('KEKS Paragraf: yanlış ve boştan beceri temelli öğrenme',()=>{
 it.each([
  ['Cümle Tamamlama','Cümle tamamlama','öncesi'],
  ['Paragrafı İkiye Bölme','Paragrafı ikiye bölme','sınır'],
  ['Karışık Cümlelerden Paragraf Oluşturma','Cümle sıralama','giriş'],
  ['Cümle Sıralama','Cümle sıralama','giriş'],
  ['Akışı Bozan Cümle','Akışı bozan cümle','zinciri'],
  ['Ana Düşünce','Ana düşünce','savını'],
  ['Ulaşılamaz Yargı','Ulaşılamaz yargı','olumsuzluğunu']
 ])('teaches %s with accurate strategy', (topic,skill,keyword)=>{
  expect(canonicalParagrafSkill(topic)).toBe(skill);
  const p=buildParagrafRemediation({topic,status:'YANLIŞ'});
  expect(p.skill).toBe(skill);
  expect(p.lessonSteps.join(' ')).toContain(keyword);
  expect(p.repeatDays).toEqual([0,1,3,7,14,28]);
  expect(p.note).toContain('hâkimiyeti');
 });
 it('treats blank reasons separately and never assumes a wrong option for a blank',()=>{
  for(const cause of Object.keys(BLANK_CAUSES)){
   expect(isBlankCause(cause)).toBe(true);
   const p=buildParagrafRemediation({topic:'Cümle tamamlama',status:'BOŞ',blankCause:cause});
   expect(p.blankCause).toBe(cause);
   expect(p.errorEvidence).toBeNull();
   expect(p.lessonSteps).toHaveLength(4);
  }
  expect(isBlankCause('YANLIS_TANI')).toBe(false);
  const unclassified=buildParagrafRemediation({topic:'İkiye Bölme',status:'BOŞ',blankCause:'UNKNOWN'});
  expect(unclassified.blankCause).toBeNull();
  expect(unclassified.lessonSteps[0]).toContain('tahmin etme');
 });
 it('shows student-selected distractor evidence without claiming it is a mental diagnosis',()=>{
  const q=getParagrafDetailedSolution('00001')!;
  const key=Array.from({length:30},(_,i)=>getParagrafDetailedSolution(String(i+1).padStart(5,'0'))!.answer).join('');
  const alternative=q.answer==='A'?'B':'A';
  const plan=buildOpticalWrongLearningPlan(1,alternative+'X'+key.slice(2),{'1':'SORU_KOKU'},{'2':'SURE_YETMEDI'})!;
  expect(plan.summary).toMatchObject({correct:28,wrong:1,blank:1});
  expect(plan.missed.map(x=>x.number)).toEqual([1,2]);
  expect(plan.missed[0].remediation.skill).toBe('Ana düşünce');
  expect(plan.missed[0].remediation.errorEvidence).toContain(q.question.choices[alternative]);
  expect(plan.missed[1].remediation.blankCause).toBe('SURE_YETMEDI');
  expect(plan.missed[1].remediation.errorEvidence).toBeNull();
  expect(plan.missed[1].firstAction).toContain('Süre sınırı olmadan');
  expect(plan.missed[1].solutionUrl).toContain('00002');
  expect(plan.missed.every(x=>x.remediation.transferTask.includes('daha önce görmediğin'))).toBe(true);
 });
 it('does not invent unavailable question categories in the original 1500 print bank',()=>{
  const skills=new Set<string>();
  let count=0;
  for(let n=1;n<=1500;n++){
   const q=getParagrafDetailedSolution(String(n).padStart(5,'0'))!;
   const p=buildParagrafRemediation({topic:q.topic,status:'BOŞ'});
   expect(p.lessonSteps).toHaveLength(4);
   expect(p.selfCheck.length).toBeGreaterThan(35);
   expect(p.repeatDays).toEqual([0,1,3,7,14,28]);
   skills.add(q.topic);
   count++;
  }
  expect(count).toBe(1500);
  expect(skills.size).toBeGreaterThanOrEqual(5);
  // Supports future question types, but does not claim they exist in this edition.
  expect(canonicalParagrafSkill('Cümle tamamlama')).toBe('Cümle tamamlama');
 });
});
