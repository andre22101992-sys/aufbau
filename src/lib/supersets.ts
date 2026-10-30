// Supersätze: zwei aufeinanderfolgende Übungen mit gleichem Buchstaben laufen im Wechsel.
// Dazu eine grobe Zeitschätzung pro Training.

import type { Exercise, Slot } from '../data/types';

export const SUPERSET_REST_SEC = 75;

export interface SlotGroup {
  indices: number[];
  superset: boolean;
}

export function groupSlots(slots: Slot[], supersetsOn: boolean): SlotGroup[] {
  const groups: SlotGroup[] = [];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (supersetsOn && s.superset && slots[i + 1]?.superset === s.superset) {
      groups.push({ indices: [i, i + 1], superset: true });
      i++;
    } else {
      groups.push({ indices: [i], superset: false });
    }
  }
  return groups;
}

/** Pause nach einem Satz: im Supersatz erst nach der zweiten Übung */
export function restAfterSet(slots: Slot[], slotIndex: number, supersetsOn: boolean): number {
  const group = groupSlots(slots, supersetsOn).find((g) => g.indices.includes(slotIndex));
  if (!group?.superset) return slots[slotIndex].restSec;
  return group.indices[group.indices.length - 1] === slotIndex ? SUPERSET_REST_SEC : 0;
}

const WORK_SEC = 40;
const SETUP_SEC = 60;
const SWITCH_SEC = 15;

function workSeconds(slot: Slot, exercise: Exercise): number {
  const base = exercise.kind === 'time' ? (slot.min + slot.max) / 2 : WORK_SEC;
  return exercise.unilateral ? base * 2 + 10 : base;
}

/** Geschätzte Minuten ohne Aufwärmen */
export function estimateMinutes(slots: Slot[], exerciseOf: (id: string) => Exercise, supersetsOn: boolean): number {
  return Math.round(estimateSeconds(slots, exerciseOf, supersetsOn) / 60);
}

export function estimateSeconds(slots: Slot[], exerciseOf: (id: string) => Exercise, supersetsOn: boolean): number {
  let sec = 0;
  for (const group of groupSlots(slots, supersetsOn)) {
    sec += SETUP_SEC;
    if (group.superset) {
      const [a, b] = group.indices.map((i) => slots[i]);
      const rounds = Math.max(a.sets, b.sets);
      for (let r = 0; r < rounds; r++) {
        if (r < a.sets) sec += workSeconds(a, exerciseOf(a.exerciseId));
        if (r < b.sets) sec += SWITCH_SEC + workSeconds(b, exerciseOf(b.exerciseId));
        if (r < rounds - 1) sec += SUPERSET_REST_SEC;
      }
    } else {
      const s = slots[group.indices[0]];
      sec += s.sets * workSeconds(s, exerciseOf(s.exerciseId)) + (s.sets - 1) * s.restSec;
    }
  }
  return sec;
}
