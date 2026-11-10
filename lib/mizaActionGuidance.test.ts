import {describe,expect,it} from 'vitest';
import {mizaLearningGuidance,type MizaGuidanceTask} from './mizaActionGuidance';

const base:MizaGuidanceTask={
  source:'ACTION',metricType:'QUESTIONS',targetValue:20,
  masteryStatus:null,masteryRiskReasons:[],forgettingRiskScore:null,
  primaryErrorReasonLabel:null,avgSecondsPerQuestion:null,targetSecondsPerQuestion:null
};

describe('MİZA kanıt ve mikro adım',()=>{
  it('veri yoksa öğrenciye yanlış güven vermez',()=>{
    const g=mizaLearningGuidance(base);
    expect(g.confidence).toBe('LIMITED');
    expect(g.evidence).toHaveLength(0);
    expect(g.nextStep).toContain('Koç görevini');
  });
  it('unutma ve düşük hâkimiyette kaynaksız hatırlamayı önceler',()=>{
    const g=mizaLearningGuidance({...base,masteryStatus:'RISKY',
      masteryRiskReasons:['2 tekrar gecikti'],forgettingRiskScore:72});
    expect(g.confidence).toBe('MULTIPLE_SIGNALS');
    expect(g.nextStep).toContain('kaynaksız aktif hatırlama');
    expect(g.evidence).toHaveLength(2);
  });
  it('yalnız yavaş soru hızına dayalı eylem önerir, kesin teşhis yapmaz',()=>{
    const g=mizaLearningGuidance({...base,source:'PRACTICE',
      avgSecondsPerQuestion:180,targetSecondsPerQuestion:100});
    expect(g.confidence).toBe('SUPPORTED');
    expect(g.nextStep).toContain('süreyi');
  });
  it('tekrar sorusunda aktif geri çağırmayı kullanır',()=>{
    const g=mizaLearningGuidance({...base,source:'REVIEW_BATCH'});
    expect(g.nextStep).toContain('Cevaba bakmadan');
  });
});
