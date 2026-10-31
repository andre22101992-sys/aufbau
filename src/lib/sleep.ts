// Schlaf: Zubettgehen und Aufstehen als Uhrzeit, daraus die Stunden.

import { isWeekend, timeToMinutes, type DateKey } from './dates';
import type { Times } from './model';

const DAY = 24 * 60;
const pad = (n: number) => String(n).padStart(2, '0');

/** Stunden zwischen zwei Uhrzeiten, auch über Mitternacht */
export function sleepHours(bed: string, wake: string): number {
  return ((timeToMinutes(wake) - timeToMinutes(bed) + DAY) % DAY) / 60;
}

/** Verschiebt eine Uhrzeit um Minuten, rund um die Uhr */
export function shiftTime(time: string, minutes: number): string {
  const total = (((timeToMinutes(time) + minutes) % DAY) + DAY) % DAY;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** „05:15“ → „5:15“ */
export function displayTime(time: string): string {
  return time.replace(/^0(\d)/, '$1');
}

/** 7,25 → „7 h 15 min“ */
export function formatSleep(hours: number): string {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Vorschlag für die letzte Nacht aus den Uhrzeiten in den Einstellungen */
export function defaultSleep(times: Times, date: DateKey): { bed: string; wake: string } {
  return { bed: times.sleep, wake: isWeekend(date) ? times.wakeWeekend : times.wakeWeekday };
}
