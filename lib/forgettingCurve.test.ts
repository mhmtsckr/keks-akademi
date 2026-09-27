import { describe,expect,it } from 'vitest';
import { adaptiveReviewIntervalDays,reviewIntervalReason } from './learningEngine';

describe('kişiye özel unutma eğrisi',()=>{
  it('üç ardışık doğru sonrası 7 günlük tabanı 14 güne çıkarır',()=>{
    expect(adaptiveReviewIntervalDays({
      nextStep:3,correct:true,previousCorrect:true,correctStreak:3,recentAccuracy:80
    })).toBe(14);
  });

  it('tekrar yanlışında uzun aralığı 3 güne çeker',()=>{
    expect(adaptiveReviewIntervalDays({
      nextStep:4,correct:false,previousCorrect:true,incorrectStreak:1,recentAccuracy:80
    })).toBe(3);
  });

  it('iki ardışık yanlışta 1 günlük yakın tekrar uygular',()=>{
    expect(adaptiveReviewIntervalDays({
      nextStep:3,correct:false,previousCorrect:false,incorrectStreak:2,recentAccuracy:40
    })).toBe(1);
  });

  it('yüksek performansta aralığı açar ama 60 günü aşmaz',()=>{
    expect(adaptiveReviewIntervalDays({
      nextStep:5,correct:true,previousCorrect:true,correctStreak:5,recentAccuracy:100,masteryScore:95
    })).toBeLessThanOrEqual(60);
  });

  it('kararın nedenini açıklanabilir metinle döndürür',()=>{
    const reason=reviewIntervalReason({
      nextStep:3,correct:true,previousCorrect:true,correctStreak:3,recentAccuracy:90
    },14);
    expect(reason).toContain('ardışık doğru');
  });
});
