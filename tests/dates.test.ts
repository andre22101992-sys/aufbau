import { describe, expect, it } from 'vitest';
import {
  addDays,
  diffDays,
  formatDuration,
  fromKey,
  nextWeekday,
  shoppingWeekStart,
  toKey,
  weekStart,
  weekday,
} from '../src/lib/dates';

describe('Datum', () => {
  it('wandelt Schlüssel hin und zurück', () => {
    expect(toKey(fromKey('2026-11-02'))).toBe('2026-11-02');
  });

  it('zählt Tage über die Zeitumstellung am 25.10.2026 richtig', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(diffDays('2026-10-26', '2026-10-24')).toBe(2);
    expect(diffDays('2027-03-29', '2027-03-27')).toBe(2);
  });

  it('kennt Wochentage und Wochenanfang', () => {
    expect(weekday('2026-10-30')).toBe(4); // Freitag
    expect(weekday('2026-11-02')).toBe(0); // Montag
    expect(weekStart('2026-11-01')).toBe('2026-10-26');
    expect(shoppingWeekStart('2026-11-02')).toBe('2026-10-31');
    expect(shoppingWeekStart('2026-10-31')).toBe('2026-10-31');
    expect(nextWeekday('2026-10-30', 0)).toBe('2026-11-02');
    expect(nextWeekday('2026-11-02', 0, false)).toBe('2026-11-09');
  });

  it('formatiert Dauer', () => {
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(3_723_000)).toBe('1:02:03');
  });
});
