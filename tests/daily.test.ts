import { describe, expect, it } from 'vitest';
import { firstCookDay, mealsOf } from '../src/data/mealplan';
import { eatenTotals, openMeals, plannedTotals, replacedMeals } from '../src/lib/dayfood';
import { dayPlanNutrients, mealNutrients } from '../src/lib/nutrition';

const SATURDAY = '2026-10-31';
const SUNDAY = '2026-11-01';
const MONDAY = '2026-11-02';

describe('Erster Kochtag', () => {
  const options = { startDate: MONDAY };

  it('liegt auf dem Samstag vor dem Start', () => {
    expect(firstCookDay(MONDAY)).toBe(SATURDAY);
    expect(firstCookDay(null)).toBeNull();
  });

  it('hat weder Oats noch Reste von gestern, dafür Shake und Eier-Mittag, und trifft die Ziele', () => {
    const meals = mealsOf(SATURDAY, options);
    expect(meals.map((m) => m.id)).toEqual(['frueh', 'oats', 'mittag', 'snack', 'abend']);
    expect(meals.find((m) => m.id === 'oats')?.name).toBe('Milch-Hafer-Shake');
    expect(meals.find((m) => m.id === 'mittag')?.kind).toBe('fixed');
    const n = dayPlanNutrients(SATURDAY, options);
    expect(n.kcal).toBeGreaterThanOrEqual(2450);
    expect(n.kcal).toBeLessThanOrEqual(2900);
    expect(n.protein).toBeGreaterThanOrEqual(120);
  });

  it('lässt alle anderen Tage unverändert; ab Sonntag gibt es Reste und frischen Haferbrei', () => {
    const sunday = mealsOf(SUNDAY, options);
    const lunch = sunday.find((m) => m.id === 'mittag');
    expect(lunch?.kind === 'dish' && lunch.recipeId).toBe('hack');
    expect(sunday.find((m) => m.id === 'oats')?.name).toBe('Haferbrei, frisch');
    expect(mealsOf(SATURDAY).some((m) => m.kind === 'dish' && m.id === 'mittag')).toBe(true);
  });
});

describe('Kalorienziel', () => {
  it('lässt die Oats den Unterschied zu 2.800 kcal tragen', () => {
    const base = dayPlanNutrients(MONDAY).kcal;
    for (const [target, delta] of [[2500, -300], [2650, -150], [2950, 150], [3050, 250]] as const) {
      const d = dayPlanNutrients(MONDAY, { kcalTarget: target }).kcal - base;
      expect(Math.abs(d - delta), `${target}`).toBeLessThan(40);
    }
  });

  it('lässt auch beim niedrigsten einstellbaren Ziel an allen Tagen noch Haferflocken und Milch übrig', () => {
    for (const date of [MONDAY, SUNDAY]) {
      const oats = mealsOf(date, { kcalTarget: 2500 }).find((m) => m.id === 'oats');
      expect(oats?.kind === 'fixed' && oats.items.every((i) => i.grams > 0), date).toBe(true);
    }
  });
});

describe('Extras ersetzen Mahlzeiten', () => {
  const plan = mealsOf(MONDAY);
  const extras = [{ id: 'x', label: 'Schokomüsli mit Milch', kcal: 370, protein: 15, replaces: 'frueh' }];
  const oats = plan.find((m) => m.id === 'oats')!;

  it('zählt das Extra statt der geplanten Mahlzeit', () => {
    const planned = plannedTotals(plan, extras);
    const all = plan.reduce((s, m) => s + mealNutrients(m).kcal, 0);
    const frueh = mealNutrients(plan.find((m) => m.id === 'frueh')!).kcal;
    expect(planned.kcal).toBeCloseTo(all - frueh + 370);
    const eaten = eatenTotals(plan, { oats: 1, frueh: 1 }, extras);
    expect(eaten.kcal).toBeCloseTo(mealNutrients(oats).kcal + 370);
    expect(eaten.protein).toBeCloseTo(mealNutrients(oats).protein + 15);
  });

  it('nimmt ersetzte und gegessene Mahlzeiten aus der offenen Liste', () => {
    expect(replacedMeals(extras).has('frueh')).toBe(true);
    expect(openMeals(plan, { oats: 1 }, extras).map((m) => m.id)).toEqual(['mittag', 'snack', 'abend', 'spaet']);
    expect(openMeals(plan, {}, []).length).toBe(plan.length);
  });
});

describe('Remoulade', () => {
  it('gibt es nur zu den Eiern allein am Wochenende', () => {
    const snack = (date: string) => mealsOf(date).find((m) => m.id === 'snack');
    const items = (date: string) => (snack(date)?.kind === 'fixed' ? (snack(date) as { items: { food: string }[] }).items.map((i) => i.food) : []);
    expect(items(SATURDAY)).toContain('remoulade');
    expect(items(SUNDAY)).toContain('remoulade');
    expect(items(MONDAY)).not.toContain('remoulade');
    expect(mealsOf(SATURDAY, { startDate: MONDAY }).find((m) => m.id === 'mittag')?.name).toBe('Eier, Banane und Milch');
  });
});
