// Tagesform: Nach einer kurzen Nacht schlägt die App ein leichteres Training vor. Entscheiden tust du.

import { formatSleep } from './sleep';

export interface Readiness {
  suggest: boolean;
  reason: string;
}

/** Höchstens 5 Stunden Schlaf, oder höchstens 6 Stunden und das letzte Training mit 1–2 bewertet */
export function readiness(sleepHours: number | null, lastFeeling: number | null): Readiness {
  if (sleepHours === null) return { suggest: false, reason: '' };
  if (sleepHours <= 5) return { suggest: true, reason: `Du hast nur ${formatSleep(sleepHours)} geschlafen.` };
  if (sleepHours <= 6 && lastFeeling !== null && lastFeeling <= 2) {
    return { suggest: true, reason: `Kurze Nacht (${formatSleep(sleepHours)}) und dein letztes Training war schwer.` };
  }
  return { suggest: false, reason: '' };
}
