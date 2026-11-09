import {describe,expect,it} from 'vitest';
import {dailyTaskDateKey,dailyTaskDeadline,dailyTaskStatus} from './dailyTaskStatus';

const taskDate=new Date('2026-11-09T00:00:00.000Z');
const periodEnd=new Date('2026-11-10T00:00:00.000Z');

describe('student daily tasks: server-only Istanbul deadline',()=>{
  it('uses the task date, not an end-of-period or browser clock',()=>{
    expect(dailyTaskDateKey(taskDate,periodEnd)).toBe('2026-11-09');
    expect(dailyTaskDeadline(taskDate,periodEnd).toISOString()).toBe('2026-11-09T20:00:00.000Z');
  });

  it('marks an explicit submission before 23:00 as completed',()=>{
    expect(dailyTaskStatus({taskDate,periodEnd,submittedAt:new Date('2026-11-09T19:59:59.999Z')},
      new Date('2026-11-11T15:00:00Z'))).toBe('COMPLETED');
  });

  it('marks submissions at 23:00 and after as late completed',()=>{
    expect(dailyTaskStatus({taskDate,periodEnd,submittedAt:new Date('2026-11-09T20:00:00.000Z')})).toBe('LATE_COMPLETED');
    expect(dailyTaskStatus({taskDate,periodEnd,submittedAt:new Date('2026-11-10T09:15:00.000Z')})).toBe('LATE_COMPLETED');
  });

  it('does not complete tasks without a persisted student report',()=>{
    expect(dailyTaskStatus({taskDate,periodEnd,submittedAt:null},
      new Date('2026-11-09T16:00:00Z'))).toBe('INCOMPLETE');
    expect(dailyTaskStatus({taskDate,periodEnd,submittedAt:null},
      new Date('2026-11-12T16:00:00Z'))).toBe('INCOMPLETE');
  });

  it('shows a future task as upcoming, not missing',()=>{
    expect(dailyTaskStatus({taskDate,periodEnd,submittedAt:null},
      new Date('2026-11-08T18:00:00Z'))).toBe('UPCOMING');
  });

  it('uses the period end only for unscheduled legacy tasks',()=>{
    expect(dailyTaskDeadline(null,periodEnd).toISOString()).toBe('2026-11-10T20:00:00.000Z');
  });
});
