import {describe,expect,it} from 'vitest';
import {buildErrorReasonBreakdown,inferPracticeErrorReason,normalizedReason} from './learningEngine';

describe('yanlış nedeni veri motoru',()=>{
  it('yanlış sayısını kayıt sayısı yerine ağırlık olarak kullanır',()=>{
    const result=buildErrorReasonBreakdown([
      {wrong:41,errorReason:'ISLEM_HATASI'},
      {wrong:59,errorReason:'BILGI_EKSIKLIGI'}
    ]);
    expect(result.classifiedWrong).toBe(100);
    expect(result.items.find(x=>x.key==='ISLEM_HATASI')?.percent).toBe(41);
  });

  it('sınıflandırılmamış yanlışları veri kalitesi sinyali olarak ayırır',()=>{
    const result=buildErrorReasonBreakdown([
      {wrong:4,errorReason:'DIKKAT'},
      {wrong:6,errorReason:null}
    ]);
    expect(result.coveragePercent).toBe(40);
    expect(result.unclassifiedWrong).toBe(6);
  });

  it('eski strateji kaydını yöntem bilmeme sınıfına eşler',()=>{
    expect(normalizedReason('STRATEJI')).toBe('YONTEM_BILMEME');
  });

  it('düşük tekrar başarısını unutma olarak otomatik sınıflandırabilir',()=>{
    expect(inferPracticeErrorReason({
      subject:'Tarih',correct:4,wrong:6,blank:0,reviewSuccessScore:40
    })).toBe('UNUTMA');
  });

  it('yüksek soru başı süreyi süre nedeni olarak sınıflandırabilir',()=>{
    expect(inferPracticeErrorReason({
      subject:'Matematik',correct:3,wrong:2,blank:0,durationSeconds:1000
    })).toBe('SURE');
  });

  it('kanıt yetersizse neden uydurmaz',()=>{
    expect(inferPracticeErrorReason({
      subject:'Matematik',correct:8,wrong:2,blank:0
    })).toBeNull();
  });
});
