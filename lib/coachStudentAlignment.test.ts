import { describe, expect, it } from 'vitest';
import { summarizeCoachStudentAlignment } from './coachStudentAlignment';

describe('coach-student alignment signals', () => {
  it('returns concrete task, session and plan signals without a composite score', () => {
    const result = summarizeCoachStudentAlignment({
      assignedTasks: 18,
      completedTasks: 13,
      expectedSessions: 4,
      completedSessions: 3,
      planRatings: [4, 5, 3, 2]
    });

    expect(result.tasks).toEqual({
      assigned: 18,
      completed: 13,
      unfinished: 5,
      applicationRate: 72
    });
    expect(result.sessions).toEqual({
      expected: 4,
      completed: 3,
      incomplete: 1
    });
    expect(result.plan).toEqual({
      answeredWeeks: 4,
      realisticWeeks: 2,
      partialWeeks: 1,
      difficultWeeks: 1
    });
    expect(result).not.toHaveProperty('score');
  });
});
