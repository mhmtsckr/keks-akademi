import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {
  capacityDayFactor,
  inferEfficientStudyWindow,
  inferFocusDrop,
  recommendedFocusBlockMinutes
} from '@/lib/learningEngine';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

function session(day:number,hourUtc:number,minutes:number){
  const startedAt=new Date(Date.UTC(2026,8,day,hourUtc,0,0));
  return {
    startedAt,
    completedAt:new Date(startedAt.getTime()+minutes*60000),
    activeSeconds:minutes*60,
    durationMinutes:minutes
  };
}

function submission(day:number,hourUtc:number,minute:number,accuracy:number,totalQuestions=10){
  return {
    submittedAt:new Date(Date.UTC(2026,8,day,hourUtc,minute,0)),
    totalQuestions,
    accuracy
  };
}

describe('behavioral capacity learning',()=>{
  it('finds the most efficient two-hour window from observed performance, not declared intent',()=>{
    const sessions=[
      session(1,16,45),
      session(2,16,50),
      session(3,11,40)
    ];
    const submissions=[
      submission(1,16,50,88,20),
      submission(2,17,0,84,20),
      submission(3,11,45,62,20)
    ];
    const profile=inferEfficientStudyWindow(sessions,submissions);
    expect(profile.bestWindow).toBe('19.00–21.00');
    expect(profile.bestWindowAccuracy).toBeGreaterThanOrEqual(80);
  });

  it('detects an observational accuracy drop in sessions longer than 30 minutes',()=>{
    const sessions=[
      session(1,16,25),
      session(2,16,28),
      session(3,16,45),
      session(4,16,50)
    ];
    const submissions=[
      submission(1,16,30,88),
      submission(2,16,35,84),
      submission(3,16,50,68),
      submission(4,16,55,64)
    ];
    const drop=inferFocusDrop(sessions,submissions);
    expect(drop.afterMinutes).toBe(30);
    expect(drop.dropPoints).toBeGreaterThanOrEqual(8);
    expect(recommendedFocusBlockMinutes(drop.afterMinutes,[25,28,45,50])).toBe(25);
  });

  it('does not claim a focus drop without enough matched evidence',()=>{
    const drop=inferFocusDrop(
      [session(1,16,45)],
      [submission(1,16,50,60)]
    );
    expect(drop.afterMinutes).toBeNull();
    expect(drop.dropPoints).toBeNull();
  });

  it('reduces future workload on historically low-completion weekdays',()=>{
    const tuesday=new Date('2026-09-29T09:00:00Z');
    const factor=capacityDayFactor([{day:'Tue',completionRate:50}],tuesday);
    expect(factor).toBe(.75);
  });

  it('feeds learned capacity into daily and weekly plans',()=>{
    const engine=read('lib/learningEngine.ts');
    const coach=read('lib/smartCoach.ts');
    expect(engine).toContain('actualVsPlannedDeltaMinutes');
    expect(engine).toContain('recommendedFocusBlockMinutes');
    expect(engine).toContain('effectiveDailyBudget');
    expect(engine).toContain('capacityDayFactor(capacity.lowCompletionDays,now)');
    expect(coach).toContain('buildCapacityProfile(studentId)');
    expect(coach).toContain('recommendedWindow:capacity.bestWindow');
    expect(coach).toContain('historicalCompletion');
    expect(coach).toContain('capacityMinutes:dayBudget');
  });

  it('keeps behavioral profile visible to coach while student Today Plan stays action-only',()=>{
    const coachUi=read('app/components/CoachLearningIntelligence.tsx');
    const studentRoute=read('app/api/student/today/route.ts');
    expect(coachUi).toContain('Plan–gerçek farkı');
    expect(coachUi).toContain('Odak sinyali');
    expect(coachUi).toContain('En verimli zaman');
    expect(studentRoute).not.toContain('actualVsPlannedDeltaMinutes');
    expect(studentRoute).not.toContain('focusDropAfterMinutes');
  });
});
