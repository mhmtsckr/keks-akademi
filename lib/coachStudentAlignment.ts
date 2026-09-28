export type AlignmentInputs = {
  assignedTasks: number;
  completedTasks: number;
  expectedSessions: number;
  completedSessions: number;
  planRatings: number[];
};

export function summarizeCoachStudentAlignment(input: AlignmentInputs) {
  const unfinishedTasks = Math.max(0, input.assignedTasks - input.completedTasks);
  const incompleteSessions = Math.max(0, input.expectedSessions - input.completedSessions);
  const taskApplicationRate = input.assignedTasks
    ? Math.round((input.completedTasks / input.assignedTasks) * 100)
    : null;

  const realisticWeeks = input.planRatings.filter(x => x >= 4).length;
  const partialWeeks = input.planRatings.filter(x => x === 3).length;
  const difficultWeeks = input.planRatings.filter(x => x <= 2).length;

  return {
    tasks: {
      assigned: input.assignedTasks,
      completed: input.completedTasks,
      unfinished: unfinishedTasks,
      applicationRate: taskApplicationRate
    },
    sessions: {
      expected: input.expectedSessions,
      completed: input.completedSessions,
      incomplete: incompleteSessions
    },
    plan: {
      answeredWeeks: input.planRatings.length,
      realisticWeeks,
      partialWeeks,
      difficultWeeks
    }
  };
}
