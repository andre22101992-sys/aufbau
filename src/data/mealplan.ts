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
  /** Hinweis unter der Mahlzeit; am Wochenende gilt weekendNote, falls vorhanden */
  note?: string;
  weekendNote?: string;
}

export type PlanMeal =
  | ({ kind: 'fixed' } & FixedMeal)
  | { kind: 'dish'; id: 'mittag' | 'abend'; time: string; name: string; recipeId: string; leftover: boolean };

/** Abendessen je Wochentag, Montag = 0 */
export const DINNER_BY_WEEKDAY = ['linsen', 'haehnchen', 'curry', 'thunfisch', 'linsen', 'hack', 'haehnchen'];

export const FIXED: FixedMeal[] = [
  { id: 'frueh', time: ['5:30', '8:30'], name: 'Milch und Banane', items: [{ food: 'milch', grams: 250 }, { food: 'banane', grams: 120 }] },
  {
    id: 'oats',
    time: ['9:00', '10:00'],
    name: 'Overnight Oats',
    items: [{ food: 'hafer', grams: 100 }, { food: 'milch', grams: 300 }],
    weekendItems: [{ food: 'hafer', grams: 100 }, { food: 'milch', grams: 250 }],
    weekendName: 'Haferbrei, frisch',
    weekendNote: 'Am Wochenende frisch: 5 Minuten in der Milch quellen lassen oder kurz erwärmen',
  },
  {
    id: 'snack',
    time: ['15:30', '16:00'],
    name: 'Eier und Gouda',
    items: [{ food: 'ei', grams: 120 }, { food: 'gouda', grams: 30 }],
    weekendItems: [{ food: 'ei', grams: 120 }, { food: 'remoulade', grams: 15 }],
    weekendName: '2 hart gekochte Eier mit Remoulade',
  },
  { id: 'spaet', time: ['21:15', '21:15'], name: 'Milch, Oats für morgen ansetzen', items: [{ food: 'milch', grams: 200 }], weekdayOnly: true },
];

/** Am ersten Kochtag (dem Samstag vor dem Start) gibt es noch keine Oats und keine Reste von gestern. Dafür gibt es diese beiden. */
const FIRST_DAY_MEALS: FixedMeal[] = [
  {
    id: 'oats',
    time: ['9:00', '12:00'],
    name: 'Milch-Hafer-Shake',
    items: [{ food: 'milch', grams: 400 }, { food: 'hafer', grams: 60 }, { food: 'banane', grams: 120 }],
    note: 'Heute noch keine Oats. Nach dem Einkauf im Schraubglas schütteln, langsam trinken',
  },
  {
    id: 'mittag',
    time: ['12:30', '14:00'],
    name: 'Eier, Banane und Milch',
    items: [{ food: 'ei', grams: 180 }, { food: 'banane', grams: 120 }, { food: 'milch', grams: 250 }],
    note: 'Heute keine Reste von gestern',
  },
];

export function firstCookDay(startDate: DateKey | null | undefined): DateKey | null {
  return startDate ? addDays(startDate, -2) : null;
}

export interface PlanOptions {
  /** Montag der ersten Trainingswoche; davor liegt der erste Kochtag */
  startDate?: DateKey | null;
  /** getauschte Gerichte, Schlüssel dinnerKey(datum) */
  overrides?: Record<string, unknown>;
  /** Kalorienziel; liegt es über 2.800, kommt mehr in die Oats, darunter weniger Milch */
  kcalTarget?: number;
}

export const BASE_KCAL = 2800;

export function dinnerKey(date: DateKey): string {
  return `dinner:${date}`;
}

export function dinnerOf(date: DateKey, overrides: Record<string, unknown> = {}): string {
  const swapped = overrides[dinnerKey(date)];
  return typeof swapped === 'string' ? swapped : DINNER_BY_WEEKDAY[weekday(date)];
}

/** Leichter Tag für Tage ohne Appetit: nur Trinkmahlzeiten. Der Wert ist die Uhrzeit, ab der der leichte Tag gilt. */
export function lightKey(date: DateKey): string {
  return `light:${date}`;
}

const SHAKE = [{ food: 'milch', grams: 400 }, { food: 'hafer', grams: 60 }, { food: 'banane', grams: 120 }];
const GLASS = [{ food: 'milch', grams: 250 }];

