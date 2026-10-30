// Texte für Sätze, Rekorde und Gefühl.

import type { Exercise } from '../data/types';
import { loadLabel, rungIndexOf, sameLoad, type Rung } from './ladder';
import type { ExerciseLog } from './model';
import type { Performance } from './records';

export const FEELINGS = ['Sehr schwer', 'Schwer', 'Okay', 'Gut', 'Richtig gut'] as const;

export function feelingLabel(feeling: number | undefined): string {
  return feeling ? FEELINGS[feeling - 1] : '';
}

export function unitSuffix(exercise: Exercise): string {
  return exercise.kind === 'time' ? ' s' : '';
}

/** „6,8 kg: 12, 11, 10“ */
export function setsSummary(log: ExerciseLog, exercise: Exercise): string {
  const done = log.sets.filter((s) => s.done);
  if (done.length === 0) return 'keine Sätze';
  const unit = unitSuffix(exercise);
  if (done.every((s) => sameLoad(s.load, done[0].load))) {
    return `${loadLabel(done[0].load, exercise)}: ${done.map((s) => `${s.reps}${unit}`).join(', ')}`;
  }
  return done.map((s) => `${loadLabel(s.load, exercise)} × ${s.reps}${unit}`).join(', ');
}

/** „9,1 kg × 10“ */
export function performanceLabel(p: Performance, ladder: Rung[], exercise: Exercise): string {
  return `${ladder[p.rung]?.label ?? ''} × ${p.reps}${unitSuffix(exercise)}`;
}

/** Wert für das Verlaufsdiagramm: Stufe plus Anteil im Wiederholungsbereich */
export function progressValue(log: ExerciseLog, ladder: Rung[]): number | null {
  const done = log.sets.filter((s) => s.done);
  if (done.length === 0) return null;
  let best = { rung: -1, reps: 0 };
  for (const s of done) {
    const rung = rungIndexOf(ladder, s.load);
    if (rung > best.rung || (rung === best.rung && s.reps > best.reps)) best = { rung, reps: s.reps };
  }
  const min = log.target?.min ?? 0;
  const max = log.target?.max ?? Math.max(best.reps, 1);
  const within = max > min ? Math.min(1, Math.max(0, (best.reps - min) / (max - min))) : 0;
  return best.rung + within * 0.8;
}
