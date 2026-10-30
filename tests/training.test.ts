import { describe, expect, it } from 'vitest';
import { BLOCKS, BLOCK_1, BLOCK_2 } from '../src/data/blocks';
import { EXERCISES, START_LOADS, getExercise } from '../src/data/exercises';
import { DAY_IDS, MUSCLES, type Slot } from '../src/data/types';
import { deloadAdvice, isStagnating } from '../src/lib/blocks';
import { buildLadder, rungIndexOf, startRung } from '../src/lib/ladder';
import type { ExerciseLog, Workout } from '../src/lib/model';
import { MUSCLE_RANGES, plannedMuscleSets, rangeStatus } from '../src/lib/muscles';
import { blockForWeek, deloadVersion, plannedDay, resolveSlots, shortVersion, swapKey, weekNumber } from '../src/lib/plan';
import { suggestNext } from '../src/lib/progression';
import { findRecords } from '../src/lib/records';
import { dailyStreak, trainingStreak } from '../src/lib/streaks';
import { estimateMinutes, estimateSeconds, groupSlots, restAfterSet } from '../src/lib/supersets';
import { alternativesFor, worksSameMuscle } from '../src/lib/swap';

const STEPS = [2.3, 4.5, 6.8, 9.1, 11.3];
const slot = (exerciseId: string, sets: number, min: number, max: number): Slot => ({ exerciseId, sets, min, max, restSec: 60 });
const kgLog = (exerciseId: string, kg: number, reps: number[]): ExerciseLog => ({
  slotIndex: 0,
  exerciseId,
  sets: reps.map((r) => ({ load: { kind: 'kg', kg }, reps: r, done: true })),
});

describe('Inhalte', () => {
  it('kennt jede Übung aus den Blöcken, ihre Alternativen und ein Startgewicht', () => {
    for (const block of BLOCKS) for (const day of DAY_IDS) for (const s of block.days[day].slots) expect(() => getExercise(s.exerciseId)).not.toThrow();
    for (const e of EXERCISES) {
      expect(START_LOADS[e.id], e.id).toBeDefined();
      if (e.harder) expect(() => getExercise(e.harder!)).not.toThrow();
      for (const a of e.alternatives) expect(() => getExercise(a)).not.toThrow();
    }
  });

  it('stellt Supersatz-Partner direkt hintereinander', () => {
    for (const block of BLOCKS) {
      for (const day of DAY_IDS) {
        const slots = block.days[day].slots;
        const letters = slots.map((s) => s.superset).filter(Boolean);
        for (const letter of new Set(letters)) {
          const idx = slots.flatMap((s, i) => (s.superset === letter ? [i] : []));
          expect(idx, `${block.id} ${day} ${letter}`).toHaveLength(2);
          expect(idx[1] - idx[0]).toBe(1);
        }
      }
    }
  });
});

describe('Stufen-Leiter und Steigerung', () => {
  const rudern = getExercise('rudern');
  const ladder = buildLadder(rudern, STEPS);
  const s = slot('rudern', 3, 8, 15);

  it('hat 5 Hantelstufen und 2 Technik-Stufen', () => {
    expect(ladder.map((r) => r.label)).toEqual(['2,3 kg', '4,5 kg', '6,8 kg', '9,1 kg', '11,3 kg', '11,3 kg langsam', '11,3 kg mit Pause']);
    expect(buildLadder(getExercise('bulgarische'), STEPS)[0].label).toBe('ohne Gewicht');
  });

  it('beginnt mit dem Startgewicht', () => {
    const start = startRung(ladder, START_LOADS.rudern);
    expect(ladder[start].label).toBe('6,8 kg');
    expect(suggestNext(rudern, s, ladder, [], start).kind).toBe('start');
  });

  it('geht hoch, wenn alle Sätze am oberen Ende sind', () => {
    const next = suggestNext(rudern, s, ladder, [kgLog('rudern', 6.8, [15, 15, 15])], 2);
    expect(next.kind).toBe('up');
    expect(ladder[next.rung].label).toBe('9,1 kg');
    expect(next.targets).toEqual([8, 8, 8]);
  });

  it('geht zurück, wenn schon der erste Satz zu wenig war', () => {
    const next = suggestNext(rudern, s, ladder, [kgLog('rudern', 9.1, [6, 5, 5])], 2);
    expect(next.kind).toBe('down');
    expect(ladder[next.rung].label).toBe('6,8 kg');
  });

  it('will sonst eine Wiederholung mehr', () => {
    const next = suggestNext(rudern, s, ladder, [kgLog('rudern', 6.8, [12, 11, 10])], 2);
    expect(next.kind).toBe('same');
    expect(next.targets).toEqual([13, 11, 10]);
  });

  it('meldet eine ausgereizte Leiter', () => {
    const top: ExerciseLog = { slotIndex: 0, exerciseId: 'rudern', sets: [15, 15, 15].map((r) => ({ load: { kind: 'kg', kg: 11.3, tech: 'pause' }, reps: r, done: true })) };
    expect(suggestNext(rudern, s, ladder, [top], 2).kind).toBe('maxed');
  });

  it('steigert Zeitübungen in 5-Sekunden-Schritten', () => {
    const plank = getExercise('unterarmstuetz');
    const plankLadder = buildLadder(plank, STEPS);
    const log: ExerciseLog = { slotIndex: 0, exerciseId: 'unterarmstuetz', sets: [40, 35, 30].map((r) => ({ load: { kind: 'level', level: 0 }, reps: r, done: true })) };
    expect(suggestNext(plank, slot('unterarmstuetz', 3, 30, 60), plankLadder, [log], 0).targets).toEqual([45, 35, 30]);
  });

  it('ordnet unbekannte Gewichte der nächstkleineren Stufe zu', () => {
    expect(ladder[rungIndexOf(ladder, { kind: 'kg', kg: 7 })].label).toBe('6,8 kg');
  });
});

