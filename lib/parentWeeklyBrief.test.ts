import {describe,expect,it} from 'vitest';
import {buildParentWeeklyBrief} from './parentWeeklyBrief';
import type {StudentIndicator,StudentIndicatorKey} from './studentIndicators';

function indicator(key:StudentIndicatorKey,label:string,value:number|null,previous:number|null):StudentIndicator{
  const delta=value!=null&&previous!=null?value-previous:null;
  return {
    key,label,value,previous,delta,
    trend:delta==null?'NO_COMPARISON':delta>0?'UP':delta<0?'DOWN':'SAME',
    unit:'%',
    evidence:value==null?'Veri yok':label+' kanıtı %'+value,
    previousEvidence:previous==null?'Veri yok':'%'+previous,
    formula:'test formülü',
    reasons:[],
    confidence:value==null?'YETERSİZ':'YETERLİ'
  };
}

function indicators(plan=86,continuity=82,review=80,mastery=70,accuracy=76){
  return [
    indicator('CONTINUITY','Çalışma Sürekliliği',continuity,70),
    indicator('REVIEW_DISCIPLINE','Tekrar Disiplini',review,72),
    indicator('KNOWLEDGE_MASTERY','Bilgi Hâkimiyeti',mastery,65),
    indicator('QUESTION_ACCURACY','Soru Doğruluğu',accuracy,71),
    indicator('PLAN_ALIGNMENT','Plan Uyumu',plan,74)
  ];
}

describe('veli haftalık destek özeti',()=>{
  it('yüksek bugünkü plan uyumunda gereksiz hatırlatmayı azaltır',()=>{
    const brief=buildParentWeeklyBrief({
      indicators:indicators(),
      todayPlan:{total:7,completed:6}
    });
    expect(brief.reassurance.tone).toBe('CALM');
    expect(brief.reassurance.headline).toBe('Bugün çalışma hatırlatması yapmanız gerekmiyor.');
    expect(brief.reassurance.detail).toContain('Bugünkü planına %86 uydu');
    expect(brief.support.some(x=>x.title==='Hatırlatmayı azaltın')).toBe(true);
  });

  it('plan uyumu gerilediğinde veliyi baskıya değil desteğe yönlendirir',()=>{
    const brief=buildParentWeeklyBrief({
      indicators:[
        indicator('CONTINUITY','Çalışma Sürekliliği',50,80),
        indicator('REVIEW_DISCIPLINE','Tekrar Disiplini',45,78),
        indicator('KNOWLEDGE_MASTERY','Bilgi Hâkimiyeti',40,60),
        indicator('QUESTION_ACCURACY','Soru Doğruluğu',55,72),
        indicator('PLAN_ALIGNMENT','Plan Uyumu',52,74)
      ],
      todayPlan:{total:5,completed:2}
    });
    expect(brief.reassurance.tone).toBe('ATTENTION');
    expect(brief.reassurance.detail.toLocaleLowerCase('tr-TR')).toContain('baskı');
    expect(brief.attention.some(x=>x.title==='Plan uyumu belirgin biçimde geriledi')).toBe(true);
    expect(brief.support.some(x=>x.title==='Başlamayı kolaylaştırın')).toBe(true);
  });

  it('veri yokken veliye sahte başarısızlık mesajı üretmez',()=>{
    const missing=[
      indicator('CONTINUITY','Çalışma Sürekliliği',null,null),
      indicator('REVIEW_DISCIPLINE','Tekrar Disiplini',null,null),
      indicator('KNOWLEDGE_MASTERY','Bilgi Hâkimiyeti',null,null),
      indicator('QUESTION_ACCURACY','Soru Doğruluğu',null,null),
      indicator('PLAN_ALIGNMENT','Plan Uyumu',null,null)
    ];
    const brief=buildParentWeeklyBrief({indicators:missing,todayPlan:{total:0,completed:0}});
    expect(brief.reassurance.tone).toBe('NO_DATA');
    expect(brief.attention[0].title).toBe('Belirgin bir müdahale sinyali yok');
    expect(brief.good[0].detail).toContain('başarısızlık göstergesi değildir');
  });
  it('önceki haftaya göre gelişmeyi ve tek cümlelik veli önerisini gösterir',()=>{
    const brief=buildParentWeeklyBrief({
      indicators:indicators(),
      todayPlan:{total:7,completed:6}
    });
    expect(brief.change.status).toBe('UP');
    expect(brief.change.text).toContain('Geçen haftaya göre');
    expect(brief.keksRecommendation).toContain('sorumluluğunu öğrencide bırakın');
    expect(brief.keksRecommendation.endsWith('.')).toBe(true);
  });

  it('karma gelişimde yükseliş ile düşüşü birlikte açıklar',()=>{
    const brief=buildParentWeeklyBrief({
      indicators:[
        indicator('CONTINUITY','Çalışma Sürekliliği',80,65),
        indicator('REVIEW_DISCIPLINE','Tekrar Disiplini',45,75),
        indicator('KNOWLEDGE_MASTERY','Bilgi Hâkimiyeti',65,65),
        indicator('QUESTION_ACCURACY','Soru Doğruluğu',72,72),
        indicator('PLAN_ALIGNMENT','Plan Uyumu',72,72)
      ],
      todayPlan:{total:0,completed:0}
    });
    expect(brief.change.status).toBe('MIXED');
    expect(brief.change.text).toContain('çalışma sürekliliği gelişirken');
    expect(brief.change.text).toContain('tekrar disiplini geriledi');
    expect(brief.keksRecommendation).toContain('tekrar için');
  });

  it('küçük farklılıkları anlamlı gelişim veya gerileme saymaz',()=>{
    const brief=buildParentWeeklyBrief({
      indicators:[
        indicator('CONTINUITY','Çalışma Sürekliliği',70,68),
        indicator('REVIEW_DISCIPLINE','Tekrar Disiplini',70,72)
      ],
      todayPlan:{total:0,completed:0}
    });
    expect(brief.change.status).toBe('STABLE');
  });

  it('karşılaştırılabilir veri yetersizse sahte haftalık değişim yazmaz',()=>{
    const brief=buildParentWeeklyBrief({
      indicators:[indicator('PLAN_ALIGNMENT','Plan Uyumu',null,null)],
      todayPlan:{total:0,completed:0}
    });
    expect(brief.change.status).toBe('NO_DATA');
    expect(brief.change.text).toContain('yeterli veri yok');
  });
});
