import {describe,it,expect} from 'vitest';
import {summarizeAllLevelQuizCoachEvidence} from './allLevelQuizCoachEvidence';
const at=new Date('2026-10-28T12:00:00.000Z');
const questions=[
 {id:'q1',subject:'Matematik',topic:'Problemler',sourceKind:'ORIGINAL',correctAnswer:'B'},
 {id:'q2',subject:'Matematik',topic:'Problemler',sourceKind:'STUDENT_WRONG:me',correctAnswer:'1/2'},
 {id:'q3',subject:'Tarih',topic:'Kronoloji',sourceKind:'ORIGINAL',correctAnswer:'C'},
 {id:'foreign',subject:'Türkçe',topic:'Paragraf',sourceKind:'STUDENT_WRONG:peer',correctAnswer:'B'}
];
function trial(id:string,quizId:string,questionIds:string[],answers:Record<string,string>,grade:{
 correct:number;wrong:number;blank:number
}){
 return {id,quizId,createdAt:at,answers,quiz:{questionIds},...grade};
}
describe('regraded all-level coach evidence (not student self-reports)',()=>{
 it('recomputes original wrong and blanks, separates subjects, marks private keys unverified',()=>{
  const rows=[
   trial('one','test1',['q1','q2'],{q1:'A',q2:''},{correct:0,wrong:1,blank:1}),
   trial('two','test2',['q3'],{q3:'C'},{correct:1,wrong:0,blank:0})
  ];
  const r=summarizeAllLevelQuizCoachEvidence(rows,questions,'me');
  expect(r).toMatchObject({tests:2,correct:1,wrong:1,blank:1,excluded:0,
   evidenceType:'RE_GRADED_DATABASE_QUIZ_ATTEMPTS',verifiedMastery:false});
  expect(r.topics).toHaveLength(1);
  expect(r.topics[0]).toMatchObject({subject:'Matematik',topic:'Problemler',
   wrong:1,blank:1,correct:0,needsHumanKeyReview:true});
 });
 it('excludes foreign private questions, forged grades and unknown response IDs',()=>{
  const rows=[
   trial('foreign-attempt','test1',['foreign'],{foreign:'A'},{correct:0,wrong:1,blank:0}),
   trial('forged','test2',['q1'],{q1:'B'},{correct:0,wrong:1,blank:0}),
   trial('unexpected','test3',['q1'],{another:'A'},{correct:0,wrong:0,blank:1})
  ];
  const r=summarizeAllLevelQuizCoachEvidence(rows,questions,'me');
  expect(r).toMatchObject({tests:0,wrong:0,blank:0,excluded:3});
 });
 it('counts only one original submission per quiz and ignores repeat of same quiz',()=>{
  const a=trial('one','same',['q1'],{q1:'A'},{correct:0,wrong:1,blank:0});
  const b=trial('two','same',['q1'],{q1:'A'},{correct:0,wrong:1,blank:0});
  const r=summarizeAllLevelQuizCoachEvidence([a,b],questions,'me',{truncated:true});
  expect(r.tests).toBe(1);
  expect(r.wrong).toBe(1);
  expect(r.truncated).toBe(true);
  expect(r.verifiedMastery).toBe(false);
 });
});
