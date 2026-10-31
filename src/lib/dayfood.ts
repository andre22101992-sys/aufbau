// Tagesbilanz: was gegessen ist, was noch offen ist und was ein Extra ersetzt.

import type { PlanMeal } from '../data/mealplan';
import { mealNutrients } from './nutrition';
import type { Extra } from './repo';

export interface Totals {
  kcal: number;
  protein: number;
}

/** Geplante Mahlzeit → der Eintrag, der sie ersetzt */
export function replacedMeals(extras: Extra[]): Map<string, Extra> {
  const map = new Map<string, Extra>();
  for (const e of extras) if (e.replaces) map.set(e.replaces, e);
  return map;
}

/** Gegessen: abgehakte Mahlzeiten mit ihrer Portion plus alle Extras */
export function eatenTotals(plan: PlanMeal[], done: Record<string, number>, extras: Extra[]): Totals {
  const replaced = replacedMeals(extras);
  let kcal = 0;
  let protein = 0;
  for (const meal of plan) {
    const portion = done[meal.id];
    if (!portion || replaced.has(meal.id)) continue;
    const n = mealNutrients(meal);
    kcal += n.kcal * portion;
    protein += n.protein * portion;
  }
  for (const e of extras) {
    kcal += e.kcal;
    protein += e.protein;
  }
  return { kcal, protein };
}

/** Geplant: der Plan ohne ersetzte Mahlzeiten, dazu alle Extras */
export function plannedTotals(plan: PlanMeal[], extras: Extra[]): Totals {
  const replaced = replacedMeals(extras);
  let kcal = 0;
  let protein = 0;
  for (const meal of plan) {
    if (replaced.has(meal.id)) continue;
    const n = mealNutrients(meal);
    kcal += n.kcal;
    protein += n.protein;
  }
  for (const e of extras) {
    kcal += e.kcal;
    protein += e.protein;
  }
  return { kcal, protein };
}

/** Noch nicht gegessen und nicht ersetzt */
export function openMeals(plan: PlanMeal[], done: Record<string, number>, extras: Extra[]): PlanMeal[] {
  const replaced = replacedMeals(extras);
  return plan.filter((m) => !done[m.id] && !replaced.has(m.id));
}
