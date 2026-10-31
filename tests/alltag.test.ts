import { describe, expect, it } from 'vitest';
import { mealsOf } from '../src/data/mealplan';
import { copyItems } from '../src/lib/copyday';
import { DRINK_TARGET_ML, addDrink, drinkShare } from '../src/lib/drink';
import { MAX_TEMPLATES, addTemplate, parseTemplates, removeTemplate } from '../src/lib/templates';
import { QUICK_FOODS, quickEntry, stepAmount } from '../src/lib/quickfood';
import { dayWrapUp } from '../src/lib/wrapup';

const plan = mealsOf('2026-11-04', {});
const title = (m: (typeof plan)[number]) => m.name;
const first = plan[0].id;

describe('Vorlagen', () => {
  it('ersetzt gleichnamige Vorlagen und begrenzt die Liste', () => {
    let list = addTemplate([], { label: 'Müsli', kcal: 370, protein: 15 });
    list = addTemplate(list, { label: 'Müsli', kcal: 400, protein: 16 });
    expect(list).toEqual([{ label: 'Müsli', kcal: 400, protein: 16 }]);
    for (let i = 0; i < 30; i++) list = addTemplate(list, { label: `V${i}`, kcal: 1, protein: 0 });
    expect(list).toHaveLength(MAX_TEMPLATES);
    expect(removeTemplate(list, 'V29').some((t) => t.label === 'V29')).toBe(false);
  });
  it('ignoriert leere Namen und kaputte Daten', () => {
    expect(addTemplate([], { label: '  ', kcal: 1, protein: 1 })).toEqual([]);
    expect(parseTemplates([{ label: 'A', kcal: 1, protein: 2 }, { label: 3 }, null])).toHaveLength(1);
    expect(parseTemplates('x')).toEqual([]);
  });
});

describe('Wie gestern', () => {
  const yesterday = { done: { [first]: 1 }, extras: [{ id: 'e1', label: 'Döner', kcal: 700, protein: 35 }] };
  it('bietet gestern Gegessenes an, das heute noch offen ist', () => {
    const items = copyItems(yesterday, plan, { done: {}, extras: [] }, title);
    expect(items.map((i) => i.kind)).toEqual(['meal', 'extra']);
  });
  it('lässt Doppeltes weg', () => {
    const today = { done: { [first]: 1 }, extras: [{ id: 'x', label: 'Döner', kcal: 700, protein: 35 }] };
    expect(copyItems(yesterday, plan, today, title)).toEqual([]);
  });
  it('gibt ohne Vortag nichts zurück', () => {
    expect(copyItems(null, plan, null, title)).toEqual([]);
  });
});

describe('Trinkziel', () => {
  it('zählt hoch, nie unter null und höchstens bis zum Ziel in der Anzeige', () => {
    expect(addDrink(undefined, 300)).toBe(300);
    expect(addDrink(100, -200)).toBe(0);
    expect(drinkShare(DRINK_TARGET_ML * 2)).toBe(1);
  });
});

describe('Tagesabschluss', () => {
  const base = { yesterday: 2, kcal: 2000, kcalTarget: 2800, tomorrowFirst: 'Milch und Banane um 5:30' };
  it('bleibt bei einem Tag ohne Essen freundlich', () => {
    const w = dayWrapUp({ ...base, today: 0, kcal: 0 });
    expect(w.title).toContain('okay');
    expect(w.lines.join(' ')).toContain('Morgen als Erstes');
  });
  it('lobt mehr Mahlzeiten als gestern', () => {
    expect(dayWrapUp({ ...base, today: 3 }).lines.join(' ')).toContain('Mehr als gestern (2)');
  });
  it('nennt einen Tag mit vier Mahlzeiten gut', () => {
    expect(dayWrapUp({ ...base, today: 4 }).title).toContain('Guter Tag');
  });
});

describe('Lebensmittel mit Menge', () => {
  const eggs = QUICK_FOODS.find((q) => q.food === 'ei')!;

  it('benennt Eier mit und ohne Remoulade und rechnet die Werte', () => {
    expect(quickEntry(eggs, 120)).toEqual({ label: '2 Eier', kcal: 168, protein: 15 });
    const withSauce = quickEntry(eggs, 120, 15);
    expect(withSauce.label).toBe('2 Eier, 1 EL Remoulade');
    expect(withSauce.kcal).toBe(168 + 50);
  });

  it('rechnet Milch in ml', () => {
    const milk = QUICK_FOODS.find((q) => q.food === 'milch')!;
    expect(quickEntry(milk, 250).label).toBe('250 ml Milch');
  });

  it('bleibt beim Hoch- und Runterzählen in den Grenzen', () => {
    expect(stepAmount(60, 60, -1, 60, 480)).toBe(60);
    expect(stepAmount(480, 60, 1, 60, 480)).toBe(480);
    expect(stepAmount(120, 60, 1, 60, 480)).toBe(180);
  });
});
