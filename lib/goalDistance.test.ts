import {describe,expect,it} from 'vitest';
import {rankGoalContributionAreas,targetNetFromBenchmarks} from './goalDistance';

describe('hedefe kalan mesafe',()=>{
  it('ders bazlı hedef netlerini toplam hedef nete dönüştürür',()=>{
    const result=targetNetFromBenchmarks({Türkçe:30,Matematik:35,Fen:15,Sosyal:15},null);
    expect(result.total).toBe(95);
  });

  it('açık ve riskli konulara göre en yüksek katkı potansiyelindeki dersleri sıralar',()=>{
    const result=rankGoalContributionAreas([
      {subject:'Matematik',status:'RISKY',score:35,accuracy:45},
      {subject:'Matematik',status:'LEARNING',score:48,accuracy:55},
      {subject:'Biyoloji',status:'LEARNING',score:55,accuracy:65},
      {subject:'Türkçe',status:'DURABLE',score:90,accuracy:88}
    ]);
    expect(result[0].subject).toBe('Matematik');
    expect(result[0].openTopics).toBe(2);
    expect(result.find(x=>x.subject==='Türkçe')).toBeUndefined();
  });

  it('açık hedef net yoksa null döndürür',()=>{
    expect(targetNetFromBenchmarks(null,null).total).toBeNull();
  });
});
