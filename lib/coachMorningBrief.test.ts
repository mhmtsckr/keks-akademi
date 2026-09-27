import {describe,expect,it} from 'vitest';
import {subjectAccuracyTrend} from './learningEngine';

describe('coach morning brief subject trends',()=>{
  const now=new Date('2026-09-27T12:00:00Z');
  it('ders ve sınav türüne göre iki haftalık doğruluk değişimini hesaplar',()=>{
    const rows=[
      {date:new Date('2026-09-15T12:00:00Z'),examType:'TYT',subject:'Matematik',total:10,correct:8},
      {date:new Date('2026-09-24T12:00:00Z'),examType:'TYT',subject:'Matematik',total:10,correct:6},
      {date:new Date('2026-09-16T12:00:00Z'),examType:'TYT',subject:'Türkçe',total:10,correct:7},
      {date:new Date('2026-09-25T12:00:00Z'),examType:'TYT',subject:'Türkçe',total:10,correct:8}
    ];
    const result=subjectAccuracyTrend(rows,now);
    const math=result.find(x=>x.subject==='Matematik');
    expect(math?.previousAccuracy).toBe(80);
    expect(math?.currentAccuracy).toBe(60);
    expect(math?.delta).toBe(-20);
  });

  it('her dönemde en az 5 soru yoksa düşüş sinyali üretmez',()=>{
    const result=subjectAccuracyTrend([
      {date:new Date('2026-09-15T12:00:00Z'),examType:'TYT',subject:'Matematik',total:4,correct:4},
      {date:new Date('2026-09-24T12:00:00Z'),examType:'TYT',subject:'Matematik',total:10,correct:5}
    ],now);
    expect(result).toHaveLength(0);
  });
});
