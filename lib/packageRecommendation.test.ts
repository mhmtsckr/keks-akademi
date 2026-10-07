import {describe,expect,it} from 'vitest';
import {recommendPackageTerm} from './packageRecommendation';

describe('recommendPackageTerm',()=>{
  it('8 ay ve düzenli takipte 6 aylık güçlenmeyi önerir',()=>{
    const result=recommendPackageTerm({monthsToGoal:8,trackingNeed:'regular',studyRoutine:'irregular'});
    expect(result.term).toBe('sixMonths');
    expect(result.title).toBe('6 Aylık Güçlenme');
    expect(result.explanation).toContain('8 ay');
    expect(result.explanation).toContain('düzenli takip');
  });

  it('kısa sürede aylık esnek başlangıcı öne çıkarır',()=>{
    expect(recommendPackageTerm({monthsToGoal:1,trackingNeed:'light',studyRoutine:'starting'}).term).toBe('monthly');
  });

  it('3-4 aylık hedefte KEKS Kamp önerir',()=>{
    expect(recommendPackageTerm({monthsToGoal:4,trackingNeed:'regular',studyRoutine:'irregular'}).term).toBe('threeMonths');
  });

  it('uzun ve yoğun takipte yıllık KEKS 360 önerir',()=>{
    expect(recommendPackageTerm({monthsToGoal:12,trackingNeed:'intensive',studyRoutine:'regular'}).term).toBe('annual');
  });

  it('ay değerini güvenli aralıkta sınırlar',()=>{
    const result=recommendPackageTerm({monthsToGoal:99,trackingNeed:'regular',studyRoutine:'regular'});
    expect(result.explanation).toContain('24 ay');
    expect(result.term).toBe('annual');
  });
});
