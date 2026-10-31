import { describe, expect, it } from 'vitest';
import { FOODS } from '../src/data/foods';
import { DINNER_BY_WEEKDAY, mealsOf } from '../src/data/mealplan';
import { RECIPES, getRecipe } from '../src/data/recipes';
import { addDays } from '../src/lib/dates';
import { crispiRounds, dayPlanNutrients, formatAmount, portionOf, portionsFor, scaleIngredients, stepText, totalMinutes } from '../src/lib/nutrition';

const MONDAY = '2026-11-02';
const week = Array.from({ length: 7 }, (_, i) => addDays(MONDAY, i));

describe('Wochenplan', () => {
  it.each(week)('trifft am %s die Ziele: 2.700–2.900 kcal und mindestens 120 g Protein', (date) => {
    const day = dayPlanNutrients(date);
    expect(day.kcal).toBeGreaterThanOrEqual(2700);
    expect(day.kcal).toBeLessThanOrEqual(2900);
    expect(day.protein).toBeGreaterThanOrEqual(120);
  });

  it('kostet höchstens 38,50 € pro Woche, ohne Grundvorrat', () => {
    const euro = week.reduce((sum, d) => sum + dayPlanNutrients(d).euro, 0);
    expect(euro).toBeLessThanOrEqual(38.5);
  });

  it('gibt mittags den Rest vom Vorabend und nie zweimal dasselbe am Tag', () => {
    for (const date of week) {
      const meals = mealsOf(date);
      const lunch = meals.find((m) => m.id === 'mittag');
      const dinner = meals.find((m) => m.id === 'abend');
      expect(lunch?.kind === 'dish' && lunch.recipeId).toBe(DINNER_BY_WEEKDAY[(new Date(date).getDay() + 5) % 7]);
      expect(lunch?.kind === 'dish' && dinner?.kind === 'dish' && lunch.recipeId !== dinner.recipeId).toBe(true);
    }
  });
});

describe('Rezepte', () => {
  it('haben nur bekannte Zutaten, mindestens 35 g Protein und Schritte mit Gerät', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    for (const r of RECIPES) {
      for (const i of r.ingredients) expect(ids.has(i.food), `${r.id}: ${i.food}`).toBe(true);
      expect(portionOf(r).protein, r.id).toBeGreaterThanOrEqual(35);
      expect(r.steps.length).toBeGreaterThan(3);
      for (const s of r.steps) expect(stepText(s, r, 2)).not.toMatch(/\{/);
    }
  });

  it('belegt im Zeitstrahl kein Gerät doppelt', () => {
    for (const r of RECIPES) {
      for (const device of ['topf', 'crispi'] as const) {
        const steps = r.steps.filter((s) => s.device === device && s.minutes > 1).sort((a, b) => a.at - b.at);
        for (let i = 1; i < steps.length; i++) expect(steps[i].at, `${r.id} ${device}`).toBeGreaterThanOrEqual(steps[i - 1].at + steps[i - 1].minutes - 0.01);
      }
    }
  });

  it('rechnet Mengen, Wasser und Crispi-Durchgänge für andere Portionen um', () => {
    const r = getRecipe('haehnchen');
    expect(scaleIngredients(r, 4).find((i) => i.food === 'haehnchen')?.amount).toBe('600 g');
    expect(stepText(r.steps[0], r, 4)).toContain('1.000 ml Wasser');
    expect(crispiRounds(r, 4)).toBe(1);
    expect(crispiRounds(r, 6)).toBe(2);
    expect(totalMinutes(r, 6)).toBeGreaterThan(totalMinutes(r, 2));
    expect(portionsFor(r, 'haehnchen', 400)).toBe(2.5);
  });

  it('zeigt Haushaltsmaße', () => {
    expect(formatAmount('ei', 120)).toBe('2 Eier');
    expect(formatAmount('oel', 30)).toBe('3 EL');
    expect(formatAmount('zwiebel', 150)).toBe('1,5 Zwiebeln');
    expect(formatAmount('milch', 300)).toBe('300 ml');
  });
});
