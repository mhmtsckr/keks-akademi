import {describe,expect,it} from 'vitest';
import {buildMizaTodayOrchestration,formatMizaTodayReply,isMizaTodayPlanIntent} from './mizaOrchestrator';

describe('MİZA bugün niyeti',()=>{
  it('bugün ne çalışayım varyasyonlarını yakalar',()=>{
    expect(isMizaTodayPlanIntent('Bugün ne çalışayım?')).toBe(true);
    expect(isMizaTodayPlanIntent('Sırada ne var?')).toBe(true);
    expect(isMizaTodayPlanIntent('MİZA bugün için plan yap')).toBe(true);
    expect(isMizaTodayPlanIntent('Motivasyonum düştü')).toBe(false);
  });
});

describe('MİZA günlük orkestrasyon',()=>{
  it('koç görevi ve tekrarları yapılandırılmış görev olarak döndürür',()=>{
    const x=buildMizaTodayOrchestration({
      date:'2026-10-07',
      engineVersion:'TODAY_PLAN_V5',
      plan:[
        {id:'action:1',order:1,source:'ACTION',title:'Matematik',targetValue:20,metricType:'QUESTIONS',estimatedMinutes:30,completed:false,actionId:'1'},
        {id:'review-batch:1',order:2,source:'REVIEW_BATCH',title:'2 gecikmiş tekrar',targetValue:2,metricType:'REVIEWS',estimatedMinutes:8,completed:false,reviewIds:['r1','r2']}
      ]
    });
    expect(x.coachTasks).toBe(1);
    expect(x.dueReviews).toBe(2);
    expect(x.plannedMinutes).toBe(38);
    expect(x.tasks[0].resultMode).toBe('ACTION_QUESTIONS');
    expect(x.tasks[1].resultMode).toBe('REVIEW_FLOW');
    expect(x.coachBoundary.authority).toBe('COACH_OVERRIDES_MIZA');
    expect(formatMizaTodayReply(x)).toContain('Toplam yaklaşık süre: 38 dk');
  });
});
