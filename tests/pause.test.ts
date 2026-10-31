import { describe, expect, it } from 'vitest';
import { COMEBACK_DAYS, activePause, endPause, isPausedOn, pauseDays, startPause, steeringOnHold, type Pause } from '../src/lib/pause';
import { weekOverview } from '../src/lib/week';
import { trainingStreak } from '../src/lib/streaks';
import { withDefaults } from '../src/lib/model';

describe('Pause-Modus', () => {
  it('startet und beendet eine Pause und merkt sich die Zeit', () => {
    const started = startPause([], 'krank', '2026-11-03');
    expect(activePause(started)?.reason).toBe('krank');
    expect(startPause(started, 'urlaub', '2026-11-04')).toBe(started);
    const short = endPause(started, '2026-11-06');
    expect(short.pauses[0]).toEqual({ from: '2026-11-03', to: '2026-11-05', reason: 'krank' });
    expect(short.comeback).toBe(false);
    expect(activePause(short.pauses)).toBeNull();
  });

  it('schlägt nach einer Pause von mindestens einer Woche eine leichtere Woche vor', () => {
    const long = endPause(startPause([], 'urlaub', '2026-11-02'), '2026-11-02');
    expect(long.pauses[0].to).toBe('2026-11-02');
    const week = endPause(startPause([], 'krank', '2026-11-02'), `2026-11-${String(2 + COMEBACK_DAYS).padStart(2, '0')}`);
    expect(week.comeback).toBe(true);
  });

  it('weiß, welche Tage pausiert sind', () => {
    const pauses: Pause[] = [{ from: '2026-11-03', to: '2026-11-05', reason: 'krank' }, { from: '2026-11-20', to: null, reason: 'urlaub' }];
    expect(isPausedOn(pauses, '2026-11-02')).toBe(false);
    expect(isPausedOn(pauses, '2026-11-03')).toBe(true);
    expect(isPausedOn(pauses, '2026-11-05')).toBe(true);
    expect(isPausedOn(pauses, '2026-11-06')).toBe(false);
    expect(isPausedOn(pauses, '2026-12-31')).toBe(true);
    expect(pauseDays(pauses[0], '2026-11-30')).toBe(3);
  });

  it('hält die Steuerung während der Pause und 14 Tage danach an', () => {
    const ended: Pause[] = [{ from: '2026-11-03', to: '2026-11-05', reason: 'krank' }];
    expect(steeringOnHold(ended, '2026-11-12')).toBe(true);
    expect(steeringOnHold(ended, '2026-11-19')).toBe(false);
    expect(steeringOnHold([{ from: '2026-11-03', to: null, reason: 'urlaub' }], '2026-12-31')).toBe(true);
    expect(steeringOnHold([], '2026-11-12')).toBe(false);
  });

  it('zählt pausierte Tage weder als verpasst noch gegen die Serie', () => {
    const paused = (d: string) => d >= '2026-11-03' && d <= '2026-11-06';
    const week = weekOverview('2026-11-07', '2026-11-02', [], paused);
    expect(week.map((d) => d.state)).toEqual(['missed', 'paused', 'paused', 'paused', 'paused']);
    const workouts = ['2026-11-02'];
    expect(trainingStreak(workouts, '2026-11-02', '2026-11-07', paused).count).toBe(1);
    expect(trainingStreak(workouts, '2026-11-02', '2026-11-07').count).toBeLessThan(1 + 0.5);
  });

  it('ergänzt ältere Einstellungen ohne Pausen', () => {
    expect(withDefaults({ onboarded: true }).pauses).toEqual([]);
  });
});
