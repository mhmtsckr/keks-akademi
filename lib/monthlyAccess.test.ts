import { describe, expect, it } from 'vitest';
import { turkeyMonthWindow } from './monthlyAccess';

// Pencere sınırları Europe/Istanbul (UTC+3) ayının ilk gününün 00:00'ıdır;
// UTC'de bu, bir önceki günün 21:00'ine denk gelir.

describe('turkeyMonthWindow', () => {
  it('ay ortasında doğru pencereyi verir', () => {
    const w = turkeyMonthWindow(new Date('2026-09-15T12:00:00Z'));
    expect(w.year).toBe(2026);
    expect(w.month).toBe(9);
    expect(w.key).toBe('2026-09');
    expect(w.start.toISOString()).toBe('2026-08-31T21:00:00.000Z');
    expect(w.end.toISOString()).toBe('2026-09-30T21:00:00.000Z');
  });

  it('ayı UTC tarihine değil İstanbul tarihine göre seçer', () => {
    // 30 Eylül 21:00 UTC = 1 Ekim 00:00 İstanbul → ekim penceresi başlamalı
    const w = turkeyMonthWindow(new Date('2026-09-30T21:00:00Z'));
    expect(w.month).toBe(10);
    expect(w.key).toBe('2026-10');
    expect(w.start.toISOString()).toBe('2026-09-30T21:00:00.000Z');
  });

  it('sınırın bir saniye öncesinde hâlâ önceki aydadır', () => {
    // 30 Eylül 20:59:59 UTC = 30 Eylül 23:59:59 İstanbul
    const w = turkeyMonthWindow(new Date('2026-09-30T20:59:59Z'));
    expect(w.month).toBe(9);
    expect(w.key).toBe('2026-09');
  });

  it('aralıktan ocağa yıl geçişini doğru yapar', () => {
    const w = turkeyMonthWindow(new Date('2026-12-20T00:00:00Z'));
    expect(w.year).toBe(2026);
    expect(w.month).toBe(12);
    expect(w.key).toBe('2026-12');
    expect(w.end.toISOString()).toBe('2026-12-31T21:00:00.000Z');
  });

  it('ocak penceresi bir önceki yılın son gününde başlar', () => {
    const w = turkeyMonthWindow(new Date('2026-01-10T12:00:00Z'));
    expect(w.key).toBe('2026-01');
    expect(w.start.toISOString()).toBe('2025-12-31T21:00:00.000Z');
    expect(w.end.toISOString()).toBe('2026-01-31T21:00:00.000Z');
  });

  it('tek haneli ayı sıfırla doldurur', () => {
    expect(turkeyMonthWindow(new Date('2026-03-10T12:00:00Z')).key).toBe('2026-03');
  });

  it('şubatın kısa uzunluğunu doğru yansıtır', () => {
    const w = turkeyMonthWindow(new Date('2026-02-10T12:00:00Z'));
    const gun = (w.end.getTime() - w.start.getTime()) / 86_400_000;
    expect(gun).toBe(28);
  });

  it('verilen an her zaman [start, end) aralığındadır', () => {
    for (const iso of [
      '2026-01-01T00:00:00Z',
      '2026-06-15T09:30:00Z',
      '2026-09-30T20:59:59Z',
      '2026-12-31T23:59:59Z',
    ]) {
      const now = new Date(iso);
      const w = turkeyMonthWindow(now);
      expect(w.start.getTime()).toBeLessThanOrEqual(now.getTime());
      expect(w.end.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('argümansız çağrıda şimdiki anı kullanır', () => {
    const now = Date.now();
    const w = turkeyMonthWindow();
    expect(w.start.getTime()).toBeLessThanOrEqual(now);
    expect(w.end.getTime()).toBeGreaterThan(now);
  });
});
