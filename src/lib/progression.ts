// Steigerungsvorschlag nach der Stufen-Leiter:
// - alle Sätze am oberen Ende → eine Stufe hoch
// - schon der erste Satz unter dem unteren Ende → eine Stufe zurück
// - sonst gleiche Stufe, Ziel: eine Wiederholung mehr (bei Zeitübungen 5 Sekunden)

import type { Exercise, Slot } from '../data/types';
import type { ExerciseLog } from './model';
import { rungIndexOf, type Rung } from './ladder';

export type SuggestionKind = 'start' | 'up' | 'down' | 'same' | 'maxed';

export interface Suggestion {
  rung: number;
  targets: number[];
  kind: SuggestionKind;
  reason: string;
}

export function repStep(exercise: Exercise): number {
  return exercise.kind === 'time' ? 5 : 1;
}

/**
 * @param history frühere Einträge dieser Übung, neuester zuerst
 * @param start Stufe fürs erste Training (Einstufung)
 */
export function suggestNext(exercise: Exercise, slot: Slot, ladder: Rung[], history: ExerciseLog[], start: number): Suggestion {
  const fill = (n: number) => Array.from({ length: slot.sets }, () => n);
  const unit = exercise.kind === 'time' ? 'Sekunden' : 'Wiederholungen';
  const last = history.find((h) => h.sets.some((s) => s.done));

  if (!last) {
    return {
      rung: start,
      targets: fill(slot.min),
      kind: 'start',
      reason: `Einstufung: Mach saubere ${unit}, höchstens ${slot.max}. Danach rechnet die App deine nächste Stufe aus.`,
    };
  }

  const done = last.sets.filter((s) => s.done);
  const rung = rungIndexOf(ladder, done[0].load);
  const reps = Array.from({ length: slot.sets }, (_, i) => done[i]?.reps ?? 0);

  if (reps.every((r) => r >= slot.max)) {
    if (rung < ladder.length - 1) {
      return {
        rung: rung + 1,
        targets: fill(slot.min),
        kind: 'up',
        reason: `Alle Sätze am oberen Ende geschafft. Nächste Stufe: ${ladder[rung + 1].label}.`,
      };
    }
    return {
      rung,
      targets: fill(slot.max),
      kind: 'maxed',
      reason: 'Die Stufen-Leiter ist ausgereizt. Tausch auf eine schwerere Variante.',
    };
  }

  if (reps[0] < slot.min && rung > 0) {
    return {
      rung: rung - 1,
      targets: fill(slot.min),
      kind: 'down',
      reason: `Der erste Satz lag unter ${slot.min}. Eine Stufe zurück: ${ladder[rung - 1].label}.`,
    };
  }

  const targets = reps.map((r) => Math.max(slot.min, Math.min(slot.max, r)));
  const next = targets.findIndex((t) => t < slot.max);
  if (next >= 0) targets[next] = Math.min(slot.max, targets[next] + repStep(exercise));
  return {
    rung,
    targets,
    kind: 'same',
    reason: exercise.kind === 'time' ? 'Ziel: 5 Sekunden länger als beim letzten Mal.' : 'Ziel: eine Wiederholung mehr als beim letzten Mal.',
  };
}
