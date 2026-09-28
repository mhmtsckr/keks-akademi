import { describe, expect, it } from 'vitest';
import { buildReflectionComparison, getIstanbulWeekWindow } from './weeklyReflection';

describe('weekly reflection', () => {
  it('opens the reflection window on Sunday in Europe/Istanbul', () => {
    const sunday = getIstanbulWeekWindow(new Date('2026-09-27T12:00:00Z'));
    expect(sunday.isSunday).toBe(true);
    expect(sunday.weekStart.toISOString()).toBe('2026-09-20T21:00:00.000Z');

    const monday = getIstanbulWeekWindow(new Date('2026-09-28T12:00:00Z'));
    expect(monday.isSunday).toBe(false);
    expect(monday.weekStart.toISOString()).toBe('2026-09-27T21:00:00.000Z');
  });

  it('flags a large positive perception gap without turning it into a success score', () => {
    const result = buildReflectionComparison({
      selfRating: 5,
      planRealistic: 4,
      snapshot: {
        activeDays: 2,
        taskCompletionRate: 35,
        focusMinutes: 90
      }
    });

    expect(result.alignment).toBe('KENDINI_YUKSEK_DEGERLENDIRIYOR');
    expect(result.planRealistic).toBe(4);
    expect(result.taskCompletionRate).toBe(35);
    expect(result.activeDays).toBe(2);
  });

  it('recognizes broadly aligned self assessment and behavior', () => {
    const result = buildReflectionComparison({
      selfRating: 4,
      planRealistic: 4,
      snapshot: {
        activeDays: 6,
        taskCompletionRate: 82,
        focusMinutes: 420
      }
    });

    expect(result.alignment).toBe('UYUMLU');
  });
});
