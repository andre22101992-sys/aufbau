// Nährwerte, Kosten und Mengen: rechnet Rezepte und Tagespläne aus und passt Mengen an die Portionen an.

import { getFood } from '../data/foods';
import { mealsOf, type PlanMeal, type PlanOptions } from '../data/mealplan';
import { getRecipe, type Recipe, type Step } from '../data/recipes';
import type { DateKey } from './dates';
import { formatDecimal } from './numbers';

export interface Nutrients {
  kcal: number;
  protein: number;
  fiber: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  /** anteilige Kosten ohne Grundvorrat */
  euro: number;
}

export const ZERO: Nutrients = { kcal: 0, protein: 0, fiber: 0, calcium: 0, iron: 0, vitaminC: 0, euro: 0 };

export function add(a: Nutrients, b: Nutrients, factor = 1): Nutrients {
  return {
    kcal: a.kcal + b.kcal * factor,
    protein: a.protein + b.protein * factor,
    fiber: a.fiber + b.fiber * factor,
    calcium: a.calcium + b.calcium * factor,
    iron: a.iron + b.iron * factor,
    vitaminC: a.vitaminC + b.vitaminC * factor,
    euro: a.euro + b.euro * factor,
  };
}

export function nutrientsOf(items: { food: string; grams: number }[]): Nutrients {
  return items.reduce((sum, { food: id, grams }) => {
    const food = getFood(id);
    const f = grams / 100;
    return add(sum, {
      kcal: food.kcal * f,
      protein: food.protein * f,
      fiber: food.fiber * f,
      calcium: food.calcium * f,
      iron: food.iron * f,
      vitaminC: food.vitaminC * f,
      euro: food.basic ? 0 : (food.pack.euro / food.pack.grams) * grams,
    });
  }, ZERO);
}

export function portionOf(recipe: Recipe): Nutrients {
  return add(ZERO, nutrientsOf(recipe.ingredients), 1 / recipe.servings);
}

export function mealNutrients(meal: PlanMeal): Nutrients {
  return meal.kind === 'fixed' ? nutrientsOf(meal.items) : portionOf(getRecipe(meal.recipeId));
}

export function dayPlanNutrients(date: DateKey, options: PlanOptions = {}): Nutrients {
  return mealsOf(date, options).reduce((sum, meal) => add(sum, mealNutrients(meal)), ZERO);
}

// ---------- Mengen ----------

/** Menge lesbar: „300 g“, „2 Eier“, „1 Zwiebel“, „3 EL“, „1,5 Dosen“ */
export function formatAmount(foodId: string, grams: number): string {
  const food = getFood(foodId);
  const unit = food.unit;
  if (unit && unit.name !== 'ml') {
    const count = Math.round((grams / unit.grams) * 2) / 2;
    if (count > 0) return `${formatDecimal(count, 1)} ${count === 1 ? unit.name : unit.plural}`;
  }
  const rounded = grams >= 100 ? Math.round(grams / 5) * 5 : Math.round(grams);
  return `${rounded.toLocaleString('de-DE')} ${unit?.name === 'ml' ? 'ml' : 'g'}`;
}

const SHORT_NAMES: Record<string, string> = {
  milch: 'Milch',
  hafer: 'Haferflocken',
  gouda: 'Gouda',
  remoulade: 'Remoulade',
  nudeln: 'Nudeln',
  reis: 'Reis',
  oel: 'Öl',
};

/** Maßeinheiten, hinter denen der Name des Lebensmittels stehen muss („1 EL Remoulade“, aber „3 Eier“) */
const MEASURE_UNITS = new Set(['EL', 'TL', 'Dose', 'Bund', 'ml']);

/** „3 Eier“, „250 ml Milch“, „1 EL Remoulade“, „100 g Haferflocken“ */
export function describeItem(foodId: string, grams: number): string {
  const food = getFood(foodId);
  const amount = formatAmount(foodId, grams);
  if (food.unit && !MEASURE_UNITS.has(food.unit.name)) return amount;
  return `${amount} ${SHORT_NAMES[foodId] ?? food.name}`;
}

/** Was du für diese Mahlzeit auf den Teller bringst */
export function mealAmounts(meal: PlanMeal): string {
  if (meal.kind === 'fixed') return meal.items.map((i) => describeItem(i.food, i.grams)).join(', ');
  return meal.leftover ? '1 Portion, die zweite aus der Box' : '1 Portion von dem, was du kochst';
}

export interface ScaledIngredient {
  food: string;
  name: string;
  grams: number;
  amount: string;
}

export function scaleIngredients(recipe: Recipe, portions: number): ScaledIngredient[] {
  const factor = portions / recipe.servings;
  return recipe.ingredients.map(({ food, grams }) => ({ food, name: getFood(food).name, grams: grams * factor, amount: formatAmount(food, grams * factor) }));
}

/** Faktor, wenn eine Zutat vorgegeben ist („ich habe nur 400 g Hähnchen“) */
export function portionsFor(recipe: Recipe, foodId: string, grams: number): number {
  const base = recipe.ingredients.find((i) => i.food === foodId)?.grams;
  if (!base) return recipe.servings;
  return Math.max(0.5, Math.round(((grams / base) * recipe.servings) * 2) / 2);
}

/** Setzt die Mengen in den Schritt-Text ein */
export function stepText(step: Step, recipe: Recipe, portions: number): string {
  const factor = portions / recipe.servings;
  const gramsOf = (id: string) => (recipe.ingredients.find((i) => i.food === id)?.grams ?? 0) * factor;
  return step.text
    .replace(/\{wasser:(\w+):([\d.]+)\}/g, (_, id: string, perGram: string) => `${(Math.round((gramsOf(id) * Number(perGram)) / 50) * 50).toLocaleString('de-DE')} ml`)
    .replace(/\{(\w+)\}/g, (_, id: string) => formatAmount(id, gramsOf(id)));
}

/** Passt zu viel in den Crispi, braucht es mehrere Durchgänge */
export function crispiRounds(recipe: Recipe, portions: number): number {
  if (!recipe.crispiMax) return 1;
  const base = recipe.ingredients.find((i) => i.food === recipe.crispiMax!.food)?.grams ?? 0;
  return Math.max(1, Math.ceil((base * portions) / recipe.servings / recipe.crispiMax.grams));
}

/** Gesamtdauer in Minuten; bei mehreren Crispi-Durchgängen verlängern sich die Crispi-Schritte */
export function totalMinutes(recipe: Recipe, portions = recipe.servings): number {
  const rounds = crispiRounds(recipe, portions);
  return Math.max(...recipe.steps.map((s) => s.at + s.minutes * (s.device === 'crispi' ? rounds : 1)));
}