describe('Wochenplan', () => {
  it('rechnet Wochen und Blöcke ab dem Start', () => {
    expect(weekNumber('2026-11-02', '2026-11-02')).toBe(1);
    expect(weekNumber('2026-11-15', '2026-11-02')).toBe(2);
    expect(blockForWeek(weekNumber('2026-12-28', '2026-11-02')).id).toBe('block-2');
    expect(plannedDay('2026-11-07', '2026-11-02').dayId).toBeNull();
    expect(plannedDay('2026-11-04', '2026-11-02').dayId).toBe('mi');
  });

  it('übernimmt getauschte Übungen', () => {
    const day = BLOCK_1.days.mo;
    const slots = resolveSlots(day, BLOCK_1.id, { [swapKey(BLOCK_1.id, 'mo', 2)]: 'pike-liegestuetze' });
    expect(slots[2].exerciseId).toBe('pike-liegestuetze');
    expect(slots[1].exerciseId).toBe('bodendruecken');
  });

  it('kürzt im Wenig-Zeit-Modus auf 3 Übungen mit 2 Sätzen', () => {
    const short = shortVersion(BLOCK_1.days.di.slots);
    expect(short).toHaveLength(3);
    expect(short.every((s) => s.sets <= 2 && s.restSec === 60)).toBe(true);
    expect(short[1].superset).toBe('A');
    expect(shortVersion(BLOCK_1.days.mo.slots).some((s) => s.superset)).toBe(false);
  });

  it('nimmt in der Entlastungswoche 40 % der Sätze weg', () => {
    expect(deloadVersion([slot('rudern', 4, 8, 15), slot('rudern', 3, 8, 15), slot('rudern', 2, 8, 15)]).map((s) => s.sets)).toEqual([2, 2, 1]);
  });
});

describe('Supersätze', () => {
  it('gruppiert Partner und pausiert erst nach dem zweiten', () => {
    const slots = BLOCK_1.days.mo.slots;
    expect(groupSlots(slots, true).map((g) => g.indices)).toEqual([[0], [1], [2], [3, 4]]);
    expect(groupSlots(slots, false)).toHaveLength(5);
    expect(restAfterSet(slots, 3, true)).toBe(0);
    expect(restAfterSet(slots, 4, true)).toBe(75);
    expect(restAfterSet(slots, 4, false)).toBe(60);
  });

  it('spart Zeit und bleibt unter einer Stunde', () => {
    for (const block of BLOCKS) {
      for (const day of DAY_IDS) {
        const slots = block.days[day].slots;
        expect(estimateSeconds(slots, getExercise, true)).toBeLessThan(estimateSeconds(slots, getExercise, false));
        expect(estimateMinutes(slots, getExercise, true)).toBeLessThanOrEqual(60);
      }
    }
  });
});

describe('Übung tauschen', () => {
  it('bietet nur Übungen für denselben Muskel', () => {
    for (const e of EXERCISES) {
      const alternatives = alternativesFor(e.id);
      expect(alternatives.length, e.id).toBeGreaterThan(0);
      for (const a of alternatives) expect(worksSameMuscle(a, e), `${e.id} → ${a.id}`).toBe(true);
    }
  });
});

