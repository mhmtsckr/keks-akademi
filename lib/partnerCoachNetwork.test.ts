import {describe,expect,it} from 'vitest';
import {coachSupportsEducationLevel,rankPartnerCoach,type PartnerCoachRecord} from './partnerCoachNetwork';

function coach(overrides:Partial<PartnerCoachRecord>={}):PartnerCoachRecord{
  return {
    id:'coach-1',
    userId:'user-1',
    name:'Test Koç',
    displayTitle:'YKS Öğrenci Koçu',
    bio:'Öğrencinin plan, tekrar ve deneme sürecini düzenli olarak takip eder.',
    specialties:['YKS Eşit Ağırlık','Planlama ve zaman yönetimi'],
    supportedEducationLevels:['Lise 11 | Maarif Model (Alan)','Lise 12 | YKS'],
    maxActiveStudents:20,
    acceptingStudents:true,
    partnerStatus:'ACTIVE',
    responseTargetHours:24,
    studentCount:10,
    responseHours:8,
    sessionCompletionRate:92,
    profileCompleteness:100,
    ...overrides
  };
}

describe('Partner Koç eşleştirme ağı',()=>{
  it('eğitim düzeyi, uzmanlık, kapasite ve operasyon kalitesini açıklanabilir eşleşmeye dönüştürür',()=>{
    const result=rankPartnerCoach(coach(),{
      gradeLevel:'Lise 12 | YKS',
      academicTrack:'EŞİT AĞIRLIK'
    });
    expect(result.eligible).toBe(true);
    expect(result.availableSlots).toBe(10);
    expect(result.fitReasons.some(x=>x.includes('Eğitim düzeyini'))).toBe(true);
    expect(result.fitReasons.some(x=>x.includes('YKS Eşit Ağırlık'))).toBe(true);
    expect(result.fitReasons.some(x=>x.includes('yanıt medyanı'))).toBe(true);
    expect(result.fitReasons.some(x=>x.includes('Görüşme tamamlama'))).toBe(true);
  });

  it('takip etmediği eğitim düzeyine öğrenci önermez',()=>{
    const result=rankPartnerCoach(coach(),{
      gradeLevel:'Ortaokul 8 | Maarif Model',
      academicTrack:null
    });
    expect(result.eligible).toBe(false);
  });

  it('kapasitesi dolu koçu yeni öğrenciye önermez fakat mevcut eşleşmeyi korur',()=>{
    const full=coach({studentCount:20});
    expect(rankPartnerCoach(full,{gradeLevel:'Lise 12 | YKS',academicTrack:'EŞİT AĞIRLIK'}).eligible).toBe(false);
    const existing=rankPartnerCoach(full,{
      gradeLevel:'Lise 12 | YKS',
      academicTrack:'EŞİT AĞIRLIK',
      currentCoachId:'coach-1'
    });
    expect(existing.eligible).toBe(true);
    expect(existing.fitReasons.some(x=>x.includes('Mevcut Partner Koç'))).toBe(true);
  });

  it('ağdan duraklatılan veya öğrenci kabulünü kapatan koçu eşleştirmez',()=>{
    expect(rankPartnerCoach(coach({partnerStatus:'PAUSED'}),{gradeLevel:'Lise 12 | YKS'}).eligible).toBe(false);
    expect(rankPartnerCoach(coach({acceptingStudents:false}),{gradeLevel:'Lise 12 | YKS'}).eligible).toBe(false);
  });

  it('eski eğitim düzeyi etiketlerini güncel düzeyle eşleyebilir',()=>{
    expect(coachSupportsEducationLevel(['8. Sınıf / LGS'],'Ortaokul 8 | Maarif Model')).toBe(true);
  });
});
