import {describe,it,expect} from 'vitest';
import {summarizeAllLevelQuizCoachEvidence} from './allLevelQuizCoachEvidence';
import {EDUCATION_LEVELS} from '@/lib/educationLevels';
import {QUIZ_RECOVERY_EVIDENCE_TYPE} from './blankReasonEvidence';
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
 it('links a reported blank reason only to a verified first quiz, with age-adapted coach guidance',()=>{
  const row=trial('original','quiz-reason',['q1','q2'],{q1:'A',q2:''},
   {correct:0,wrong:1,blank:1});
  const correctLog={date:at,payload:{
   type:QUIZ_RECOVERY_EVIDENCE_TYPE,version:3,
   quizId:'quiz-reason',attemptId:'original',outcomeSource:'SERVER_ANSWER_KEY',
   verifiedMastery:false,correct:0,wrong:1,blank:1,
   outcomes:[
    {questionId:'q1',outcome:'WRONG',blankReason:null},
    {questionId:'q2',outcome:'BLANK',blankReason:'SURE'}
   ]
  }};
  for(const gradeLevel of Object.values(EDUCATION_LEVELS)){
   const v=summarizeAllLevelQuizCoachEvidence([row],questions,'me',{
    reasonLogs:[correctLog],gradeLevel
   });
   expect(v).toMatchObject({tests:1,wrong:1,blank:1,reasonVerifiedAttempts:1,
    verifiedMastery:false});
   expect(v.topics[0].reasonCoverage).toBe(1);
   expect(v.topics[0].primaryBlankReason).toBe('Sürem yetmedi');
   expect(v.topics[0].reasonSource).toBe('STUDENT_SELF_REPORT_NOT_DIAGNOSIS');
   expect(v.topics[0].maxSessionMinutes).toBeGreaterThan(0);
   expect(v.topics[0].action).toContain('süresiz');
  }
 });
 it('does not promote a forged reason or a result for another quiz',()=>{
  const a=trial('first','quiz-1',['q1','q2'],{q1:'A',q2:''},
   {correct:0,wrong:1,blank:1});
  const invalid={date:at,payload:{
   type:QUIZ_RECOVERY_EVIDENCE_TYPE,version:3,
   quizId:'another-quiz',attemptId:'first',outcomeSource:'SERVER_ANSWER_KEY',
   verifiedMastery:false,correct:0,wrong:1,blank:1,
   outcomes:[{questionId:'q1',outcome:'WRONG',blankReason:null},
    {questionId:'q2',outcome:'BLANK',blankReason:'BILGI_EKSIKLIGI'}]
  }};
  const v=summarizeAllLevelQuizCoachEvidence([a],questions,'me',{
   reasonLogs:[invalid],gradeLevel:EDUCATION_LEVELS.MIDDLE_7
  });
  expect(v).toMatchObject({tests:1,wrong:1,blank:1,reasonVerifiedAttempts:0});
  expect(v.topics[0].reasonCoverage).toBe(0);
  expect(v.topics[0].primaryBlankReason).toBeNull();
  expect(v.topics[0].action).toContain('Önce neden boş bırakıldığını');
 });
 it('uses no fabricated study load without a known level or exam context',()=>{
  const a=trial('first','quiz-1',['q1'],{q1:'A'},
    {correct:0,wrong:1,blank:0});
  const v=summarizeAllLevelQuizCoachEvidence([a],questions,'me');
  expect(v.topics[0]).toMatchObject({band:'UNRESOLVED',
   maxSessionMinutes:0,suggestedFreshQuestions:0});
  expect(v.topics[0].action).toContain('Eğitim düzeyini');
 });

});
