// „Übung tauschen“: gleichwertige Alternativen für denselben Muskel mit deiner Ausrüstung.

import { EXERCISES, getExercise } from '../data/exercises';
import type { Exercise } from '../data/types';

/** Ausrüstung: eine Hantel, Boden und Stuhl. Alle Übungsarten der Bibliothek kommen damit aus. */
export const AVAILABLE_KINDS: Exercise['kind'][] = ['dumbbell', 'bodyweight', 'time'];

export function worksSameMuscle(candidate: Exercise, target: Exercise): boolean {
  return (
    candidate.primary === target.primary ||
    candidate.secondary.includes(target.primary) ||
    target.secondary.includes(candidate.primary)
  );
}

export function alternativesFor(exerciseId: string): Exercise[] {
  const exercise = getExercise(exerciseId);
  const ids = new Set<string>();
  if (exercise.harder) ids.add(exercise.harder);
  for (const id of exercise.alternatives) ids.add(id);
  for (const other of EXERCISES) if (other.primary === exercise.primary) ids.add(other.id);
  ids.delete(exercise.id);
  return [...ids]
    .map(getExercise)
    .filter((c) => AVAILABLE_KINDS.includes(c.kind) && worksSameMuscle(c, exercise));
}
