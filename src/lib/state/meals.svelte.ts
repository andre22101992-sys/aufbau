// Abgehakte Mahlzeiten und Extras eines Tages.

import { uid } from '../platform';
import * as repo from '../repo';

export const meals = $state({ day: null as repo.DayMeals | null });

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
  persist();
}

export function addExtra(label: string, kcal: number, protein: number, replaces?: string): void {
  if (!meals.day) return;
  meals.day.extras.push({ id: uid(), label, kcal, protein, ...(replaces ? { replaces } : {}) });
  persist();
}

export function removeExtra(id: string): void {
  if (!meals.day) return;
  meals.day.extras = meals.day.extras.filter((e) => e.id !== id);
  persist();
}