describe('Muskel-Übersicht', () => {
  it('Block 1 und Block 2 liegen in allen Zielbereichen', () => {
    for (const block of [BLOCK_1, BLOCK_2]) {
      const totals = plannedMuscleSets(DAY_IDS.map((d) => block.days[d].slots));
      for (const m of MUSCLES) expect(rangeStatus(m, totals[m]), `${block.id} ${m}: ${totals[m]} (${MUSCLE_RANGES[m].join('–')})`).toBe('ok');
    }
  });
});

describe('Serien mit Joker', () => {
  const start = '2026-11-02';

  it('zählt Trainings in Folge', () => {
    const dates = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'];
    expect(trainingStreak(dates, start, '2026-11-07')).toEqual({ count: 5, jokerUsed: false });
  });

  it('verzeiht ein verpasstes Training pro Woche', () => {
    const dates = ['2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06', '2026-11-09'];
    expect(trainingStreak(dates, start, '2026-11-09').count).toBe(5);
  });

  it('reißt bei zwei verpassten Trainings in einer Woche', () => {
    const dates = ['2026-11-02', '2026-11-03', '2026-11-06', '2026-11-09'];
    expect(trainingStreak(dates, start, '2026-11-09').count).toBe(2);
  });

  it('wertet heute noch nicht als verpasst und meldet den Joker', () => {
    expect(trainingStreak(['2026-11-02', '2026-11-04'], start, '2026-11-05')).toEqual({ count: 2, jokerUsed: true });
  });

  it('zählt Wiege-Tage mit einem Joker pro Woche', () => {
    const days = Array.from({ length: 10 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
    expect(dailyStreak(days, '2026-11-10')).toBe(10);
    expect(dailyStreak(days.filter((d) => d !== '2026-11-04'), '2026-11-10')).toBe(9);
    expect(dailyStreak(days.filter((d) => d !== '2026-11-04' && d !== '2026-11-05'), '2026-11-10')).toBe(5);
    expect(dailyStreak(days, '2026-11-11')).toBe(10);
  });
});

describe('Rekorde', () => {
  const ladderOf = (e: ReturnType<typeof getExercise>) => buildLadder(e, STEPS);
  const w = (id: string, kg: number, reps: number[]): Workout => ({
    id,
    date: '2026-11-03',
    dayId: 'di',
    blockId: 'block-1',
    startedAt: 0,
    finishedAt: 1,
    mode: 'normal',
    exercises: [kgLog('rudern', kg, reps)],
  });

  it('erkennt höhere Stufe und mehr Wiederholungen, aber nicht die Einstufung', () => {
    const before = [w('a', 6.8, [12, 12, 11])];
    expect(findRecords(w('b', 9.1, [8, 8, 8]), before, ladderOf, getExercise)).toHaveLength(1);
    expect(findRecords(w('c', 6.8, [13, 10, 9]), before, ladderOf, getExercise)).toHaveLength(1);
    expect(findRecords(w('d', 6.8, [11, 11, 11]), before, ladderOf, getExercise)).toHaveLength(0);
    expect(findRecords(w('e', 6.8, [12, 12, 12]), [], ladderOf, getExercise)).toHaveLength(0);
  });
});

describe('Stillstand und Entlastungswoche', () => {
  const ladder = buildLadder(getExercise('rudern'), STEPS);

  it('erkennt Stillstand über 3 Trainings', () => {
    const same = Array.from({ length: 4 }, () => kgLog('rudern', 6.8, [10, 10, 10]));
    expect(isStagnating(same, ladder)).toBe(true);
    const better = [kgLog('rudern', 6.8, [11, 10, 10]), ...same.slice(1)];
    expect(isStagnating(better, ladder)).toBe(false);
    expect(isStagnating(same.slice(0, 3), ladder)).toBe(false);
  });

  it('schlägt eine leichtere Woche vor, wenn es nötig ist', () => {
    expect(deloadAdvice({ stagnatingCount: 3, feelings: [], week: 3, block: BLOCK_1 }).suggest).toBe(true);
    expect(deloadAdvice({ stagnatingCount: 0, feelings: [2, 1, 2, 5], week: 3, block: BLOCK_1 }).suggest).toBe(true);
    expect(deloadAdvice({ stagnatingCount: 0, feelings: [], week: 8, block: BLOCK_1 }).suggest).toBe(true);
    expect(deloadAdvice({ stagnatingCount: 1, feelings: [4, 2, 2], week: 3, block: BLOCK_1 }).suggest).toBe(false);
  });
});
