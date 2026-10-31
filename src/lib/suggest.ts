// Gericht tauschen: passende Alternativen für einen Tag, sortiert nach Haltbarkeit, Kosten, Protein,
// Abwechslung und deinen Bewertungen. Dazu der Nährstoff-Check der Woche.

import { dinnerOf } from '../data/mealplan';
import { RECIPES, type Recipe } from '../data/recipes';
import { addDays, weekStart, weekday, type DateKey } from './dates';
import { dayPlanNutrients, portionOf, type Nutrients } from './nutrition';

export function ratingKey(recipeId: string): string {
  return `rating:${recipeId}`;
}

/** Ohne Gefrierfach: Hack nur am Einkaufswochenende, Hähnchen bis Dienstag */
export function freshEnough(recipe: Recipe, date: DateKey): boolean {
  const day = weekday(date);
  const foods = recipe.ingredients.map((i) => i.food);
  if (foods.includes('hack') && day < 5) return false;
  if (foods.includes('haehnchen') && day > 1 && day < 5) return false;
  return true;
}

export interface Suggestion {
  recipe: Recipe;
  reasons: string[];
  score: number;
}

export function suggestFor(date: DateKey, overrides: Record<string, unknown>): Suggestion[] {
  const current = dinnerOf(date, overrides);
  const monday = weekStart(date);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => d !== date).map((d) => dinnerOf(d, overrides));
  return RECIPES.filter((r) => r.id !== current && freshEnough(r, date) && overrides[ratingKey(r.id)] !== -1)
    .map((recipe) => {
      const n = portionOf(recipe);
      const reasons: string[] = [];
      let score = n.protein / Math.max(0.5, n.euro);
      if (n.protein >= 45) reasons.push(`viel Protein (${Math.round(n.protein)} g)`);
      if (n.euro <= 1.3) reasons.push(`günstig (${n.euro.toFixed(2).replace('.', ',')} € pro Portion)`);
      if (week.includes(recipe.id)) score -= 15;
      else reasons.push('bringt Abwechslung');
      if (overrides[ratingKey(recipe.id)] === 1) {
        score += 10;
        reasons.unshift('mag ich');
      }
      return { recipe, reasons, score };
    })
    .sort((a, b) => b.score - a.score);
}

/** Richtwerte der DGE pro Tag für Männer */
export const NUTRIENT_TARGETS = { fiber: 30, calcium: 1000, iron: 10, vitaminC: 110 } as const;
export type NutrientKey = keyof typeof NUTRIENT_TARGETS;

export const NUTRIENT_LABELS: Record<NutrientKey, { name: string; unit: string; tip: string }> = {
  fiber: { name: 'Ballaststoffe', unit: 'g', tip: 'Eine Handvoll Haferflocken mehr in die Oats oder öfter Linsen.' },
  calcium: { name: 'Calcium', unit: 'mg', tip: 'Ein Glas Milch mehr am Tag oder 30 g Gouda.' },
  iron: { name: 'Eisen', unit: 'mg', tip: 'Öfter Linsen oder Kidneybohnen, dazu Paprika für die Aufnahme.' },
  vitaminC: { name: 'Vitamin C', unit: 'mg', tip: 'Eine Paprika mehr pro Woche, roh als Snack oder ins Essen.' },
};

/** Durchschnitt pro Tag über die Woche */
export function weekNutrients(date: DateKey, overrides: Record<string, unknown>, kcalTarget: number, startDate: DateKey | null = null): Nutrients {
  const monday = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => dayPlanNutrients(addDays(monday, i), { overrides, kcalTarget, startDate }));
  const sum = days.reduce((a, d) => ({ ...a, ...Object.fromEntries(Object.keys(d).map((k) => [k, (a as never)[k] + (d as never)[k]])) }), {
    kcal: 0,
    protein: 0,
    fiber: 0,
    calcium: 0,
    iron: 0,
    vitaminC: 0,
    euro: 0,
  } as Nutrients);
  return Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, v / 7])) as unknown as Nutrients;
}
