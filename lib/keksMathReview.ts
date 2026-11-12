/** Fixed calendar-day repetition schedule used by KEKS Matematik only.
 * Index 0 is an immediately due error/blank review. Subsequent marks are
 * day 1, 3, 7, 14 and 28. Other KEKS subjects retain their adaptive policy. */
export const KEKS_MATH_DAYS = [0, 1, 3, 7, 14, 28] as const;

export function isKeksMathQuestion(sourceKind: string) {
  return sourceKind.startsWith('KEKS_MAT_2026:');
}

export function nextKeksMathReview(stepIndex: number, correct: boolean) {
  const stage = Math.max(0, Math.min(5, Math.trunc(stepIndex || 0)));
  if (!correct) {
    return { stepIndex: 0, completed: false, nextIntervalDays: 0 };
  }
  const next = stage + 1;
  if (next >= KEKS_MATH_DAYS.length) {
    return { stepIndex: KEKS_MATH_DAYS.length, completed: true, nextIntervalDays: null };
  }
  return { stepIndex: next, completed: false,
    nextIntervalDays: KEKS_MATH_DAYS[next] - KEKS_MATH_DAYS[stage] };
}

/** Schedule at 09:00 in Istanbul on the target calendar day, irrespective of
 * the server's TZ. Istanbul currently uses UTC+3 year-round. */
export function keksMathDueAt(now: Date, days: number) {
  if (days === 0) return new Date(now);
  const parts = new Intl.DateTimeFormat('en-GB',{
    timeZone: 'Europe/Istanbul',year: 'numeric',month: '2-digit',day: '2-digit'
  }).formatToParts(now);
  const part = (key: string) => Number(parts.find(p => p.type === key)?.value || 0);
  return new Date(Date.UTC(part('year'),part('month')-1,part('day')+days,6));
}
