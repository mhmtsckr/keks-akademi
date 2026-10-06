import {describe,expect,it} from 'vitest';
import {
  buildSevenDayStarterPlan,
  isStudentOnboardingRequired,
  studentOnboardingState,
  subjectsForOnboarding,
  withRequiredStudentOnboarding
} from './studentOnboarding';
import {EDUCATION_LEVELS} from './educationLevels';

describe('student first-login onboarding',()=>{
  it('marks only explicitly required new profiles as onboarding-required',()=>{
    expect(isStudentOnboardingRequired(null)).toBe(false);
    const required=withRequiredStudentOnboarding({educationContext:{key:'MIDDLE_8'}},'2026-10-07T00:00:00.000Z');
    expect(isStudentOnboardingRequired(required)).toBe(true);
    expect(studentOnboardingState(required).version).toBe(1);
    expect(studentOnboardingState({onboarding:{version:1,status:'COMPLETED',starterPlanId:'p1'}}).starterPlanId).toBe('p1');
  });

  it('derives weak-subject choices from the selected education level',()=>{
    expect(subjectsForOnboarding(EDUCATION_LEVELS.MIDDLE_8)).toContain('Matematik');
    expect(subjectsForOnboarding(EDUCATION_LEVELS.MIDDLE_8)).toContain('T.C. İnkılap Tarihi ve Atatürkçülük');
    expect(subjectsForOnboarding('DGS')).toEqual(['Türkçe','Matematik']);
  });

  it('creates exactly seven days and reduces load on non-preferred days',()=>{
    const plan=buildSevenDayStarterPlan({
      gradeLevel:EDUCATION_LEVELS.MIDDLE_8,
      goal:'LGS için güçlü bir başlangıç yapmak',
      dailyMinutes:150,
      weakSubjects:['Matematik','Fen Bilimleri'],
      resources:[{title:'LGS Matematik Soru Bankası',subject:'Matematik',publisher:'KEKS'}],
      preferredDays:['Çarşamba','Perşembe','Cuma','Cumartesi','Pazartesi','Salı'],
      studyStart:'19:00',
      studyEnd:'21:30',
      lastExam:{examType:'LGS',totalNet:62},
      now:new Date('2026-10-07T12:00:00.000Z')
    });
    expect(plan.days).toHaveLength(7);
    expect(plan.days[0].dailyMinutes).toBe(150);
    expect(plan.days[0].tasks.some((x:any)=>x.title.includes('LGS Matematik Soru Bankası'))).toBe(true);
    expect(plan.days[4].dayName).toBe('Pazar');
    expect(plan.days[4].preferred).toBe(false);
    expect(plan.days[4].dailyMinutes).toBeLessThan(150);
    expect(plan.days[4].tasks).toHaveLength(1);
    expect(plan.baselineExam?.totalNet).toBe(62);
  });

  it('keeps the seventh day as a review and re-measurement day',()=>{
    const plan=buildSevenDayStarterPlan({
      gradeLevel:EDUCATION_LEVELS.HIGH_12,
      goal:'YKS performansımı yükseltmek',
      dailyMinutes:210,
      weakSubjects:['Matematik'],
      resources:[],
      preferredDays:['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'],
      studyStart:'18:30',
      studyEnd:'22:00',
      lastExam:null,
      now:new Date('2026-10-07T12:00:00.000Z')
    });
    expect(plan.days[6].tasks.map((x:any)=>x.type)).toContain('REVIEW');
    expect(plan.days[6].tasks.map((x:any)=>x.type)).toContain('CHECK');
    expect(plan.title).toBe('İlk 7 Günlük Başlangıç Planı');
  });
});
