import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, unlockedAchievements, weekDates, type AchievementContext } from '../src/lib/achievements';
import type { Workout } from '../src/lib/model';

const base: AchievementContext = {
  today: '2026-11-10',
  startDate: '2026-11-02',
  workouts: [],
  weights: [],
  mealDays: [],
  receipts: 0,
  checkins: 0,
  scale: 0,
  lightDays: 0,
};

const day = (date: string, meals: number) => ({ date, done: Object.fromEntries(Array.from({ length: meals }, (_, i) => [`m${i}`, 1])), extras: [] });

const workout = (date: string, dayId: Workout['dayId'], extra: Partial<Workout> = {}): Workout => ({
  id: `${date}-${dayId}`,
  date,
  dayId,
  blockId: 'block-1',
  startedAt: 1,
  finishedAt: 2,
  mode: 'normal',
  exercises: [],
  ...extra,
});

describe('Erfolge', () => {
  it('schaltet nichts frei, solange nichts passiert ist', () => {
    expect(unlockedAchievements(base).size).toBe(0);
  });

  it('feiert regelmäßiges Essen: guter Tag, drei in Folge, starke Woche', () => {
    const three = ['2026-11-03', '2026-11-04', '2026-11-05'].map((d) => day(d, 4));
    const few = unlockedAchievements({ ...base, mealDays: [day('2026-11-03', 3), day('2026-11-04', 2)] });
    expect(few.has('essen-tag')).toBe(false);
    const ok = unlockedAchievements({ ...base, mealDays: three });
    expect(ok.has('essen-tag') && ok.has('essen-3-folge')).toBe(true);
    expect(ok.has('essen-woche')).toBe(false);
    const week = unlockedAchievements({ ...base, mealDays: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06', '2026-11-07'].map((d) => day(d, 5)) });
    expect(week.has('essen-woche')).toBe(true);
    expect(week.has('essen-3-folge')).toBe(true);
  });

  it('braucht für „drei in Folge“ wirklich aufeinanderfolgende Tage', () => {
    const apart = unlockedAchievements({ ...base, mealDays: ['2026-11-02', '2026-11-04', '2026-11-06'].map((d) => day(d, 4)) });
    expect(apart.has('essen-3-folge')).toBe(false);
  });

  it('belohnt den leichten Tag und den ersten Bon', () => {
    const done = unlockedAchievements({ ...base, lightDays: 1, receipts: 1 });
    expect(done.has('essen-leicht') && done.has('essen-bon')).toBe(true);
  });

  it('zählt Trainings, volle Wochen und besondere Stufen', () => {
    const week = (['mo', 'di', 'mi', 'do', 'fr'] as const).map((d, i) => workout(`2026-11-0${2 + i}`, d));
    const hard = workout('2026-11-09', 'mo', {
      exercises: [
        { slotIndex: 0, exerciseId: 'liegestuetze', sets: [{ load: { kind: 'level', level: 1 }, reps: 8, done: true }] },
        { slotIndex: 1, exerciseId: 'rudern', sets: [{ load: { kind: 'kg', kg: 11.3 }, reps: 8, done: true }] },
      ],
    });
    const unlocked = unlockedAchievements({ ...base, workouts: [...week, hard] });
    for (const id of ['training-1', 'training-woche', 'liegestuetze-boden', 'rudern-11']) expect(unlocked.has(id), id).toBe(true);
    expect(unlocked.has('training-10')).toBe(false);
    const undone = workout('2026-11-09', 'mo', { exercises: [{ slotIndex: 0, exerciseId: 'rudern', sets: [{ load: { kind: 'kg', kg: 11.3 }, reps: 8, done: false }] }] });
    expect(unlockedAchievements({ ...base, workouts: [undone] }).has('rudern-11')).toBe(false);
  });

  it('misst die Gewichtszunahme am Trend, nicht am Tageswert', () => {
    const weights = Array.from({ length: 40 }, (_, i) => ({ date: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`, kg: 56 + i * 0.1 }));
    const spike = [{ date: '2026-11-01', kg: 56 }, { date: '2026-11-02', kg: 58.5 }];
    expect(unlockedAchievements({ ...base, weights: spike }).has('gewicht-2')).toBe(false);
    expect(weights.length).toBeGreaterThan(0);
    const steady = Array.from({ length: 60 }, (_, i) => ({ date: new Date(2026, 9, 1 + i).toISOString().slice(0, 10), kg: 56 + i * 0.1 }));
    const unlocked = unlockedAchievements({ ...base, weights: steady });
    expect(unlocked.has('gewicht-1')).toBe(true);
  });

  it('hat für jede Definition eine eindeutige ID', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it('zeigt für die Wochenringe die Tage der Woche bis heute', () => {
    expect(weekDates('2026-11-04')).toEqual(['2026-11-02', '2026-11-03', '2026-11-04']);
  });
});
