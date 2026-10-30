// Muskel-Übersicht: Sätze pro Woche je Muskelgruppe.
// Der Hauptmuskel zählt voll, mitarbeitende Muskeln zählen halb.

import { getExercise } from '../data/exercises';
import { MUSCLES, type Muscle, type Slot } from '../data/types';
import type { Workout } from './model';

/** Zielbereiche in Sätzen pro Woche (mitarbeitende Muskeln halb gezählt) */
export const MUSCLE_RANGES: Record<Muscle, [number, number]> = {
  brust: [10, 20],
  ruecken: [12, 22],
  schultern: [8, 16],
  bizeps: [10, 18],
  trizeps: [10, 18],
  beine: [8, 14],
  bauch: [3, 8],
};

export function emptyMuscleSets(): Record<Muscle, number> {
  return Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
}

function addSets(totals: Record<Muscle, number>, exerciseId: string, sets: number): void {
  const exercise = getExercise(exerciseId);
  totals[exercise.primary] += sets;
  for (const m of exercise.secondary) totals[m] += sets * 0.5;
}

export function plannedMuscleSets(slotsPerDay: Slot[][]): Record<Muscle, number> {
  const totals = emptyMuscleSets();
  for (const slots of slotsPerDay) for (const s of slots) addSets(totals, s.exerciseId, s.sets);
  return totals;
}

export function doneMuscleSets(workouts: Workout[]): Record<Muscle, number> {
  const totals = emptyMuscleSets();
  for (const w of workouts) for (const e of w.exercises) addSets(totals, e.exerciseId, e.sets.filter((s) => s.done).length);
  return totals;
}

export function rangeStatus(muscle: Muscle, sets: number): 'low' | 'ok' | 'high' {
  const [min, max] = MUSCLE_RANGES[muscle];
  if (sets < min) return 'low';
  if (sets > max) return 'high';
  return 'ok';
}
