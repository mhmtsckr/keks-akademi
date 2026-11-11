import {describe,it,expect} from 'vitest';
import {evaluateApprovedPlan} from './planAdherence';
const now=new Date('2026-11-13T12:00:00Z');
const approved={
  id:'p1',title:'Akıllı Haftalık Program',createdAt:'2026-11-10T12:00:00Z',
  days:[
    {date:'2026-11-11T12:00:00Z',plannedMinutes:90,capacityMinutes:100,tasks:[
      {type:'COACH_ACTION',actionId:'a',title:'Koç Türkçe',duration:35},
      {type:'REVIEW',title:'Tekrar',duration:10},
      {type:'TOPIC',title:'Yeni konu',duration:45}
    ]},
    {date:'2026-11-12T12:00:00Z',plannedMinutes:90,capacityMinutes:100,tasks:[
      {type:'COACH_ACTION',actionId:'b',title:'Koç Matematik',duration:45},
      {type:'TOPIC',title:'Konu',duration:45}
    ]},
    {date:'2026-11-14T12:00:00Z',plannedMinutes:60,capacityMinutes:90,tasks:[
      {type:'COACH_ACTION',actionId:'c',title:'Gelecek görev',duration:60}
    ]}
  ]
};
describe('onaylı haftalık plan gerçekleşme denetimi',()=>{
  it('teslim ve zamanlayıcı dakikasını iki ayrı kanıt olarak izler',()=>{
    const result=evaluateApprovedPlan(approved,[
      {actionId:'a',submittedAt:'2026-11-11T13:00:00Z'}
    ],[{startedAt:'2026-11-11T12:00:00Z',activeSeconds:1800}],now);
    expect(result.summary).toMatchObject({
      expectedCoachTasks:3,confirmedCoachTasks:1,missedCoachTasks:1,pendingCoachTasks:1,
      completedDays:2,observedFocusDays:1,unverifiedSuggestionBlocks:3
    });
    expect(result.days[0]).toMatchObject({
      plannedMinutes:90,observedFocusMinutes:30,coachConfirmed:1,suggestedBlocks:2
    });
    expect(result.days[1].observedFocusMinutes).toBeNull();
    expect(result.recommendations.some(x=>x.reason.includes('teslim kaydı'))).toBe(true);
  });
  it('koç iş akışındaki tamamlandı etiketi için değil gerçek teslim için sayar',()=>{
    const result=evaluateApprovedPlan(approved,[],[],now);
    expect(result.summary.confirmedCoachTasks).toBe(0);
    expect(result.summary.missedCoachTasks).toBe(2);
    expect(result.days[0].observedFocusMinutes).toBeNull();
    expect(result.recommendations.find(x=>x.priority==='HIGH')).toBeTruthy();
  });
  it('plan onayından önceki veya gelecekteki teslimleri kullanmaz',()=>{
    const result=evaluateApprovedPlan(approved,[
      {actionId:'a',submittedAt:'2026-11-09T12:00:00Z'},
      {actionId:'b',submittedAt:'2026-11-14T12:00:00Z'}
    ],[{startedAt:'2026-11-09T12:00:00Z',activeSeconds:3600}],now);
    expect(result.summary.confirmedCoachTasks).toBe(0);
    expect(result.summary.observedFocusDays).toBe(0);
  });
  it('çift plan satırları ve iki kez gelen teslimi tekrar saymaz',()=>{
    const plan={...approved,days:[{
      date:'2026-11-11T12:00:00Z',plannedMinutes:40,capacityMinutes:50,
      tasks:[{type:'COACH_ACTION',actionId:'a',duration:20},{type:'COACH_ACTION',actionId:'a',duration:20}]
    }]};
    const result=evaluateApprovedPlan(plan,[
      {actionId:'a',submittedAt:'2026-11-11T13:00:00Z'},
      {actionId:'a',submittedAt:'2026-11-11T13:00:00Z'}
    ],[],now);
    expect(result.summary.expectedCoachTasks).toBe(1);
    expect(result.summary.coachCompletionPercent).toBe(100);
  });
  it('geç teslimleri ve sıfır süre yerine eksik veri durumunu korur',()=>{
    const result=evaluateApprovedPlan(approved,[
      {actionId:'a',submittedAt:'2026-11-12T11:00:00Z',late:true},
      {actionId:'b',submittedAt:'2026-11-12T11:10:00Z',late:true}
    ],[],now);
    expect(result.summary.lateCoachTasks).toBe(2);
    expect(result.recommendations.some(x=>x.reason.includes('geç teslim'))).toBe(true);
    expect(result.days[0].observedFocusMinutes).toBeNull();
    expect(result.days[0].coachConfirmed).toBe(1);
  });
  it('onaylı koç görevi olmadan uydurma tamamlanma yüzdesi hesaplamaz',()=>{
    const plan={...approved,days:[{date:'2026-11-11T12:00:00Z',plannedMinutes:40,capacityMinutes:50,
      tasks:[{type:'REVIEW',duration:8},{type:'TOPIC',duration:32}]}]};
    const result=evaluateApprovedPlan(plan,[],[],now);
    expect(result.summary.expectedCoachTasks).toBe(0);
    expect(result.summary.coachCompletionPercent).toBeNull();
    expect(result.summary.unverifiedSuggestionBlocks).toBe(2);
  });
});
