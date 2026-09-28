import {describe,expect,it} from 'vitest';
import {buildCoachCohorts} from './coachCohortAnalytics';

const now=new Date('2026-09-28T12:00:00Z');

describe('coach cohort analytics',()=>{
  it('groups students by concrete signals',()=>{
    const result=buildCoachCohorts([
      {
        id:'1',fullName:'A',studentCode:'001',overdueReviews:6,
        currentAccuracy:72,previousAccuracy:60,currentQuestions:40,previousQuestions:35,
        currentTaskCompletion:80,previousTaskCompletion:55,
        lastActivityAt:'2026-09-28T08:00:00Z',completedOrScheduledSessionThisWeek:false
      },
      {
        id:'2',fullName:'B',studentCode:'002',overdueReviews:4,
        currentAccuracy:48,previousAccuracy:60,currentQuestions:30,previousQuestions:30,
        currentTaskCompletion:40,previousTaskCompletion:70,
        lastActivityAt:'2026-09-18T08:00:00Z',completedOrScheduledSessionThisWeek:false
      }
    ],now);

    expect(result.repeatDelayers[0].fullName).toBe('A');
    expect(result.fastestImproving[0].fullName).toBe('A');
    expect(result.inactive[0].fullName).toBe('B');
    expect(result.meetingNeeded[0].fullName).toBe('B');
    expect(result.meetingNeeded[0].signal).toContain('7+ gündür aktivite yok');
  });

  it('does not call low-evidence accuracy movement a fast improvement',()=>{
    const result=buildCoachCohorts([{
      id:'3',fullName:'C',studentCode:'003',overdueReviews:0,
      currentAccuracy:90,previousAccuracy:40,currentQuestions:4,previousQuestions:5,
      currentTaskCompletion:null,previousTaskCompletion:null,
      lastActivityAt:'2026-09-28T08:00:00Z',completedOrScheduledSessionThisWeek:false
    }],now);
    expect(result.fastestImproving).toHaveLength(0);
  });
});
