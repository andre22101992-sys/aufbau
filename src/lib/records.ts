// Rekorde: bester Satz je Übung (höhere Stufe schlägt mehr Wiederholungen).

import type { Exercise } from '../data/types';
import type { ExerciseLog, Workout } from './model';
import { rungIndexOf, type Rung } from './ladder';

export interface Performance {
  rung: number;
  reps: number;
}

export function compare(a: Performance, b: Performance): number {
  return a.rung !== b.rung ? a.rung - b.rung : a.reps - b.reps;
}

export function bestOfLog(log: ExerciseLog, ladder: Rung[]): Performance | null {
  let best: Performance | null = null;
  for (const s of log.sets) {
    if (!s.done) continue;
    const p = { rung: rungIndexOf(ladder, s.load), reps: s.reps };
    if (!best || compare(p, best) > 0) best = p;
  }
  return best;
}

export interface NewRecord {
  exerciseId: string;
  performance: Performance;
}

/** Rekorde in einem Training im Vergleich zu allen früheren Trainings */
export function findRecords(
  workout: Workout,
  previous: Workout[],
  ladderOf: (exercise: Exercise) => Rung[],
  exerciseOf: (id: string) => Exercise,
): NewRecord[] {
  const records: NewRecord[] = [];
  for (const log of workout.exercises) {
    const ladder = ladderOf(exerciseOf(log.exerciseId));
    const current = bestOfLog(log, ladder);
    if (!current) continue;
    let before: Performance | null = null;
    for (const w of previous) {
      for (const l of w.exercises) {
        if (l.exerciseId !== log.exerciseId) continue;
        const p = bestOfLog(l, ladder);
        if (p && (!before || compare(p, before) > 0)) before = p;
      }
    }
    // Das erste Training ist die Einstufung und zählt noch nicht als Rekord.
    if (before && compare(current, before) > 0) records.push({ exerciseId: log.exerciseId, performance: current });
  }
  return records;
}
