import {describe,it,expect} from 'vitest';
import {getScreeningForm,readScreeningStage} from './screeningForms';

describe('native KEKS screening adaptation',()=>{
 it('keeps existing forms backward compatible for accounts without learning stage',()=>{
  const original=getScreeningForm('ORTAOKUL_7_8');
  expect(original.questions.length).toBeGreaterThan(0);
  expect(original.version).toBe('KEKS_PRO_SERIES_V1_BASELINE_ORTAOKUL_7_8');
 });
 it('adapts to education and developmental level without manufacturing new items',()=>{
  const original=getScreeningForm('LISE_11_12');
  const foundation=getScreeningForm('LISE_11_12','FOUNDATION');
  const developing=getScreeningForm('LISE_11_12','DEVELOPING');
  const independent=getScreeningForm('LISE_11_12','INDEPENDENT');
  expect(foundation.questions.length).toBeLessThanOrEqual(Math.min(original.questions.length,72));
  expect(developing.questions.length).toBeLessThanOrEqual(Math.min(original.questions.length,82));
  expect(independent.questions.length).toBeLessThanOrEqual(Math.min(original.questions.length,100));
  expect(new Set(foundation.questions.map(q=>q.id)).size).toBe(foundation.questions.length);
  expect(foundation.questions.every(q=>original.questions.some(x=>x.id===q.id))).toBe(true);
  expect(foundation.version).toContain('STAGE_FOUNDATION_Q');
  expect(independent.questions.length).toBeGreaterThanOrEqual(foundation.questions.length);
 });
 it('reads only the approved context stage from student profile',()=>{
  expect(readScreeningStage({nativeScreeningContext:{learningStage:'DEVELOPING'}})).toBe('DEVELOPING');
  expect(readScreeningStage({nativeScreeningContext:{learningStage:'UNSAFE'}})).toBeUndefined();
  expect(readScreeningStage(null)).toBeUndefined();
 });
});
