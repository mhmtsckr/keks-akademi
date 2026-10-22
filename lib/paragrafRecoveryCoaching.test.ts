import {describe,it,expect} from 'vitest';
import {getParagrafDetailedSolution} from './paragrafDetailedSolutions';
import {paragraphSkillStrategy,paragraphRecoveryCoaching,opticalRecoveryReason,normalizeOpticalSelfCheck} from './paragrafRecoveryCoaching';
import {buildOpticalWrongLearningPlan} from './paragrafWrongLearning';
describe('KEKS Paragraf: yanlış ve boştan öğrenme v2',()=>{
 it('uses distinct instructional first steps for completion, split, and ordering',()=>{
  const completion=paragraphSkillStrategy('Cümle Tamamlama');
  const split=paragraphSkillStrategy('Paragrafı İkiye Bölme');
  const ordering=paragraphSkillStrategy('Karışık Metinden Cümle Sıralama');
  expect(completion.practice).toContain('iki yönde');
  expect(split.practice).toContain('iki yanına');
  expect(ordering.practice).toContain('zinciri');
  expect(completion.skill).not.toBe(split.skill);
 });
 it('does not misdiagnose blanks or accept blank-only diagnoses for wrong answers',()=>{
  expect(opticalRecoveryReason('BOS_IKI_SIK','BOŞ')).toBe('BOS_IKI_SIK');
  expect(opticalRecoveryReason('BOS_IKI_SIK','YANLIŞ')).toBeNull();
  expect(opticalRecoveryReason('SURE','YANLIŞ')).toBe('SURE');
  expect(opticalRecoveryReason('FALSE_CONDITION','BOŞ')).toBeNull();
  expect(opticalRecoveryReason({},'BOŞ')).toBeNull();
  const q=getParagrafDetailedSolution('00002')!;
  const unknown=paragraphRecoveryCoaching(q,'BOŞ',null);
  expect(unknown.reasonInstruction).toContain('Henüz nedenini bilmiyorsan');
  const timed=paragraphRecoveryCoaching(q,'BOŞ','BOS_SURE');
  expect(timed.reasonInstruction).toContain('süre tutarak');
  expect(timed.firstProbe).toContain('geçici bir cevap');
 });
 it('validates bounded self-check evidence without treating right reattempt as mastery',()=>{
  expect(normalizeOpticalSelfCheck({answer:'B',evidence:'  Bir kanıt. '})).toEqual({answer:'B',evidence:'Bir kanıt.'});
  expect(normalizeOpticalSelfCheck({answer:'X'})).toBeNull();
  expect(normalizeOpticalSelfCheck({answer:'A',evidence:'x'.repeat(501)})).toBeNull();
  const key=Array.from({length:30},(_,i)=>getParagrafDetailedSolution(String(i+1).padStart(5,'0'))!.answer).join('');
  const alt=key[0]==='A'?'B':'A';
  const plan=buildOpticalWrongLearningPlan(1,alt+'X'+key.slice(2),
   {'1':'SORU_KOKU','2':'BOS_IKI_SIK'},
   {'1':{answer:key[0],evidence:'Paragraftaki sınırı buldum.'},'2':{answer:key[1]},'3':{answer:key[2]}})!;
  expect(plan.missed).toHaveLength(2);
  expect(plan.missed[0].selfCheck).toMatchObject({
   answer:key[0],attemptCorrect:true,masteryVerified:false,evidenceProvided:true
  });
  expect(plan.missed[1].reason).toBe('BOS_IKI_SIK');
  expect(plan.missed[1].coaching.blankFirst).toBe(true);
  expect(plan.missed.some(q=>q.number===3)).toBe(false);
 });
 it('covers every original question with a skill-specific safe strategy',()=>{
  for(let serial=1;serial<=1500;serial++){
   const q=getParagrafDetailedSolution(String(serial).padStart(5,'0'))!;
   const wrong=paragraphRecoveryCoaching(q,'YANLIŞ',null);
   const blank=paragraphRecoveryCoaching(q,'BOŞ',null);
   expect(wrong.skill.length).toBeGreaterThan(3);
   expect(wrong.diagnostic.length).toBeGreaterThan(20);
   expect(wrong.practice.length).toBeGreaterThan(20);
   expect(blank.firstProbe).toContain('çözümü');
   expect(blank.verify).toContain('farklı bir soruda');
  }
 });
});
