import {describe,expect,it} from 'vitest';
import {EDUCATION_LEVELS} from '@/lib/educationLevels';
import {evaluateWrongBlankAnswers,getRecoveryLevel,recoveryNextStep} from './levelAwareWrongBlank';

const questions=[
 {id:'a',subject:'Matematik',topic:'Kesirler',examType:'OKUL',sourceKind:'ORIGINAL',
  correctAnswer:'B',explanation:'Kesir karşılaştırma',reviewStatus:'APPROVED'},
 {id:'b',subject:'Türkçe',topic:'Paragraf',examType:'OKUL',sourceKind:'ORIGINAL',
  correctAnswer:'A',explanation:null,reviewStatus:'APPROVED'},
 {id:'c',subject:'Fen Bilimleri',topic:'Madde',examType:'OKUL',sourceKind:'ORIGINAL',
  correctAnswer:'C',explanation:'Kavram ayrımı',reviewStatus:'APPROVED'}
];
describe('bütün eğitim düzeylerinde yanlış ve boştan öğrenme',()=>{
 it('boşları yanlış işaretlenmiş cevaplardan ayırır ve ikisini de tekrar kuyruğuna alır',()=>{
  const result=evaluateWrongBlankAnswers(questions,{a:'A',b:' ',c:'C'},{b:'SURE'});
  expect(result).toMatchObject({correct:1,wrong:1,blank:1,queueIds:['a','b']});
  expect(result.details[0]).toMatchObject({status:'WRONG',blankReason:null});
  expect(result.details[1]).toMatchObject({status:'BLANK',blankReason:'SURE'});
  expect(result.details[2]).toMatchObject({status:'CORRECT',blankReason:null});
 });
 it('soruda işaret olmadığı durumlarda nedeni otomatik teşhis etmez',()=>{
  const result=evaluateWrongBlankAnswers(questions,{},{});expect(result).toMatchObject({correct:0,wrong:0,blank:3});
  expect(result.details.every(x=>x.blankReason===null)).toBe(true);
 });
 it('başka soruların IDlerini ve çift soru listesini kabul etmez',()=>{
  expect(()=>evaluateWrongBlankAnswers(questions,{outside:'C'})).toThrow('UNEXPECTED_QUESTION_ID');
  expect(()=>evaluateWrongBlankAnswers(questions,{},{outside:'SURE'})).toThrow('UNEXPECTED_QUESTION_ID');
  expect(()=>evaluateWrongBlankAnswers([...questions,questions[0]],{})).toThrow('INVALID_QUIZ_QUESTION_SET');
 });
 it('öğrencinin yüklediği çözümü onaylı içerik gibi göstermez',()=>{
  const q={...questions[0],id:'private',sourceKind:'STUDENT_WRONG:student1',
   correctAnswer:'1/2',explanation:'Öğrencinin açıklaması'};
  const result=evaluateWrongBlankAnswers([q],{private:'0.5'});
  expect(result.details[0].status).toBe('CORRECT');
  expect(result.details[0].explanationSource).toBe('USER_PROVIDED_UNVERIFIED');
 });
 const cases=[
  ['PRIMARY_123','PRIMARY'],['PRIMARY_4','PRIMARY'],
  ['MIDDLE_56','MIDDLE'],['MIDDLE_7','MIDDLE'],['MIDDLE_8','MIDDLE'],
  ['HIGH_910','HIGH'],['HIGH_11','HIGH'],['HIGH_12','HIGH'],
  ['GRADUATE_YKS','EXAM']
 ] as const;
 it.each(cases)('%s eğitim grubunda %s düzeyine uygun yönerge verir',(key,stage)=>{
  const gradeLevel=EDUCATION_LEVELS[key];
  const exam=stage==='EXAM'?'TYT':'OKUL';
  const level=getRecoveryLevel(gradeLevel,exam);
  expect(level.stage).toBe(stage);
  const next=recoveryNextStep({gradeLevel,subject:'Matematik',
   topic:'Problemler',examType:exam,outcome:'BLANK',blankReason:'SURE'});
  expect(next.opening).toContain('süre tutmadan');
  expect(next.levelStep.length).toBeGreaterThan(40);
  expect(next.reviewDays).toEqual([0,1,3,7,14,28]);
  expect(next.evidenceStatus).toBe('SERVER_GRADED_ANSWER_NOT_VERIFIED_MASTERY');
 });
 it('belirsiz eğitim düzeyinde resmî kazanımı doğrulanmış saymaz',()=>{
  const v=recoveryNextStep({gradeLevel:null,subject:'Türkçe',topic:'Cümle sıralama',
   examType:'OKUL',outcome:'WRONG'});
  expect(v.level.stage).toBe('UNRESOLVED');
  expect(v.level.needsGradeConfirmation).toBe(true);
  expect(v.levelStep).toContain('Eğitim düzeyini doğrula');
 });
});
