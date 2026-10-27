import {describe,expect,it} from 'vitest';
import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {chooseFreshSubjectPractice,eligibleSubjectPracticeQuestion} from './subjectIndependentPractice';

const source={id:'src-q',examType:'TYT',subject:'Matematik',topic:'Problemler'};
const candidate=(id:string,extra:Record<string,unknown>={})=>({
 id,examType:'TYT',subject:'Matematik',topic:'Problemler',
 prompt:'Özgün ve onaylı soru',options:{},correctAnswer:'C',
 active:true,reviewStatus:'APPROVED',sourceKind:'ORIGINAL',...extra
});
const osym=resolveLearningCurriculumContext({gradeLevel:'Mezun | YKS',examType:'TYT'});
const school=resolveLearningCurriculumContext({gradeLevel:'Ortaokul 7 | Maarif Model',selectedGrade:7});
describe('cross-subject unseen approved independent practice',()=>{
 it('allows approved TYT questions for graduate TYT learners without inventing school grade metadata',()=>{
  expect(osym.framework).toBe('OSYM');
  expect(chooseFreshSubjectPractice(source,[candidate('a'),candidate('b')],
   new Set(['a']),osym)).toMatchObject([{id:'b'}]);
 });
 it('lets actual 12th-grade YKS learners use exam-matched approved TYT questions',()=>{
  const exam12=resolveLearningCurriculumContext({gradeLevel:'Lise 12 | YKS',examType:'TYT'});
  expect(exam12.grade).toBe(12);
  expect(chooseFreshSubjectPractice(source,[candidate('tyt-approved')],new Set(),exam12)
   .map(x=>x.id)).toEqual(['tyt-approved']);
  const ags12=resolveLearningCurriculumContext({gradeLevel:'Lise 12 | YKS',examType:'AGS'});
  const unrelated={...source,examType:'AGS'};
  expect(chooseFreshSubjectPractice(unrelated,[candidate('ags',{examType:'AGS'})],
   new Set(),ags12)).toEqual([]);
 });
 it('never accepts wrong-exam, private, inactive or pending questions',()=>{
  const pool=[
   candidate('a',{examType:'AYT'}),candidate('b',{active:false}),
   candidate('c',{sourceKind:'STUDENT_WRONG:other'}),
   candidate('d',{reviewStatus:'PENDING'}),candidate('safe')
  ];
  expect(chooseFreshSubjectPractice(source,pool,new Set(),osym).map(x=>x.id)).toEqual(['safe']);
 });
 it('requires explicit matching school grade, not a matching topic name alone',()=>{
  const src={id:'math-src',examType:'OKUL',subject:'Matematik',topic:'Tam Sayılar'};
  const make=(id:string,options:Record<string,unknown>)=>candidate(id,{
   examType:'OKUL',subject:src.subject,topic:src.topic,options
  });
  const pool=[
   make('without-grade',{}),
   make('wrong-grade',{educationGrade:8,curriculumFramework:'MEB_LEGACY'}),
   make('right-grade',{educationGrade:7,curriculumFramework:'TYMM'}),
   make('target-grade',{targetGrades:[7,8],curriculumFramework:'TYMM'}),
   make('wrong-framework',{educationGrade:7,curriculumFramework:'MEB_LEGACY'})
  ];
  expect(school.framework).toBe('TYMM');
  expect(chooseFreshSubjectPractice(src,pool,new Set(),school).map(x=>x.id))
   .toEqual(['right-grade','target-grade']);
 });
 it('does not reuse prior questions and never leaks into an unverified grade or exam',()=>{
  const unresolved=resolveLearningCurriculumContext({gradeLevel:'Ortaokul 5-6 | Maarif Model'});
  expect(unresolved.framework).toBe('UNRESOLVED');
  expect(chooseFreshSubjectPractice(source,[candidate('a')],new Set(),unresolved)).toEqual([]);
  expect(chooseFreshSubjectPractice(source,[candidate('a')],new Set(['a']),osym)).toEqual([]);
 });
 it('requires a usable answer key and rejects school-only metadata in graduate exams',()=>{
  expect(eligibleSubjectPracticeQuestion(candidate('a',{correctAnswer:' '}),source,osym)).toBe(false);
  expect(eligibleSubjectPracticeQuestion(candidate('b',{options:{educationGrade:12}}),source,osym)).toBe(false);
  expect(eligibleSubjectPracticeQuestion(candidate('c',{options:{targetExams:['AYT']}}),source,osym)).toBe(false);
  expect(eligibleSubjectPracticeQuestion(candidate('d',{options:{targetExams:['TYT']}}),source,osym)).toBe(true);
 });
 it('works for subject-specific science / literature / history school skills without subject substitutions',()=>{
  for(const subject of ['Fizik','Türk Dili ve Edebiyatı','Tarih','Coğrafya','Biyoloji']){
   const src={id:subject+'-src',examType:'OKUL',subject,topic:'Beceri'};
   const q=candidate(subject+'-q',{examType:'OKUL',subject,topic:'Beceri',options:{educationGrade:7}});
   expect(chooseFreshSubjectPractice(src,[q,candidate('other')],new Set(),school)).toMatchObject([{id:subject+'-q'}]);
  }
 });
});
