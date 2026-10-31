// Abgehakte Mahlzeiten und Extras eines Tages.

import { lightKey, type PlanMeal } from '../../data/mealplan';
import { replacedMeals } from '../dayfood';
import { mealNutrients } from '../nutrition';
import { uid } from '../platform';
import * as repo from '../repo';
import { app, setOverride } from './app.svelte';

export const meals = $state({
  day: null as repo.DayMeals | null,
  /** diese Woche, für die Rhythmus-Anzeige */
  week: {} as Record<string, repo.DayMeals>,
});

export async function loadWeek(dates: string[]): Promise<void> {
  const list = await Promise.all(dates.map((d) => repo.loadMeals(d)));
  meals.week = Object.fromEntries(list.map((d) => [d.date, d]));
}

export async function loadDay(date: string): Promise<void> {
  meals.day = await repo.loadMeals(date);
}

function persist(): void {
  if (meals.day) void repo.saveMeals($state.snapshot(meals.day) as repo.DayMeals);
}

/** null = nicht gegessen */
export function setPortion(mealId: string, portion: number | null): void {
  if (!meals.day) return;
  if (portion === null) delete meals.day.done[mealId];
  else meals.day.done[mealId] = portion;
  meals.day.doneAt ??= {};
  if (portion === null) delete meals.day.doneAt[mealId];
  else meals.day.doneAt[mealId] ??= Date.now();
  persist();
}

export function addExtra(label: string, kcal: number, protein: number, replaces?: string): void {
  if (!meals.day) return;
  meals.day.extras.push({ id: uid(), label, kcal, protein, at: Date.now(), ...(replaces ? { replaces } : {}) });
  persist();
}

export function removeExtra(id: string): void {
  if (!meals.day) return;
  meals.day.extras = meals.day.extras.filter((e) => e.id !== id);
  persist();
}

const hhmm = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * Leichter Tag: ab jetzt nur Trinkmahlzeiten. Was heute schon gegessen wurde, bleibt als Extra erhalten,
 * damit die Bilanz stimmt.
 */
export async function startLightDay(date: string, plan: PlanMeal[], titleOf: (meal: PlanMeal) => string, now = new Date()): Promise<void> {
  const day = meals.day;
  if (!day) return;
  const replaced = replacedMeals(day.extras);
  for (const meal of plan) {
    const portion = day.done[meal.id];
    if (!portion || replaced.has(meal.id)) continue;
    const n = mealNutrients(meal);
    day.extras.push({ id: uid(), label: titleOf(meal), kcal: Math.round(n.kcal * portion), protein: Math.round(n.protein * portion), at: day.doneAt?.[meal.id] ?? Date.now() });
  }
  day.done = {};
  day.doneAt = {};
  day.extras = day.extras.map(({ replaces: _unused, ...rest }) => rest);
  persist();
  await setOverride(lightKey(date), hhmm(now));
}

export async function endLightDay(date: string): Promise<void> {
  if (meals.day) {
    for (const id of Object.keys(meals.day.done)) if (/^l\d$/.test(id)) delete meals.day.done[id];
    persist();
  }
  await setOverride(lightKey(date), null);
}

export const isLightDay = (date: string) => typeof app.overrides[lightKey(date)] === 'string';
