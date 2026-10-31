// „Wie gestern“: Was gestern gegessen wurde, lässt sich mit einem Tipp für heute übernehmen.

import type { PlanMeal } from '../data/mealplan';
import { replacedMeals } from './dayfood';
import { mealNutrients } from './nutrition';
import type { DayMeals, Extra } from './repo';

export type CopyItem =
  | { key: string; kind: 'meal'; label: string; kcal: number; mealId: string; portion: number }
  | { key: string; kind: 'extra'; label: string; kcal: number; extra: Pick<Extra, 'label' | 'kcal' | 'protein' | 'replaces'> };

const sameExtra = (a: Pick<Extra, 'label' | 'kcal' | 'protein'>, b: Pick<Extra, 'label' | 'kcal' | 'protein'>) =>
  a.label === b.label && a.kcal === b.kcal && a.protein === b.protein;

/**
 * Was von gestern für heute infrage kommt: abgehakte Mahlzeiten, die auch heute im Plan stehen und noch offen sind,
 * und Extras, die heute noch nicht eingetragen sind.
 */
export function copyItems(yesterday: Pick<DayMeals, 'done' | 'extras'> | null | undefined, plan: PlanMeal[], today: Pick<DayMeals, 'done' | 'extras'> | null | undefined, titleOf: (meal: PlanMeal) => string): CopyItem[] {
  if (!yesterday) return [];
  const doneToday = today?.done ?? {};
  const extrasToday = today?.extras ?? [];
  const replacedToday = replacedMeals(extrasToday);
  const items: CopyItem[] = [];
  for (const meal of plan) {
    const portion = yesterday.done[meal.id];
    if (!portion || doneToday[meal.id] || replacedToday.has(meal.id)) continue;
    items.push({ key: `meal:${meal.id}`, kind: 'meal', label: titleOf(meal), kcal: Math.round(mealNutrients(meal).kcal * portion), mealId: meal.id, portion });
  }
  for (const extra of yesterday.extras) {
    if (extrasToday.some((e) => sameExtra(e, extra))) continue;
    const meal = extra.replaces ? plan.find((m) => m.id === extra.replaces) : undefined;
    const replaces = meal && !doneToday[meal.id] && !replacedToday.has(meal.id) ? meal.id : undefined;
    items.push({
      key: `extra:${extra.id}`,
      kind: 'extra',
      label: extra.label,
      kcal: extra.kcal,
      extra: { label: extra.label, kcal: extra.kcal, protein: extra.protein, ...(replaces ? { replaces } : {}) },
    });
  }
  return items;
}
