// Welcher Block und welcher Trainingstag gilt an einem Datum, mit getauschten Übungen,
// Wenig-Zeit-Modus und Entlastungswoche.

import { BLOCK_1, BLOCK_2 } from '../data/blocks';
import type { Block, DayId, DayPlan, Slot } from '../data/types';
import { diffDays, weekday, weekStart, type DateKey } from './dates';

export const DAY_BY_WEEKDAY: (DayId | null)[] = ['mo', 'di', 'mi', 'do', 'fr', null, null];

/** Trainingswoche ab dem Start (1 = erste Woche); vor dem Start 0 */
export function weekNumber(date: DateKey, startDate: DateKey): number {
  const days = diffDays(weekStart(date), weekStart(startDate));
  return days < 0 ? 0 : Math.floor(days / 7) + 1;
}

/** Ab Woche 9 gilt Block 2. Danach bleibt Block 2, bis ein neuer Block eingespielt wird. */
export function blockForWeek(week: number): Block {
  return week >= BLOCK_2.firstWeek ? BLOCK_2 : BLOCK_1;
}

export function blockById(id: string): Block {
  return id === BLOCK_2.id ? BLOCK_2 : BLOCK_1;
}

export interface PlannedDay {
  week: number;
  block: Block;
  dayId: DayId | null;
  beforeStart: boolean;
}

export function plannedDay(date: DateKey, startDate: DateKey | null): PlannedDay {
  const week = startDate ? weekNumber(date, startDate) : 1;
  const beforeStart = startDate ? date < startDate : false;
  return { week: Math.max(1, week), block: blockForWeek(Math.max(1, week)), dayId: DAY_BY_WEEKDAY[weekday(date)], beforeStart };
}

export function swapKey(blockId: string, dayId: DayId, slotIndex: number): string {
  return `swap:${blockId}:${dayId}:${slotIndex}`;
}

export function noteKey(exerciseId: string): string {
  return `note:${exerciseId}`;
}

export function resolveSlots(day: DayPlan, blockId: string, overrides: Record<string, unknown>): Slot[] {
  return day.slots.map((slot, i) => {
    const swapped = overrides[swapKey(blockId, day.id, i)];
    return typeof swapped === 'string' ? { ...slot, exerciseId: swapped } : slot;
  });
}

/** Wenig-Zeit-Modus: die ersten 3 Übungen mit je 2 Sätzen und 60 s Pause */
export function shortVersion(slots: Slot[]): Slot[] {
  const first = slots.slice(0, 3).map((s) => ({ ...s, sets: Math.min(2, s.sets), restSec: 60 }));
  return first.map((s) =>
    s.superset && first.filter((o) => o.superset === s.superset).length < 2 ? { ...s, superset: undefined } : s,
  );
}

/** Nach kurzer Nacht: ein Satz weniger pro Übung */
export function lighterVersion(slots: Slot[]): Slot[] {
  return slots.map((s) => ({ ...s, sets: Math.max(1, s.sets - 1) }));
}

/** Entlastungswoche: 40 % weniger Sätze */
export function deloadVersion(slots: Slot[]): Slot[] {
  return slots.map((s) => ({ ...s, sets: Math.max(1, Math.round(s.sets * 0.6)) }));
}
