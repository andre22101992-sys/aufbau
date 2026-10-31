import { describe, expect, it } from 'vitest';
import { firstCookDay, mealTime, mealsOf } from '../src/data/mealplan';
import { DEFAULT_SETTINGS, withDefaults } from '../src/lib/model';
import { reminderEvents } from '../src/lib/reminders';
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

describe('Eigene Uhrzeiten der Mahlzeiten', () => {
  const times = {
    frueh: ['06:30', '08:30'] as [string, string],
    oats: ['09:00', '10:00'] as [string, string],
    mittag: ['12:00', '13:00'] as [string, string],
    snack: ['15:30', '16:00'] as [string, string],
    abendMoDo: '19:00',
    abendFr: '18:15',
    abendWe: '19:00',
    spaet: '21:15',
  };

  it('stellt Plan und Anzeige auf deine Zeiten um', () => {
    const meals = mealsOf(MONDAY, { mealTimes: times });
    const time = (id: string) => meals.find((m) => m.id === id);
    const fixed = time('frueh');
    expect(fixed?.kind === 'fixed' && fixed.time[0]).toBe('06:30');
    const dinner = time('abend');
    expect(dinner?.kind === 'dish' && dinner.time).toBe('19:00');
    expect(meals.map((m) => m.id)).toEqual(['frueh', 'oats', 'mittag', 'snack', 'abend', 'spaet']);
    expect(mealTime(fixed!)).toBe('6:30');
  });

  it('ändert die Kalendertermine mit', () => {
    const events = reminderEvents({ ...DEFAULT_SETTINGS, startDate: MONDAY, mealTimes: times }, ['essen'], '2026-10-31');
    expect(events.find((e) => e.uid.includes('frueh-woche'))?.time).toBe('06:30');
    expect(events.find((e) => e.uid.includes('abend-mo-do'))?.time).toBe('19:00');
  });

  it('ergänzt ältere Einstellungen ohne Mahlzeiten-Zeiten um die Standardzeiten', () => {
    expect(withDefaults({ onboarded: true }).mealTimes.frueh).toEqual(['05:30', '08:30']);
  });
});

import { intakeSummary } from '../src/lib/intake';

describe('Aufnahme der letzten Tage', () => {
  const day = (date: string, done: Record<string, number>, extras: { id: string; label: string; kcal: number; protein: number }[] = []) => ({ date, done, extras });

  it('mittelt nur Tage mit Einträgen und zählt gute Tage', () => {
    const days = {
      '2026-11-02': day('2026-11-02', { frueh: 1, oats: 1, mittag: 1, snack: 1, abend: 1 }),
      '2026-11-03': day('2026-11-03', {}, [{ id: 'x', label: 'Müsli', kcal: 370, protein: 15 }]),
      '2026-11-04': day('2026-11-04', {}),
    };
    const summary = intakeSummary(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'], days);
    expect(summary.days).toBe(2);
    expect(summary.goodDays).toBe(1);
    const full = mealsOf('2026-11-02')
      .filter((m) => m.id !== 'spaet')
      .reduce((sum, m) => sum + mealNutrients(m).kcal, 0);
    expect(summary.avgKcal).toBeCloseTo((full + 370) / 2, 1);
    expect(intakeSummary(['2026-11-05'], {}).avgKcal).toBeNull();
  });
});

import { describeItem, mealAmounts } from '../src/lib/nutrition';

describe('Mengen bei den Mahlzeiten', () => {
  it('nennt für jede feste Mahlzeit, wie viel du isst', () => {
    const first = mealsOf(SATURDAY, { startDate: MONDAY });
    expect(mealAmounts(first.find((m) => m.id === 'mittag')!)).toBe('3 Eier, 1 Banane, 250 ml Milch');
    expect(mealAmounts(first.find((m) => m.id === 'oats')!)).toBe('400 ml Milch, 60 g Haferflocken, 1 Banane');
    expect(mealAmounts(first.find((m) => m.id === 'snack')!)).toBe('2 Eier, 1 EL Remoulade');
    expect(mealAmounts(mealsOf(MONDAY).find((m) => m.id === 'frueh')!)).toBe('250 ml Milch, 1 Banane');
    expect(mealAmounts(mealsOf(MONDAY).find((m) => m.id === 'snack')!)).toBe('2 Eier, 30 g Gouda');
  });

  it('beschreibt Gerichte als Portion', () => {
    const monday = mealsOf(MONDAY);
    expect(mealAmounts(monday.find((m) => m.id === 'abend')!)).toContain('1 Portion');
    expect(mealAmounts(monday.find((m) => m.id === 'mittag')!)).toContain('aus der Box');
  });

  it('setzt hinter Maßeinheiten den Namen und lässt gezählte Dinge allein', () => {
    expect(describeItem('ei', 120)).toBe('2 Eier');
    expect(describeItem('oel', 20)).toBe('2 EL Öl');
    expect(describeItem('hafer', 100)).toBe('100 g Haferflocken');
  });
});
