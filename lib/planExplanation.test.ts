import { describe, expect, it } from 'vitest';
import { buildPracticeWhy, buildReviewWhy } from './planExplanation';

describe('explainable today plan', () => {
  it('explains low accuracy plus a 7-day review in student language', () => {
    expect(buildPracticeWhy({
      subject:'Kimya',
      topic:'Kimyasal Türler',
      questionTarget:40,
      recentAccuracies:[52,48],
      dueReviewCount:1,
      dueReviewSteps:[7],
      masteryStatus:'RISKY'
    })).toBe('Bugün Kimya 40 soru önerildi çünkü son iki testte doğruluğun %52 ve %48 ile %55’in altında ve 7 günlük tekrarın bugün.');
  });

  it('explains review batches without fabricating a score', () => {
    const text=buildReviewWhy({count:3,sevenDayCount:1,subjects:['Kimya','Tarih']});
    expect(text).toContain('7 günlük tekrar');
    expect(text).toContain('Kimya');
    expect(text).not.toContain('puan');
  });
});
