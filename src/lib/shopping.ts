// Einkaufsliste aus dem Wochenplan, auf Packungen gerundet, abzüglich Vorrat. Dazu Vorrat, Preise und Budget.

import { getFood } from '../data/foods';
import { dinnerOf, mealsOf, type PlanOptions } from '../data/mealplan';
import { getRecipe } from '../data/recipes';
import { BUDGET_PER_DAY, SECTIONS, shopInfo, type Section } from '../data/shop';
import { addDays, compareKeys, diffDays, nextWeekday, type DateKey } from './dates';

/** Verbrauch eines Tages in Gramm: feste Mahlzeiten plus das Abendessen (doppelte Menge, die zweite Portion ist morgen Mittag) */
export function dayUsage(date: DateKey, options: PlanOptions = {}): Map<string, number> {
  const usage = new Map<string, number>();
  const add = (food: string, grams: number) => usage.set(food, (usage.get(food) ?? 0) + grams);
  for (const meal of mealsOf(date, options)) if (meal.kind === 'fixed') for (const i of meal.items) add(i.food, i.grams);
  for (const i of getRecipe(dinnerOf(date, options.overrides)).ingredients) add(i.food, i.grams);
  return usage;
}

export function rangeUsage(from: DateKey, toExclusive: DateKey, options: PlanOptions = {}): Map<string, number> {
  const total = new Map<string, number>();
  for (let d = from; compareKeys(d, toExclusive) < 0; d = addDays(d, 1)) {
    for (const [food, grams] of dayUsage(d, options)) total.set(food, (total.get(food) ?? 0) + grams);
  }
  return total;
}

/** Einkaufstag: heute, wenn Samstag ist, sonst der nächste Samstag */
export function shoppingDay(today: DateKey): DateKey {
  return nextWeekday(today, 5, true);
}

// ---------- Vorrat ----------

export interface StockEntry {
  foodId: string;
  /** Menge am Tag asOf */
  grams: number;
  asOf: DateKey;
}

/** Geschätzter Vorrat an einem Tag: Stand minus geplanter Verbrauch seitdem */
export function stockAt(entry: StockEntry | undefined, date: DateKey, options: PlanOptions = {}): number {
  if (!entry) return 0;
  if (compareKeys(date, entry.asOf) <= 0) return entry.grams;
  const used = rangeUsage(entry.asOf, date, options).get(entry.foodId) ?? 0;
  return Math.max(0, entry.grams - used);
}

// ---------- Preise ----------

export interface PriceEntry {
  id: string;
  foodId: string;
  date: DateKey;
  /** Preis einer Packung */
  euro: number;
}

export function currentPrice(foodId: string, prices: PriceEntry[]): number {
  const latest = prices.filter((p) => p.foodId === foodId).sort((a, b) => compareKeys(b.date, a.date))[0];
  return latest?.euro ?? getFood(foodId).pack.euro;
}

/** Preisanstieg gegenüber dem vorigen Preis, z. B. 0,2 = +20 % */
export function priceChange(foodId: string, prices: PriceEntry[]): number | null {
  const list = prices.filter((p) => p.foodId === foodId).sort((a, b) => compareKeys(b.date, a.date));
  const previous = list[1]?.euro ?? (list[0] ? getFood(foodId).pack.euro : undefined);
  if (!list[0] || !previous) return null;
  return list[0].euro / previous - 1;
}

// ---------- Liste ----------

export interface ShoppingItem {
  foodId: string;
  name: string;
  icon: string;
  section: Section;
  packs: number;
  /** z. B. „2 × 10 Stück“ */
  amount: string;
  euro: number;
  /** Grundvorrat, der nicht zum Wochenbudget zählt */
  basic: boolean;
}

export interface ShoppingList {
  day: DateKey;
  items: ShoppingItem[];
  euro: number;
  budget: number;
  /** Vorrat reicht, steht deshalb nicht auf der Liste */
  covered: string[];
}

export function shoppingList(today: DateKey, stock: StockEntry[], prices: PriceEntry[], options: PlanOptions = {}): ShoppingList {
  const day = shoppingDay(today);
  const need = rangeUsage(day, addDays(day, 7), options);
  for (const basic of ['oel', 'bruehe', 'gewuerz']) if (!need.has(basic)) need.set(basic, 1);
  const items: ShoppingItem[] = [];
  const covered: string[] = [];
  for (const [foodId, grams] of need) {
    const food = getFood(foodId);
    const have = stockAt(stock.find((s) => s.foodId === foodId), day, options);
    const missing = grams - have;
    if (missing <= 0) {
      covered.push(food.name);
      continue;
    }
    const packs = Math.ceil(missing / food.pack.grams);
    const info = shopInfo(foodId);
    items.push({
      foodId,
      name: food.name,
      icon: info.icon,
      section: info.section,
      packs,
      amount: packs > 1 ? `${packs} × ${food.pack.label}` : food.pack.label,
      euro: packs * currentPrice(foodId, prices),
      basic: !!food.basic,
    });
  }
  items.sort((a, b) => SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section) || a.name.localeCompare(b.name, 'de'));
  return { day, items, euro: items.filter((i) => !i.basic).reduce((s, i) => s + i.euro, 0), budget: 7 * BUDGET_PER_DAY, covered };
}

/** Vorrat nach dem Kauf: alter Stand plus gekaufte Packungen */
export function afterPurchase(entry: StockEntry | undefined, foodId: string, packs: number, date: DateKey, options: PlanOptions = {}): StockEntry {
  return { foodId, grams: stockAt(entry, date, options) + packs * getFood(foodId).pack.grams, asOf: date };
}

// ---------- Monatsbudget ----------

export interface Receipt {
  id: string;
  date: DateKey;
  total: number;
  items: { text: string; euro: number; foodId?: string }[];
}

export function monthBudget(receipts: Receipt[], today: DateKey): { spent: number; budget: number; perDay: number; days: number } {
  const month = today.slice(0, 7);
  const spent = receipts.filter((r) => r.date.startsWith(month)).reduce((s, r) => s + r.total, 0);
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const day = diffDays(today, `${month}-01`) + 1;
  return { spent, budget: daysInMonth * BUDGET_PER_DAY, perDay: spent / day, days: daysInMonth };
}
