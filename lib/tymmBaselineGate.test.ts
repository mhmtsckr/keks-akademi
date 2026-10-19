import {describe,it,expect} from 'vitest';
import {BASELINE_MAX_SUBMISSIONS_IN_SEVEN_DAYS,baselineSubmissionDecision,baselineSubmissionMessage} from './tymmBaselineGate';

describe('TYMM öğrenci performans görevi teslim bütünlüğü',()=>{
 it('ilk gönderimi ve koç geri bildirimi sonrası haftalık uygun tekrarları kabul eder',()=>{
  expect(BASELINE_MAX_SUBMISSIONS_IN_SEVEN_DAYS).toBe(3);
  expect(baselineSubmissionDecision(0,false)).toBe('ALLOW');
  expect(baselineSubmissionDecision(1,false)).toBe('ALLOW');
  expect(baselineSubmissionDecision(2,false)).toBe('ALLOW');
 });
 it('herhangi bir bekleyen insan incelemesi varken yeni teslimi engeller',()=>{
  expect(baselineSubmissionDecision(0,true)).toBe('WAITING_FOR_COACH');
  expect(baselineSubmissionDecision(1,true)).toBe('WAITING_FOR_COACH');
  expect(baselineSubmissionDecision(2,true)).toBe('WAITING_FOR_COACH');
  expect(baselineSubmissionMessage('WAITING_FOR_COACH')).toContain('koç');
 });
 it('üç veya üzeri teslimde, geçmiş son 80 kayıtla sınırlı olmayan haftalık sayımı korur',()=>{
  for(const count of [3,4,79,80,81,1000]){
   expect(baselineSubmissionDecision(count,false)).toBe('WEEKLY_LIMIT');
  }
  expect(baselineSubmissionMessage('WEEKLY_LIMIT')).toContain('üç teslim');
 });
 it('geçersiz veya kesirli veritabanı sayımını reddeder',()=>{
  for(const count of [-1,0.5,NaN,Infinity]){
   expect(()=>baselineSubmissionDecision(count,false)).toThrow('Invalid count');
  }
 });
});