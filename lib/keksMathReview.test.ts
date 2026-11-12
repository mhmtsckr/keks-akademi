import {describe,expect,it} from 'vitest';
import {isKeksMathQuestion,keksMathDueAt,nextKeksMathReview} from './keksMathReview';

describe('KEKS Matematik sabit tekrar eğrisi',()=>{
  it('0-1-3-7-14-28 günlerinin aralıklarını korur',()=>{
    const intervals=[1,2,4,7,14];
    for(let i=0;i<intervals.length;i++){
      expect(nextKeksMathReview(i,true)).toEqual({stepIndex:i+1,completed:false,nextIntervalDays:intervals[i]});
    }
    expect(nextKeksMathReview(5,true)).toEqual({stepIndex:6,completed:true,nextIntervalDays:null});
  });
  it('her yanlış ve boş soruyu 0. güne döndürür',()=>{
    expect(nextKeksMathReview(4,false)).toEqual({stepIndex:0,completed:false,nextIntervalDays:0});
    expect(isKeksMathQuestion('KEKS_MAT_2026:KEKS-MAT-0001')).toBe(true);
    expect(isKeksMathQuestion('ORIGINAL')).toBe(false);
  });
  it('takvim gününü İstanbul saatiyle hesaplar',()=>{
    expect(keksMathDueAt(new Date('2026-11-12T22:30:00Z'),1).toISOString())
      .toBe('2026-11-14T06:00:00.000Z');
  });
});
