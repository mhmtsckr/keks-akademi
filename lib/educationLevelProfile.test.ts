import {describe,expect,it} from 'vitest';
import {EDUCATION_LEVELS} from './educationLevels';
import {educationLevelKey,resolveEducationLevelProfile,scalePracticeQuestionsForEducationLevel,subjectMatchesEducationLevel} from './educationLevelProfile';

describe('education level backbone',()=>{
  it('resolves every current education level to a behavioral profile',()=>{
    for(const level of Object.values(EDUCATION_LEVELS)){
      const profile=resolveEducationLevelProfile(level);
      expect(profile).not.toBeNull();
      expect(profile?.subjects.length).toBeGreaterThan(0);
      expect(profile?.questionTypes.length).toBeGreaterThan(0);
      expect(profile?.study.defaultDailyMinutes).toBeGreaterThan(0);
      expect(profile?.recommendedPlanId).toMatch(/^student-/);
    }
  });

  it('keeps grade 3 in the first primary group and grade 4 in transition',()=>{
    expect(educationLevelKey('3. sınıf')).toBe('PRIMARY_123');
    expect(educationLevelKey('4. sınıf')).toBe('PRIMARY_4');
  });

  it('changes study load between grade 7 and grade 8',()=>{
    const seven=resolveEducationLevelProfile(EDUCATION_LEVELS.MIDDLE_7)!;
    const eight=resolveEducationLevelProfile(EDUCATION_LEVELS.MIDDLE_8)!;
    expect(eight.study.defaultDailyMinutes).toBeGreaterThan(seven.study.defaultDailyMinutes);
    expect(scalePracticeQuestionsForEducationLevel(20,eight)).toBeGreaterThan(scalePracticeQuestionsForEducationLevel(20,seven));
    expect(eight.recommendedPlanId).toBe('student-lgs-360');
  });

  it('narrows grade 11 subjects by academic track',()=>{
    const ea=resolveEducationLevelProfile(EDUCATION_LEVELS.HIGH_11,'Eşit Ağırlık')!;
    expect(ea.subjects).toContain('Türk Dili ve Edebiyatı');
    expect(ea.subjects).toContain('Tarih-1');
    expect(ea.subjects).not.toContain('Fizik');
  });

  it('filters subjects outside the selected level without breaking aliases',()=>{
    const lgs=resolveEducationLevelProfile(EDUCATION_LEVELS.MIDDLE_8)!;
    expect(subjectMatchesEducationLevel('İnkılap Tarihi',lgs)).toBe(true);
    expect(subjectMatchesEducationLevel('AYT Fizik',lgs)).toBe(false);
  });
});
