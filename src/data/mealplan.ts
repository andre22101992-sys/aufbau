// Wochenplan: feste Mahlzeiten plus Abendessen im Wechsel. Mittags gibt es die zweite Portion vom Vorabend.

import type { DateKey } from '../lib/dates';
import { addDays, isWeekend, weekday } from '../lib/dates';

export interface FixedMeal {
  id: string;
  /** Uhrzeit Bürotag, Uhrzeit Wochenende */
  time: [string, string];
  name: string;
  items: { food: string; grams: number }[];
  /** nur an Bürotagen */
  weekdayOnly?: boolean;
  /** am Wochenende andere Zutaten */
  weekendItems?: { food: string; grams: number }[];
  weekendName?: string;
}

export type PlanMeal =
  | ({ kind: 'fixed' } & FixedMeal)
  | { kind: 'dish'; id: 'mittag' | 'abend'; time: string; name: string; recipeId: string; leftover: boolean };

/** Abendessen je Wochentag, Montag = 0 */
export const DINNER_BY_WEEKDAY = ['linsen', 'haehnchen', 'curry', 'thunfisch', 'linsen', 'hack', 'haehnchen'];

export const FIXED: FixedMeal[] = [
  { id: 'frueh', time: ['5:30', '8:30'], name: 'Milch und Banane', items: [{ food: 'milch', grams: 250 }, { food: 'banane', grams: 120 }] },
  { id: 'oats', time: ['9:00', '10:00'], name: 'Overnight Oats', items: [{ food: 'hafer', grams: 100 }, { food: 'milch', grams: 300 }] },
  {
    id: 'snack',
    time: ['15:30', '16:00'],
    name: 'Eier und Gouda',
    items: [{ food: 'ei', grams: 120 }, { food: 'gouda', grams: 30 }],
    weekendItems: [{ food: 'ei', grams: 120 }],
    weekendName: '2 hart gekochte Eier',
  },
  { id: 'spaet', time: ['21:15', '21:15'], name: 'Milch, Oats für morgen ansetzen', items: [{ food: 'milch', grams: 200 }], weekdayOnly: true },
];

export function dinnerOf(date: DateKey): string {
  return DINNER_BY_WEEKDAY[weekday(date)];
}

/** Alle Mahlzeiten eines Tages in zeitlicher Reihenfolge */
export function mealsOf(date: DateKey): PlanMeal[] {
  const weekend = isWeekend(date);
  const friday = weekday(date) === 4;
  const at = (m: FixedMeal) => m.time[weekend ? 1 : 0];
  const fixed = FIXED.filter((m) => !(weekend && m.weekdayOnly)).map(
    (m) => ({ ...m, kind: 'fixed' as const, items: weekend && m.weekendItems ? m.weekendItems : m.items, name: (weekend && m.weekendName) || m.name }),
  );
  const lunch: PlanMeal = { kind: 'dish', id: 'mittag', time: weekend ? '13:00' : '12:30', name: 'Mittag', recipeId: dinnerOf(addDays(date, -1)), leftover: true };
  const dinner: PlanMeal = { kind: 'dish', id: 'abend', time: weekend ? '19:00' : friday ? '18:15' : '20:15', name: 'Abendessen', recipeId: dinnerOf(date), leftover: false };
  const list: PlanMeal[] = [...fixed, lunch, dinner];
  const minutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return list.sort((a, b) => minutes(a.kind === 'fixed' ? at(a) : a.time) - minutes(b.kind === 'fixed' ? at(b) : b.time)).map((m) =>
    m.kind === 'fixed' ? { ...m, time: [at(m), at(m)] as [string, string] } : m,
  );
}

export function mealTime(meal: PlanMeal): string {
  return meal.kind === 'fixed' ? meal.time[0] : meal.time;
}
