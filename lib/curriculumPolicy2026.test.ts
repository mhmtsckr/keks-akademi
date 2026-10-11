import {describe,it,expect} from 'vitest';
import {ACADEMIC_YEAR,CURRENT_YEAR_GRADE_POLICY,canonicalExamType,resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {EDUCATION_LEVELS} from './educationLevels';

describe('MEB/ÖSYM 2026–2027 programı ve sınıf ayrımı',()=>{
 it('MEB resmî kademeli uygulama tablosunu esas alır',()=>{
  expect(ACADEMIC_YEAR).toBe('2026-2027');
  for(const grade of [1,2,3,5,6,7,9,10,11])expect(CURRENT_YEAR_GRADE_POLICY[grade]).toBe('TYMM');
  for(const grade of [4,8,12])expect(CURRENT_YEAR_GRADE_POLICY[grade]).toBe('MEB_LEGACY');
 });
 it('birden fazla sınıf içeren etiketleri kesin bir sınıf saymaz',()=>{
  for(const key of ['PRIMARY_123','MIDDLE_56','HIGH_910'] as const){
   const ctx=resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS[key]});
   expect(ctx.grade).toBeNull();
   expect(ctx.framework).toBe('UNRESOLVED');
   expect(ctx.canSelectGrade).toBe(true);
  }
 });
 it('öğrenci seçimi yalnız kendi grubunun sınıflarıyla sınırlandırılır',()=>{
  const five=resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS.MIDDLE_56,selectedGrade:5});
  expect(five.grade).toBe(5);
  expect(five.framework).toBe('TYMM');
  expect(resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS.MIDDLE_56,selectedGrade:8}).framework).toBe('UNRESOLVED');
  expect(resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS.MIDDLE_8}).framework).toBe('MEB_LEGACY');
  expect(resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS.HIGH_12}).framework).toBe('MEB_LEGACY');
 });
 it('yetişkin ve mezun ÖSYM sınavı ilkokul kazanımı gibi değerlendirilmez',()=>{
  expect(resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS.GRADUATE_YKS,examType:'TYT'}).framework).toBe('OSYM');
  expect(resolveLearningCurriculumContext({gradeLevel:'Yetişkin',examType:'AGS/ÖABT'}).framework).toBe('OSYM');
  expect(canonicalExamType('AGS/ÖABT')).toBe('AGS');
  expect(canonicalExamType('YÖKDİL')).toBe('YÖKDİL');
 });
 it('soru düzeyine ait olmayan dersi otomatik göstermez',()=>{
  const kid=resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS.PRIMARY_123,selectedGrade:1});
  const teen=resolveLearningCurriculumContext({gradeLevel:EDUCATION_LEVELS.HIGH_12});
  expect(lessonAllowedForContext({targetGrades:[1]},kid)).toBe(true);
  expect(lessonAllowedForContext({targetGrades:[12]},kid)).toBe(false);
  expect(lessonAllowedForContext({targetGrades:[12]},teen)).toBe(true);
  expect(lessonAllowedForContext({targetGrades:[1]},teen)).toBe(false);
  const exam=resolveLearningCurriculumContext({gradeLevel:'Yetişkin',examType:'AGS/ÖABT'});
  expect(lessonAllowedForContext({targetExams:['AGS']},exam)).toBe(true);
  expect(lessonAllowedForContext({targetExams:['TYT']},exam)).toBe(false);
 });
});
