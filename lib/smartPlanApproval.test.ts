import {describe,it,expect} from 'vitest';
import {compareWeeklyPlans,planPreviewDigest} from './smartPlanApproval';
const earlier={days:[
 {date:'2026-11-02T12:00:00Z',plannedMinutes:90,capacityMinutes:120,tasks:[
  {type:'COACH_ACTION',title:'Türkçe 20 soru',actionId:'a',duration:30},
  {type:'REVIEW',title:'2 tekrar',reviewIds:['r1','r2'],duration:8},
  {type:'TOPIC',title:'Ana düşünce',duration:52}
 ]},
 {date:'2026-11-03T12:00:00Z',plannedMinutes:60,capacityMinutes:120,tasks:[
  {type:'TOPIC',title:'Paragraf',duration:60}
 ]}
]};
const next={days:[
 {date:'2026-11-11T12:00:00Z',plannedMinutes:100,capacityMinutes:120,tasks:[
  {type:'COACH_ACTION',title:'Türkçe 20 soru',actionId:'a',duration:30},
  {type:'REVIEW',title:'3 tekrar',reviewIds:['r1','r2','r3'],duration:12},
  {type:'TOPIC',title:'Yeni konu',duration:58}
 ]},
 {date:'2026-11-12T12:00:00Z',plannedMinutes:70,capacityMinutes:100,tasks:[
  {type:'COACH_ACTION',title:'Matematik',actionId:'b',duration:30},
  {type:'TOPIC',title:'Dil bilgisi',duration:40}
 ]}
],prioritySummary:{pendingReviewCount:2,coachTasksNeedingDecision:[]}};
const active=[{id:'old',updatedAt:'2026-11-10T12:00:00Z'}];
describe('Koç haftalık plan önizleme ve onay güvenliği',()=>{
 it('gün ve görev sayısını eskiden yeniye karşılaştırır',()=>{
  const comparison=compareWeeklyPlans(earlier,next);
  expect(comparison.previous).toMatchObject({days:2,minutes:150,coachTasks:1,reviewQuestions:2});
  expect(comparison.proposed).toMatchObject({days:2,minutes:170,coachTasks:2,reviewQuestions:3});
  expect(comparison.deltaMinutes).toBe(20);
  expect(comparison.deltaCoachTasks).toBe(1);
  expect(comparison.addedTasks).toContain('Matematik');
  expect(comparison.removedTasks).toContain('Paragraf');
 });
 it('eski plan yoksa değişim uydurmaz',()=>{
  const comparison=compareWeeklyPlans(null,next);
  expect(comparison.previous).toBeNull();
  expect(comparison.deltaMinutes).toBeNull();
 });
 it('aktif plan sürümü veya önerilen görev değiştiğinde onay özeti değişir',()=>{
  const original=planPreviewDigest('s1',next,active);
  expect(original).toMatch(/^[a-f0-9]{64}$/);
  expect(planPreviewDigest('s1',next,[{id:'old',updatedAt:'2026-11-10T13:00:00Z'}])).not.toBe(original);
  expect(planPreviewDigest('s1',{...next,days:[{...next.days[0],plannedMinutes:101},next.days[1]]},active)).not.toBe(original);
  expect(planPreviewDigest('s2',next,active)).not.toBe(original);
 });
 it('aktif plan sıralaması, görevlerin sıra dışı gelmesiyle sahte sürüm farkı üretmez',()=>{
  const states=[...active,{id:'old2',updatedAt:'2026-11-11T10:00:00Z'}];
  expect(planPreviewDigest('s1',next,states)).toBe(planPreviewDigest('s1',next,[...states].reverse()));
 });
 it('tekrar kimlikleri ve sığmayan görev durumları korunan taslağın parçasıdır',()=>{
  const original=planPreviewDigest('s1',next,active);
  const changed={...next,prioritySummary:{...next.prioritySummary,pendingReviewCount:5}};
  expect(planPreviewDigest('s1',changed,active)).not.toBe(original);
  const reordered={...next,days:[{...next.days[0],tasks:[...next.days[0].tasks]} ,next.days[1]]};
  expect(planPreviewDigest('s1',reordered,active)).toBe(original);
 });
});
