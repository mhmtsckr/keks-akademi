import {describe,it,expect} from 'vitest';
import {auditApprovedRecoveryCoverage} from './approvedRecoveryCoverage';
import {EDUCATION_LEVELS} from '@/lib/educationLevels';
const origin={id:'old',examType:'OKUL',subject:'Matematik',topic:'Kesirler'};
const q=(id:string,grade=7,patch:Record<string,unknown>={})=>({
 id,examType:'OKUL',subject:'Matematik',topic:'Kesirler',
 prompt:'Orijinal yeni matematik sorusu',active:true,reviewStatus:'APPROVED',
 sourceKind:'ORIGINAL',correctAnswer:'B',options:{
  educationGrade:grade,curriculumFramework:'TYMM',
 },...patch
});
const base=(gradeLevel:string|null,examType='OKUL')=>({
 gradeLevel,examType,subject:'Matematik',topic:'Kesirler',
 originQuestionId:origin.id,catalogTruncated:false
});
describe('honest approved remediation content coverage',()=>{
 it('counts only other approved curriculum-matched school questions',()=>{
  const v=auditApprovedRecoveryCoverage({
   ...base(EDUCATION_LEVELS.MIDDLE_7),
   candidates:[q('old'),q('new-good'),q('new-wrong-grade',8),q('private',7,{
    sourceKind:'STUDENT_WRONG:other',active:false,reviewStatus:'STUDENT_PRIVATE'
   })]
  });
  expect(v).toMatchObject({status:'MATCHING_APPROVED',matchingApproved:1});
  expect(v.note).toContain('Daha önce görülmemiş');
 });
 it('does not assert missing content for a multi-grade label or truncated pool',()=>{
  const unknown=auditApprovedRecoveryCoverage({
   ...base(EDUCATION_LEVELS.MIDDLE_56),candidates:[q('new-good')]
  });
  expect(unknown).toMatchObject({status:'NEEDS_GRADE_OR_EXAM',matchingApproved:0});
  const incomplete=auditApprovedRecoveryCoverage({
   ...base(EDUCATION_LEVELS.MIDDLE_7),catalogTruncated:true,candidates:[]
  });
  expect(incomplete.status).toBe('INCOMPLETE_CATALOG_SCAN');
 });
 it('reports genuinely empty eligible pool without inventing a new task',()=>{
  const v=auditApprovedRecoveryCoverage({
   ...base(EDUCATION_LEVELS.MIDDLE_7),candidates:[q('old'),q('wrong',8)]
  });
  expect(v).toMatchObject({status:'NO_MATCHING_APPROVED',matchingApproved:0});
  expect(v.note).toContain('sistem soru uydurmaz');
 });
 it('uses exact ÖSYM exam type rather than a generic grade claim',()=>{
  const v=auditApprovedRecoveryCoverage({
   ...base(EDUCATION_LEVELS.GRADUATE_YKS,'TYT'),
   candidates:[q('tyt',7,{examType:'TYT',options:{curriculumFramework:'OSYM'}}),
    q('ayt',7,{examType:'AYT',options:{curriculumFramework:'OSYM'}})]
  });
  expect(v).toMatchObject({status:'MATCHING_APPROVED',matchingApproved:1});
 });
});
