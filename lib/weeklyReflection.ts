import { db } from '@/lib/db';

function istanbulDateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function dateFromKey(key: string) {
  return new Date(key + 'T00:00:00+03:00');
}

function addDaysKey(key: string, days: number) {
  const noon = new Date(key + 'T12:00:00Z');
  noon.setUTCDate(noon.getUTCDate() + days);
  return noon.toISOString().slice(0, 10);
}

export function getIstanbulWeekWindow(now = new Date()) {
  const key = istanbulDateKey(now);
  const weekday = new Date(key + 'T12:00:00Z').getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const startKey = addDaysKey(key, mondayOffset);
  const nextKey = addDaysKey(startKey, 7);
  return {
    todayKey: key,
    weekStart: dateFromKey(startKey),
    weekEndExclusive: dateFromKey(nextKey),
    isSunday: weekday === 0
  };
}

export async function buildWeeklyPerformanceSnapshot(studentId: string, now = new Date()) {
  const { weekStart, weekEndExclusive } = getIstanbulWeekWindow(now);

  const [actions, sessions] = await Promise.all([
    db.coachingAction.findMany({
      where: {
        studentId,
        taskDate: { gte: weekStart, lt: weekEndExclusive }
      },
      select: {
        taskDate: true,
        status: true,
        submission: { select: { submittedAt: true } }
      }
    }),
    db.techniqueSession.findMany({
      where: {
        studentId,
        createdAt: { gte: weekStart, lt: weekEndExclusive }
      },
      select: { createdAt: true, activeSeconds: true }
    })
  ]);

  const completedTasks = actions.filter(x => x.submission || x.status === 'COMPLETED').length;
  const taskCompletionRate = actions.length
    ? Math.round((completedTasks / actions.length) * 100)
    : 0;

  const activeDays = new Set<string>();
  for (const action of actions) {
    if (action.submission) activeDays.add(istanbulDateKey(action.submission.submittedAt));
  }
  for (const session of sessions) {
    if ((session.activeSeconds || 0) > 0) activeDays.add(istanbulDateKey(session.createdAt));
  }

  const focusMinutes = Math.round(
    sessions.reduce((sum, x) => sum + (x.activeSeconds || 0), 0) / 60
  );

  return {
    weekStart: weekStart.toISOString(),
    activeDays: activeDays.size,
    totalTasks: actions.length,
    completedTasks,
    taskCompletionRate,
    focusMinutes
  };
}

export function buildReflectionComparison(input: {
  selfRating: number;
  planRealistic: number;
  snapshot: {
    activeDays: number;
    taskCompletionRate: number;
    focusMinutes: number;
  };
}) {
  const { selfRating, planRealistic, snapshot } = input;
  const perceivedPercent = selfRating * 20;
  const behaviorPercent = Math.round(
    snapshot.taskCompletionRate * 0.7 + (Math.min(snapshot.activeDays, 7) / 7) * 100 * 0.3
  );
  const perceptionGap = perceivedPercent - behaviorPercent;

  let alignment: 'UYUMLU' | 'KENDINI_YUKSEK_DEGERLENDIRIYOR' | 'KENDINI_DUSUK_DEGERLENDIRIYOR';
  if (Math.abs(perceptionGap) <= 15) alignment = 'UYUMLU';
  else if (perceptionGap > 15) alignment = 'KENDINI_YUKSEK_DEGERLENDIRIYOR';
  else alignment = 'KENDINI_DUSUK_DEGERLENDIRIYOR';

  return {
    perceivedPercent,
    behaviorPercent,
    perceptionGap,
    alignment,
    planRealistic,
    taskCompletionRate: snapshot.taskCompletionRate,
    activeDays: snapshot.activeDays,
    focusMinutes: snapshot.focusMinutes
  };
}
