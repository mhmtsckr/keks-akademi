import {describe,expect,it} from 'vitest';
import {buildLearningDiagnostics,type LearningDiagnosticInput} from './learningDiagnostics';

const now=new Date('2026-11-11T12:00:00Z');
function row(day:number,total:number,correct:number,blank=0,extra:Partial<LearningDiagnosticInput>={}):LearningDiagnosticInput{
  return {
    subject:'Türkçe',topic:'Ana düşünce',total,correct,wrong:total-correct-blank,blank,
    date:new Date('2026-11-'+String(day).padStart(2,'0')+'T12:00:00Z'),
    ...extra
  };
}
describe('MİZA · farklı günlerde öğrenme kanıtı',()=>{
  it('tek gün çok soru çözmeyi öğrenme kanıtı saymaz',()=>{
    const result=buildLearningDiagnostics([row(8,100,100)],now);
    expect(result[0]).toMatchObject({signal:'MEASURE_MORE',studyDays:1,confidence:'INSUFFICIENT',recentAccuracy:null});
  });
  it('az sorulu dört günü kesin gelişim saymaz',()=>{
    const result=buildLearningDiagnostics([row(4,3,0),row(6,3,1),row(8,3,3),row(10,3,3)],now);
    expect(result[0].signal).toBe('MEASURE_MORE');
  });
  it('ayrı günlerde anlamlı iyileşmeyi ayırt eder',()=>{
    const result=buildLearningDiagnostics([
      row(2,10,4),row(4,10,5),row(7,10,8),row(10,10,9)
    ],now);
    expect(result[0]).toMatchObject({signal:'IMPROVING',confidence:'MULTI_DAY',earlyAccuracy:45,recentAccuracy:85,deltaPoints:40});
  });
  it('başarı gerilemesini koç aksiyonuna dönüştürür',()=>{
    const result=buildLearningDiagnostics([
      row(2,10,9),row(4,10,9),row(8,10,5),row(10,10,5)
    ],now);
    expect(result[0].signal).toBe('REGRESSING');
    expect(result[0].nextAction).toContain('Koçla');
  });
  it('sürekli yüksek performansı kalıcı öğrenme ilan etmez',()=>{
    const result=buildLearningDiagnostics([
      row(2,10,9),row(4,10,9),row(8,10,9),row(10,10,9)
    ],now);
    expect(result[0].signal).toBe('CONSISTENT');
    expect(result[0].nextAction).toContain('kalıcı öğrenme varsayma');
  });
  it('yetersiz girdi, belirsiz konu ve gelecek verileri dışlar',()=>{
    const result=buildLearningDiagnostics([
      row(4,10,3,0,{topic:null}),row(7,10,15),row(10,10,9,0,{date:new Date('2026-12-01T10:00:00Z')}),
      row(9,8,7,0,{taskSubmissionId:'submission1'})
    ],now);
    expect(result).toHaveLength(1);
    expect(result[0].studentReportedQuestions).toBe(8);
    expect(result[0].confidence).toBe('INSUFFICIENT');
  });
  it('UTC gece yarısı Türkiye takvimine göre aynı güne atanır',()=>{
    const result=buildLearningDiagnostics([
      row(8,10,8),row(8,12,10,0,{date:new Date('2026-11-08T21:30:00Z')})
    ],now);
    expect(result[0].studyDays).toBe(2);
  });
});
