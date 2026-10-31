// Pause-Modus für Krankheit und Urlaub: Serien, Steuerung und Stillstand-Erkennung halten an.
// Danach gibt es nach einer längeren Pause eine leichtere Woche zum Wiedereinstieg.

import { addDays, diffDays, type DateKey } from './dates';

export type PauseReason = 'krank' | 'urlaub';

export const PAUSE_LABELS: Record<PauseReason, string> = { krank: 'Krank', urlaub: 'Urlaub' };

export interface Pause {
  from: DateKey;
  /** letzter Tag der Pause; null, solange sie läuft */
  to: DateKey | null;
  reason: PauseReason;
}

/** Ab so vielen Tagen Pause gibt es zum Wiedereinstieg eine leichtere Woche */
export const COMEBACK_DAYS = 7;

/** Nach einer Pause macht die Kalorien-Steuerung so lange keinen neuen Vorschlag */
export const HOLD_AFTER_DAYS = 14;

export function activePause(pauses: Pause[]): Pause | null {
  return pauses.find((p) => p.to === null) ?? null;
}

export function isPausedOn(pauses: Pause[], date: DateKey): boolean {
  return pauses.some((p) => date >= p.from && (p.to === null || date <= p.to));
}

/** Tage der Pause einschließlich des ersten und letzten */
export function pauseDays(pause: Pause, today: DateKey): number {
  return diffDays(pause.to ?? today, pause.from) + 1;
}

/** Hält die Steuerung gerade an: während der Pause und 14 Tage danach */
export function steeringOnHold(pauses: Pause[], today: DateKey): boolean {
  if (activePause(pauses)) return true;
  return pauses.some((p) => p.to !== null && diffDays(today, p.to) < HOLD_AFTER_DAYS);
}

export function startPause(pauses: Pause[], reason: PauseReason, today: DateKey): Pause[] {
  if (activePause(pauses)) return pauses;
  return [...pauses, { from: today, to: null, reason }];
}

/** Beendet die laufende Pause; gibt an, ob eine leichtere Woche zum Wiedereinstieg passt */
export function endPause(pauses: Pause[], today: DateKey): { pauses: Pause[]; comeback: boolean } {
  const active = activePause(pauses);
  if (!active) return { pauses, comeback: false };
  // Der Tag davor war der letzte Pause-Tag; heute geht es wieder los
  const to = addDays(today, -1) < active.from ? active.from : addDays(today, -1);
  return {
    pauses: pauses.map((p) => (p === active ? { ...p, to } : p)),
    comeback: pauseDays({ ...active, to }, today) >= COMEBACK_DAYS,
  };
}
