import {describe,expect,it} from 'vitest';
import {buildSevenDayInterventionPlan,buildTimeSignal,compareSubjectNets,sameExamPrevious,subjectNets} from './examIntervention';

describe('otomatik deneme analiz raporu',()=>{
  it('aynı sınav türündeki önceki denemeyi seçer',()=>{
    const latest={examType:'TYT',id:'a'};
    const previous=sameExamPrevious(latest,[{examType:'AYT',id:'b'},{examType:'TYT',id:'c'}]);
    expect(previous?.id).toBe('c');
  });

  it('ders bazlı net değişimlerini hesaplar',()=>{
    const changes=compareSubjectNets(
      {Matematik:20,Türkçe:30,Fen:10},
      {Matematik:14,Türkçe:32,Fen:8}
    );
    expect(changes.find(x=>x.subject==='Matematik')?.delta).toBe(6);
    expect(changes.find(x=>x.subject==='Türkçe')?.delta).toBe(-2);
  });

  it('subjectNets ve subjects payload biçimlerini okuyabilir',()=>{
    expect(subjectNets({subjectNets:{Matematik:20}}).Matematik).toBe(20);
    expect(subjectNets({subjects:{Biyoloji:{net:8.5}}}).Biyoloji).toBe(8.5);
  });

  it('süre sınırının %95 üzeri kullanımını müdahale sinyali yapar',()=>{
    const signal=buildTimeSignal({usedDurationMinutes:160,allowedDurationMinutes:165},[]);
    expect(signal.problem).toBe(true);
  });

  it('kanıt yoksa süre problemi uydurmaz',()=>{
    const signal=buildTimeSignal({},[]);
    expect(signal.problem).toBeNull();
    expect(signal.measured).toBe(false);
  });

  it('7 günlük plana süre müdahalesini ve akademik öncelikleri ekler',()=>{
    const plan=buildSevenDayInterventionPlan([
      {subject:'Matematik',topic:'Problemler',reason:'Net kaybı'}
    ],true);
    expect(plan[0].task).toContain('Süre analizi');
    expect(plan.some(x=>x.subject==='Matematik')).toBe(true);
  });
});
