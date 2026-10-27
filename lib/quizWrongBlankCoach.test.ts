import {describe,expect,it} from 'vitest';
import {summarizeQuizWrongBlankEvidence} from './quizWrongBlankCoach';

const at=new Date('2026-10-26T11:00:00Z');
const now=new Date('2026-10-27T12:00:00Z');
const row=(payload:unknown,date=at)=>({date,payload});
function attempt(id:string,perQuestion:{questionId:string;result:string;subject:string;topic:string}[]){
 const correct=perQuestion.filter(x=>x.result==='CORRECT').length;
 const wrong=perQuestion.filter(x=>x.result==='WRONG').length;
 const blank=perQuestion.filter(x=>x.result==='BLANK').length;
 return row({
  type:'QUIZ_WRONG_BLANK_V2',attemptId:id,evidence:'ANSWER_KEY_VERIFIED',
  independentMasteryVerified:false,correct,wrong,blank,total:perQuestion.length,perQuestion
 });
}
const q=(id:string,result:'CORRECT'|'WRONG'|'BLANK',subject='Matematik',topic='Problemler')=>
 ({questionId:id,result,subject,topic});
describe('cross-level coach feedback for wrong and blank',()=>{
 it('preserves original wrong/blank distinction per subject and suggests corresponding actions',()=>{
  const result=summarizeQuizWrongBlankEvidence([
   attempt('a',[q('1','BLANK'),q('2','BLANK'),q('3','WRONG'),q('4','CORRECT')]),
   attempt('b',[q('5','WRONG','Tarih','Osmanlı Tarihi')])
  ],now);
  expect(result).toMatchObject({
   tests:2,correct:1,wrong:2,blank:2,masteryVerified:false,transferVerified:false
  });
  const math=result.topics.find(x=>x.subject==='Matematik')!;
  expect(math).toMatchObject({blank:2,wrong:1,priority:'BLANK_DIAGNOSTIC'});
  expect(math.action).toContain('neden cevap veremediğini');
  const history=result.topics.find(x=>x.subject==='Tarih')!;
  expect(history).toMatchObject({blank:0,wrong:1,priority:'ERROR_ANALYSIS'});
 });
 it('ignores duplicate attempts and impossible/mislabelled or self-reported evidence',()=>{
  const valid=attempt('a',[q('1','BLANK')]);
  const fake=row({...valid.payload,attemptId:'b',wrong:1,blank:0});
  const repeated=attempt('a',[q('2','WRONG')]);
  const userNote=row({...valid.payload,attemptId:'c',evidence:'STUDENT_SELF_REPORT'});
  const result=summarizeQuizWrongBlankEvidence([valid,fake,repeated,userNote],now);
  expect(result.tests).toBe(1);
  expect(result.blank).toBe(1);
  expect(result.wrong).toBe(0);
 });
 it('refuses unverified mastery and does not count future events or duplicate item IDs',()=>{
  const future=attempt('future',[q('9','WRONG')]);
  const dup=attempt('duplicate',[q('x','WRONG'),q('x','BLANK')]);
  const result=summarizeQuizWrongBlankEvidence([
   {...future,date:new Date('2026-12-01')},dup
  ],now);
  expect(result.tests).toBe(0);
  expect(result.topics).toHaveLength(0);
  expect(result.masteryVerified).toBe(false);
 });
});
