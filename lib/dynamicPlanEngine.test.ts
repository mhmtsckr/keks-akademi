import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {allocateCarryoverCapacityAware} from '@/lib/learningEngine';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

function day(offset:number){
  const d=new Date(Date.UTC(2026,8,29));
  d.setUTCDate(d.getUTCDate()+offset);
  return d;
}

describe('dynamic capacity-aware study plan',()=>{
  it('spreads a missed 40-question task instead of dumping it into the next day',()=>{
    const result=allocateCarryoverCapacityAware({
      remaining:40,
      unitMinutes:2,
      days:[
        {date:day(0),dailyBudgetMinutes:120,existingLoadMinutes:0,completionRate:100},
        {date:day(1),dailyBudgetMinutes:120,existingLoadMinutes:0,completionRate:100},
        {date:day(2),dailyBudgetMinutes:120,existingLoadMinutes:0,completionRate:100},
        {date:day(3),dailyBudgetMinutes:120,existingLoadMinutes:0,completionRate:100}
      ]
    });

    expect(result.unallocated).toBe(0);
    expect(result.allocations.map(x=>x.value)).toEqual([15,15,10]);
    expect(Math.max(...result.allocations.map(x=>x.value))).toBeLessThan(40);
  });

  it('reduces carryover load on historically low-completion weekdays',()=>{
    const result=allocateCarryoverCapacityAware({
      remaining:40,
      unitMinutes:2,
      days:[
        {date:day(0),dailyBudgetMinutes:120,existingLoadMinutes:0,completionRate:45},
        {date:day(1),dailyBudgetMinutes:120,existingLoadMinutes:0,completionRate:100},
        {date:day(2),dailyBudgetMinutes:120,existingLoadMinutes:0,completionRate:100}
      ]
    });

    expect(result.allocations.map(x=>x.value)).toEqual([10,15,15]);
    expect(result.unallocated).toBe(0);
  });

  it('respects existing daily load and never forces overflow into the last day',()=>{
    const result=allocateCarryoverCapacityAware({
      remaining:20,
      unitMinutes:2,
      days:[
        {date:day(0),dailyBudgetMinutes:120,existingLoadMinutes:115,completionRate:100},
        {date:day(1),dailyBudgetMinutes:120,existingLoadMinutes:120,completionRate:100}
      ]
    });

    expect(result.allocations.map(x=>x.value)).toEqual([2]);
    expect(result.unallocated).toBe(18);
  });

  it('runs rebalancing before morning snapshot generation and on-demand fallback',()=>{
    const engine=read('lib/learningEngine.ts');
    const route=read('app/api/student/today/route.ts');

    expect(engine).toContain('await rebalanceMissedTasksCapacityAware(student.id,now)');
    expect(engine).toContain("await isFeatureEnabled('TODAY_PLAN',student.studentCode)");
    expect(route).toContain('await rebalanceMissedTasksCapacityAware(context.studentId)');
    expect(route.indexOf('rebalanceMissedTasksCapacityAware(context.studentId)'))
      .toBeLessThan(route.indexOf('ensureTodayLearningPlan(context.studentId)'));
  });

  it('uses a bounded carryover share and leaves unallocatable work for later retry',()=>{
    const engine=read('lib/learningEngine.ts');
    expect(engine).toContain('maxCarryoverShare:.25');
    expect(engine).toContain('unallocated:distribution.unallocated');
    expect(engine).not.toContain('last.value+=left');
    expect(engine).toContain("status:'RESCHEDULED'");
    expect(engine).toContain("reason:'CAPACITY_AWARE_MISSED'");
  });

  it('publishes the dynamic engine version while keeping student API simple',()=>{
    const engine=read('lib/learningEngine.ts');
    const route=read('app/api/student/today/route.ts');
    expect(engine).toContain("engineVersion:'TODAY_PLAN_V4_DYNAMIC'");
    expect(route).not.toContain('policy:');
    expect(route).not.toContain('deferred:');
    expect(route).not.toContain('capacity:');
  });
});