const LIGHT_MEALS: { id: string; time: string; name: string; items: { food: string; grams: number }[] }[] = [
  { id: 'l1', time: '8:00', name: 'Milch-Hafer-Shake', items: SHAKE },
  { id: 'l2', time: '11:00', name: '250 ml Milch', items: GLASS },
  { id: 'l3', time: '13:30', name: 'Milch-Hafer-Shake', items: SHAKE },
  { id: 'l4', time: '16:30', name: '250 ml Milch', items: GLASS },
  { id: 'l5', time: '19:00', name: 'Milch-Hafer-Shake', items: SHAKE },
];

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Die Trinkmahlzeiten, die ab der Startzeit noch anstehen; spät am Abend bleibt eine übrig. */
export function lightPlan(start: string): PlanMeal[] {
  const from = toMinutes(start) - 20;
  let list = LIGHT_MEALS.filter((m) => toMinutes(m.time) >= from);
  if (!list.length) list = [{ ...LIGHT_MEALS[LIGHT_MEALS.length - 1], time: start }];
  return list.map((m, i) => ({
    kind: 'fixed' as const,
    id: m.id,
    time: [m.time, m.time] as [string, string],
    name: m.name,
    items: m.items,
    note: i === 0 ? 'Trinken geht auch ohne Hunger. Langsam, in kleinen Schlucken' : undefined,
  }));
}

/**
 * Kalorienziel: Die Oats tragen den Unterschied zu 2.800 kcal, mit Haferflocken und Milch im festen Verhältnis
 * (40 g Haferflocken + 150 ml Milch ≈ 244 kcal). Das gilt für Aufschläge der Steuerung ebenso wie für ein selbst gewähltes Ziel.
 */
function adjust(items: { food: string; grams: number }[], mealId: string, kcalTarget: number): { food: string; grams: number }[] {
  const delta = kcalTarget - BASE_KCAL;
  if (mealId !== 'oats' || delta === 0) return items;
  const k = delta / 244;
  const round = (n: number, step: number) => Math.max(0, Math.round(n / step) * step);
  return items.map((i) => (i.food === 'hafer' ? { ...i, grams: round(i.grams + 40 * k, 5) } : i.food === 'milch' ? { ...i, grams: round(i.grams + 150 * k, 10) } : i));
}

/** Alle Mahlzeiten eines Tages in zeitlicher Reihenfolge */
export function mealsOf(date: DateKey, options: PlanOptions = {}): PlanMeal[] {
  const { overrides = {}, kcalTarget = BASE_KCAL } = options;
  const light = overrides[lightKey(date)];
  if (typeof light === 'string') return lightPlan(light);
  const weekend = isWeekend(date);
  const friday = weekday(date) === 4;
  const firstDay = firstCookDay(options.startDate) === date;
  const at = (m: FixedMeal) => m.time[weekend ? 1 : 0];
  const source = firstDay ? [...FIXED.filter((m) => m.id !== 'oats'), ...FIRST_DAY_MEALS] : FIXED;
  const fixed = source
    .filter((m) => !(weekend && m.weekdayOnly))
    .map((m) => ({
      ...m,
      kind: 'fixed' as const,
      items: adjust(weekend && m.weekendItems ? m.weekendItems : m.items, m.id, kcalTarget),
      name: (weekend && m.weekendName) || m.name,
      note: (weekend && m.weekendNote) || m.note,
    }));
  const lunch: PlanMeal = { kind: 'dish', id: 'mittag', time: weekend ? '13:00' : '12:30', name: 'Mittag', recipeId: dinnerOf(addDays(date, -1), overrides), leftover: true };
  const dinner: PlanMeal = { kind: 'dish', id: 'abend', time: weekend ? '19:00' : friday ? '18:15' : '20:15', name: 'Abendessen', recipeId: dinnerOf(date, overrides), leftover: false };
  const list: PlanMeal[] = firstDay ? [...fixed, dinner] : [...fixed, lunch, dinner];
  const minutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return list.sort((x, y) => minutes(x.kind === 'fixed' ? at(x) : x.time) - minutes(y.kind === 'fixed' ? at(y) : y.time)).map((m) =>
    m.kind === 'fixed' ? { ...m, time: [at(m), at(m)] as [string, string] } : m,
  );
}

export function mealTime(meal: PlanMeal): string {
  return meal.kind === 'fixed' ? meal.time[0] : meal.time;
}
