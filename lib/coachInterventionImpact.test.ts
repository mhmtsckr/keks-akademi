import {describe,expect,it} from 'vitest';
import {aggregateInterventionPatterns,buildImpactHeadline,classifyCoachDecision,summarizeImpactWindow} from './coachInterventionImpact';

describe('koç müdahale etkisi motoru',()=>{
  it('aktif hatırlama kararını sınıflandırır ve dersi yakalar',()=>{
    expect(classifyCoachDecision('Biyoloji için aktif hatırlama uygula')).toEqual({
      kind:'ACTIVE_RECALL',subject:'Biyoloji'
    });
  });

  it('günlük problem rutinini sınıflandırır',()=>{
    expect(classifyCoachDecision('Matematik günlük problem rutini ekle').kind).toBe('DAILY_PROBLEM_ROUTINE');
  });

  it('önce/sonra performans özetini hesaplar',()=>{
    expect(summarizeImpactWindow([
      {date:new Date(),total:10,correct:7,blank:2},
      {date:new Date(),total:10,correct:9,blank:0}
    ])).toEqual({questions:20,accuracy:80,blank:2});
  });

  it('kullanıcı örneğine benzer açıklanabilir etki cümlesi üretir',()=>{
    const text=buildImpactHeadline({
      decision:'Biyoloji aktif hatırlama',
      kind:'ACTIVE_RECALL',
      subject:'Biyoloji',
      before:{accuracy:60,blank:4},
      after:{accuracy:77,blank:2},
      weeksAfter:3
    });
    expect(text).toContain('Biyoloji doğruluk +%17');
  });

  it('aynı müdahale türlerini örüntü olarak toplar',()=>{
    const patterns=aggregateInterventionPatterns([
      {kind:'ACTIVE_RECALL',accuracyDelta:17,blankDelta:-1,beforeQuestions:30,afterQuestions:40},
      {kind:'ACTIVE_RECALL',accuracyDelta:9,blankDelta:-2,beforeQuestions:35,afterQuestions:45},
      {kind:'ACTIVE_RECALL',accuracyDelta:4,blankDelta:0,beforeQuestions:20,afterQuestions:30}
    ]);
    expect(patterns[0].cases).toBe(3);
    expect(patterns[0].avgAccuracyDelta).toBe(10);
    expect(patterns[0].confidence).toBe('ORTA');
  });
});
