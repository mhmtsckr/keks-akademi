import {describe,expect,it} from 'vitest';
import {answerIsBlank,gradePersonalQuiz,reasonForPersonalReview} from './quizErrorLearning';

const publicQuestion={id:'q-public',correctAnswer:'B',sourceKind:'ORIGINAL'};
const privateQuestion={id:'q-private',correctAnswer:'12',sourceKind:'STUDENT_WRONG:stu-1'};
const q3={id:'q3',correctAnswer:'C',sourceKind:'ORIGINAL'};

describe('source-aware blank and wrong question learning',()=>{
 it('counts undefined, null and whitespace as blanks, never as incorrect answers',()=>{
  expect(answerIsBlank(null)).toBe(true);
  expect(answerIsBlank(undefined)).toBe(true);
  expect(answerIsBlank('  ')).toBe(true);
  const grade=gradePersonalQuiz([publicQuestion,privateQuestion,q3],{
   'q-public':'  ', 'q-private':null,'q3':'B'
  });
  expect(grade).toMatchObject({correct:0,wrong:1,blank:2,
   wrongIds:['q3'],blankIds:['q-public','q-private']});
  expect(grade.answers).toMatchObject({'q-public':'','q-private':'','q3':'B'});
 });
 it('uses answer equivalence for personal handwritten answers and exact choices for public questions',()=>{
  const grade=gradePersonalQuiz([publicQuestion,privateQuestion],{
   'q-public':'B','q-private':'12.0'
  });
  expect(grade.correct).toBe(2);
  expect(grade.blank).toBe(0);
 });
 it("derives blank from the student's original source attempt, without altering question metadata",()=>{
  expect(reasonForPersonalReview({questionId:'q-public',options:{},sourceKind:'ORIGINAL',
   sourceAttempt:{answers:{'q-public':''}}})).toBe('BLANK');
  expect(reasonForPersonalReview({questionId:'q-public',options:{},sourceKind:'ORIGINAL',
   sourceAttempt:{answers:{'q-public':'A'}}})).toBe('WRONG');
  expect(reasonForPersonalReview({questionId:'q-public',options:{},sourceKind:'ORIGINAL',
   sourceAttempt:null})).toBe('WRONG');
 });
 it('honors original uploaded blank/marked reasons separately from test attempts',()=>{
  expect(reasonForPersonalReview({questionId:'p1',sourceKind:'STUDENT_WRONG:stu-1',
   options:{bankReason:'BLANK'}})).toBe('BLANK');
  expect(reasonForPersonalReview({questionId:'p2',sourceKind:'STUDENT_WRONG:stu-1',
   options:{bankReason:'MARKED'}})).toBe('MARKED');
 });
});
