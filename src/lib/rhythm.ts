// Essens-Rhythmus: nächste Mahlzeit, Punkte, Wochenübersicht, Hinweis nach langer Pause und Abend-Retter.
// Schlechte Tage sind erlaubt: Alles hier ist als Hilfe gedacht, nie als Vorwurf.

import type { PlanMeal } from '../data/mealplan';
import type { DateKey } from './dates';
import { openMeals, replacedMeals, type Totals } from './dayfood';
import type { DayMeals, Extra } from './repo';

/** Ein Tag mit mindestens so vielen Mahlzeiten zählt als gut */
export const GOOD_DAY_MEALS = 4;

export const mealMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();

/** Abgehakte Mahlzeiten plus Extras */
export function mealCount(day: Pick<DayMeals, 'done' | 'extras'> | undefined | null): number {
  return day ? Object.keys(day.done).length + day.extras.length : 0;
}

export type DotState = 'done' | 'next' | 'open';

/** Eine Mahlzeit gilt als erledigt, wenn sie abgehakt oder durch ein Extra ersetzt ist */
export function dots(plan: PlanMeal[], done: Record<string, number>, extras: Extra[]): { id: string; state: DotState }[] {
  const replaced = replacedMeals(extras);
  const next = openMeals(plan, done, extras)[0]?.id;
  return plan.map((m) => ({ id: m.id, state: done[m.id] || replaced.has(m.id) ? 'done' : m.id === next ? 'next' : 'open' }));
}

export type WeekLevel = 'good' | 'some' | 'none';

export function weekRhythm(
  dates: DateKey[],
  days: Record<DateKey, Pick<DayMeals, 'done' | 'extras'> | undefined>,
): { date: DateKey; count: number; level: WeekLevel }[] {
  return dates.map((date) => {
    const count = mealCount(days[date]);
    return { date, count, level: count >= GOOD_DAY_MEALS ? 'good' : count > 0 ? 'some' : 'none' };
  });
}

export function lastEatenAt(day: Pick<DayMeals, 'doneAt' | 'extras'> | null | undefined): number | null {
  if (!day) return null;
  const times = [...Object.values(day.doneAt ?? {}), ...day.extras.map((e) => e.at ?? 0)].filter((t) => t > 0);
  return times.length ? Math.max(...times) : null;
}

export type GapNotice = { kind: 'none-yet' } | { kind: 'gap'; hours: number };

/**
 * Freundlicher Hinweis beim Öffnen: heute noch nichts abgehakt (anderthalb Stunden nach der ersten Mahlzeit)
 * oder seit mindestens vier Stunden nichts mehr. Nur tagsüber und solange noch etwas offen ist.
 */
export function gapNotice(now: Date, plan: PlanMeal[], day: DayMeals | null): GapNotice | null {
  if (!day || plan.length === 0) return null;
  const minutes = minutesOf(now);
  if (minutes < 7 * 60 || minutes >= 21 * 60 + 30) return null;
  if (openMeals(plan, day.done, day.extras).length === 0) return null;
  const last = lastEatenAt(day);
  if (last === null) {
    // Einträge aus früheren App-Versionen haben keinen Zeitpunkt: dann lieber nichts sagen
    if (mealCount(day) > 0) return null;
    const first = mealMinutes(plan[0].kind === 'fixed' ? plan[0].time[0] : plan[0].time);
    return minutes >= first + 90 ? { kind: 'none-yet' } : null;
  }
  const hours = Math.floor((now.getTime() - last) / 3_600_000);
  return hours >= 4 ? { kind: 'gap', hours } : null;
}

export interface Rescue {
  ml: number;
  kcal: number;
  protein: number;
}

/**
 * Abend-Retter: Fehlen nach den noch geplanten Mahlzeiten mehr als 20 g Protein oder 300 kcal,
 * schlägt die App Milch aus dem Vorrat vor.
 */
export function eveningRescue(now: Date, eaten: Totals, stillPlanned: Totals, target: Totals): Rescue | null {
  if (minutesOf(now) < 20 * 60) return null;
  const kcal = target.kcal - eaten.kcal - stillPlanned.kcal;
  const protein = target.protein - eaten.protein - stillPlanned.protein;
  if (protein <= 20 && kcal <= 300) return null;
  const ml = Math.min(750, Math.max(250, Math.ceil(Math.max(kcal, 0) / 0.64 / 50) * 50, Math.ceil(Math.max(protein, 0) / 0.033 / 50) * 50));
  return { ml, kcal: Math.round(ml * 0.64), protein: Math.round(ml * 0.033) };
}

/** „in 25 Minuten“, „in 2 Stunden“ oder „jetzt“ */
export function inTime(minutes: number): string {
  if (minutes <= 0) return 'jetzt';
  if (minutes < 60) return `in ${minutes} Minuten`;
  const hours = Math.round(minutes / 60);
  return `in ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
}
