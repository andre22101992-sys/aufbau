// Stufen-Leiter: Hantelstufen von leicht nach schwer, danach Technik-Stufen (langsam, mit Pause).
// Körpergewicht- und Zeitübungen haben eigene Stufen.

import type { Exercise } from '../data/types';
import type { Load } from './model';
import { formatDecimal } from './numbers';

export interface Rung {
  label: string;
  load: Load;
}

export function kgLabel(kg: number, tech?: 'langsam' | 'pause'): string {
  if (kg === 0) return 'ohne Gewicht';
  const base = `${formatDecimal(kg)} kg`;
  if (tech === 'langsam') return `${base} langsam`;
  if (tech === 'pause') return `${base} mit Pause`;
  return base;
}

export function buildLadder(exercise: Exercise, dumbbellSteps: number[]): Rung[] {
  if (exercise.kind === 'dumbbell') {
    const steps = [...dumbbellSteps].sort((a, b) => a - b);
    const rungs: Rung[] = [];
    if (exercise.allowNoWeight) rungs.push({ label: kgLabel(0), load: { kind: 'kg', kg: 0 } });
    for (const kg of steps) rungs.push({ label: kgLabel(kg), load: { kind: 'kg', kg } });
    const max = steps[steps.length - 1];
    rungs.push({ label: kgLabel(max, 'langsam'), load: { kind: 'kg', kg: max, tech: 'langsam' } });
    rungs.push({ label: kgLabel(max, 'pause'), load: { kind: 'kg', kg: max, tech: 'pause' } });
    return rungs;
  }
  const levels = exercise.levels?.length ? exercise.levels : ['Standard'];
  return levels.map((label, level) => ({ label, load: { kind: 'level', level } }));
}

export function sameLoad(a: Load, b: Load): boolean {
  if (a.kind === 'kg' && b.kind === 'kg') return a.kg === b.kg && (a.tech ?? null) === (b.tech ?? null);
  if (a.kind === 'level' && b.kind === 'level') return a.level === b.level;
  return false;
}

/** Position einer Belastung auf der Leiter; unbekannte Gewichte landen auf der nächstkleineren Stufe. */
export function rungIndexOf(ladder: Rung[], load: Load): number {
  const exact = ladder.findIndex((r) => sameLoad(r.load, load));
  if (exact >= 0) return exact;
  if (load.kind === 'kg') {
    let best = 0;
    ladder.forEach((r, i) => {
      if (r.load.kind === 'kg' && !r.load.tech && r.load.kg <= load.kg) best = i;
    });
    return best;
  }
  return Math.min(Math.max(0, load.level), ladder.length - 1);
}

export function loadLabel(load: Load, exercise: Exercise): string {
  if (load.kind === 'kg') return kgLabel(load.kg, load.tech);
  return exercise.levels?.[load.level] ?? 'Standard';
}

export function startRung(ladder: Rung[], start?: { kg?: number; level?: number }): number {
  if (!start) return 0;
  if (start.kg !== undefined) return rungIndexOf(ladder, { kind: 'kg', kg: start.kg });
  return rungIndexOf(ladder, { kind: 'level', level: start.level ?? 0 });
}

export function unitLabel(exercise: Exercise): string {
  return exercise.kind === 'time' ? 's' : 'Wdh.';
}
