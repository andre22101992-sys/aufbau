// Stillstand-Erkennung und Entlastungswoche.

import type { Block } from '../data/types';
import type { ExerciseLog } from './model';
import { rungIndexOf, type Rung } from './ladder';

/** Leistung einer Einheit: höhere Stufe zählt mehr als zusätzliche Wiederholungen */
export function sessionScore(log: ExerciseLog, ladder: Rung[]): number {
  const done = log.sets.filter((s) => s.done);
  if (done.length === 0) return 0;
  return rungIndexOf(ladder, done[0].load) * 1000 + done.reduce((n, s) => n + s.reps, 0);
}

/** Stillstand: das letzte Training ist nicht besser als das vor drei Trainings (neuester Eintrag zuerst). */
export function isStagnating(history: ExerciseLog[], ladder: Rung[]): boolean {
  const sessions = history.filter((h) => h.sets.some((s) => s.done));
  if (sessions.length < 4) return false;
  return sessionScore(sessions[0], ladder) <= sessionScore(sessions[3], ladder);
}

export interface DeloadAdvice {
  suggest: boolean;
  reason: string;
}

export function deloadAdvice(input: {
  stagnatingCount: number;
  /** Gefühl der letzten Trainings, neuestes zuerst */
  feelings: number[];
  week: number;
  block: Block;
}): DeloadAdvice {
  if (input.stagnatingCount >= 3) {
    return { suggest: true, reason: 'Bei mehreren Übungen geht es gerade nicht voran. Eine leichtere Woche hilft dem Körper, sich zu erholen.' };
  }
  const last3 = input.feelings.slice(0, 3);
  if (last3.length === 3 && last3.every((f) => f <= 2)) {
    return { suggest: true, reason: 'Du hast dich dreimal in Folge schlecht gefühlt. Gönn dir eine leichtere Woche.' };
  }
  if (input.week === input.block.lastWeek) {
    return { suggest: true, reason: `Letzte Woche von ${input.block.name}. Eine leichtere Woche vor dem nächsten Block bringt frische Kraft.` };
  }
  return { suggest: false, reason: '' };
}
