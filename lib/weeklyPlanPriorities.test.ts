import {describe,expect,it} from 'vitest';
import {allocateWeeklyPriorities,type CoachAssignedWork} from './weeklyPlanPriorities';
const dates=[
  {key:'2026-11-11',budgetMinutes:45},
  {key:'2026-11-12',budgetMinutes:45},
  {key:'2026-11-13',budgetMinutes:45}
];
const coach=(id:string,key:string,targetValue=20,metricType='MINUTES'):CoachAssignedWork=>({
  id,title:'Konuyu bitir',subject:'Türkçe',topic:'Ana düşünce',metricType,targetValue,
  taskDate:new Date(key+'T09:00:00+03:00'),periodEnd:new Date(key+'T22:59:00+03:00')
});
const review=(id:string,day:string)=>({id,dueAt:new Date(day+'T11:00:00+03:00')});
describe('Akıllı Kişisel Çalışma Planı · zorunlu öncelikler',()=>{
  it('koç atamasını aynı güne yazar, tekrarları kalan dakikalara sığdırır',()=>{
    const p=allocateWeeklyPriorities(dates,[coach('c1','2026-11-11',30)],[review('r1','2026-11-11'),review('r2','2026-11-11')]);
    expect(p.byDay['2026-11-11'].reservedMinutes).toBe(38);
    expect(p.byDay['2026-11-11'].tasks.map(x=>x.type)).toEqual(['COACH_ACTION','REVIEW']);
    expect(p.allocatedReviewCount).toBe(2);
    expect(p.pendingReviewCount).toBe(0);
  });
  it('koçun 90 dakikalık görevini 45 dakikaya sığdırmış gibi göstermez',()=>{
    const p=allocateWeeklyPriorities(dates,[coach('heavy','2026-11-11',90)],[review('r1','2026-11-11')]);
    expect(p.unallocatedCoachTasks).toHaveLength(1);
    expect(p.unallocatedCoachTasks[0].scheduledFor).toBe('2026-11-11');
    expect(p.byDay['2026-11-11'].tasks.some(x=>x.type==='COACH_ACTION')).toBe(false);
    expect(p.byDay['2026-11-11'].reservedMinutes).toBeLessThanOrEqual(45);
  });
  it('tekrarları bir kere ve en erken tarihi geldikten sonra dağıtır',()=>{
    const reviews=Array.from({length:12},(_,i)=>review('r'+i,'2026-11-12'));
    const p=allocateWeeklyPriorities(dates,[],reviews);
    expect(p.byDay['2026-11-11'].tasks).toHaveLength(0);
    expect(p.byDay['2026-11-12'].tasks.flatMap(x=>x.reviewIds||[])).toHaveLength(8);
    expect(p.byDay['2026-11-13'].tasks.flatMap(x=>x.reviewIds||[])).toHaveLength(4);
    expect(p.allocatedReviewCount).toBe(12);
  });
  it('süresi dolmuş tekrarları sonraki güne önerirken gerçek son tarihi değiştirmez',()=>{
    const p=allocateWeeklyPriorities(dates,[],[review('old','2026-11-09')]);
    expect(p.byDay['2026-11-11'].tasks[0].reviewIds).toEqual(['old']);
    expect(p.byDay['2026-11-11'].tasks[0].reason).toContain('değiştirilmedi');
  });
  it('tekrar bakiyesi görünür kalır, sessizce tamamlandı sayılmaz',()=>{
    const days=[{key:'2026-11-11',budgetMinutes:30}];
    const reviews=Array.from({length:20},(_,i)=>review('r'+i,'2026-11-09'));
    const p=allocateWeeklyPriorities(days,[],reviews);
    expect(p.allocatedReviewCount).toBe(7); // 4 + 3 due to 30-min cap
    expect(p.pendingReviewCount).toBe(13);
    expect(p.byDay['2026-11-11'].reservedMinutes).toBe(28);
  });
  it('aynı referanslı görevleri ve tekrarları iki kez saymaz',()=>{
    const p=allocateWeeklyPriorities(dates,[coach('same','2026-11-11'),coach('same','2026-11-11')],[review('dup','2026-11-11'),review('dup','2026-11-11')]);
    expect(p.byDay['2026-11-11'].tasks.filter(x=>x.actionId==='same')).toHaveLength(1);
    expect(p.allocatedReviewCount).toBe(1);
  });
});
