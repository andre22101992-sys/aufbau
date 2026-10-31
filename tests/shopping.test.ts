import { describe, expect, it } from 'vitest';
import { addDays } from '../src/lib/dates';
import { itemsSum, matchFood, packsOf, parseReceiptText, withMatches } from '../src/lib/receipt';
import { afterPurchase, currentPrice, monthBudget, priceChange, shoppingDay, shoppingList, stockAt } from '../src/lib/shopping';

const WEDNESDAY = '2026-11-04';
const SATURDAY = '2026-11-07';

describe('Einkaufsliste', () => {
  it('plant den Einkauf für den nächsten Samstag, am Samstag für heute', () => {
    expect(shoppingDay(WEDNESDAY)).toBe(SATURDAY);
    expect(shoppingDay(SATURDAY)).toBe(SATURDAY);
  });

  it('rundet auf Packungen und bleibt im Wochenbudget', () => {
    const list = shoppingList(WEDNESDAY, [], []);
    const eggs = list.items.find((i) => i.foodId === 'ei');
    expect(eggs?.packs).toBe(2);
    expect(list.items.find((i) => i.foodId === 'hack')?.amount).toBe('500 g');
    // Erste Woche ohne Vorrat: ganze Packungen Reis, Linsen usw.
    expect(list.euro).toBeGreaterThan(30);
    expect(list.euro).toBeLessThan(55);
  });

  it('zieht den Vorrat ab und rechnet den Verbrauch bis zum Einkauf mit', () => {
    const stock = [{ foodId: 'reis', grams: 2000, asOf: WEDNESDAY }];
    const list = shoppingList(WEDNESDAY, stock, []);
    expect(list.items.find((i) => i.foodId === 'reis')).toBeUndefined();
    expect(list.covered).toContain('Langkornreis');
    expect(stockAt(stock[0], addDays(WEDNESDAY, 7))).toBeLessThan(2000);
    expect(afterPurchase(undefined, 'hafer', 2, SATURDAY).grams).toBe(1000);
  });
});

describe('Preise und Budget', () => {
  const prices = [
    { id: 'a', foodId: 'hack', date: '2026-11-01', euro: 2.75 },
    { id: 'b', foodId: 'hack', date: '2026-11-08', euro: 3.29 },
  ];

  it('nimmt den neuesten Preis und erkennt Preissprünge', () => {
    expect(currentPrice('hack', prices)).toBe(3.29);
    expect(priceChange('hack', prices)).toBeCloseTo(0.196, 2);
    expect(currentPrice('reis', prices)).toBe(1.59);
  });

  it('rechnet das Monatsbudget mit 5,25 € pro Tag', () => {
    const m = monthBudget([{ id: 'r', date: '2026-11-07', total: 40, items: [] }], '2026-11-10');
    expect(m.budget).toBeCloseTo(157.5);
    expect(m.spent).toBe(40);
    expect(m.perDay).toBe(4);
  });
});

describe('Bon-Parser', () => {
  const BON = `Lidl
Hackfl. gem. 500g 2,79 A
Haferfl. zart 0,79 A
2 x 0,79
Bananen 1,52 A
0,898 kg x 1,69 EUR/kg
Schokolade 1,29 A
Preisvorteil -0,30
H-Milch 3,5% 6,54 A
Pfand 0,25 B
zu zahlen 12,88
Gegeben Karte 12,88`;

  it('liest Artikel, Rabatt, Pfand und Summe auch mit Mengen- und Gewichtszeilen', () => {
    const r = parseReceiptText(BON);
    expect(r.items.map((i) => i.text)).toEqual(['Hackfl. gem. 500g', 'Haferfl. zart', 'Bananen', 'Schokolade', 'H-Milch 3,5%', 'Pfand']);
    expect(r.items.find((i) => i.text === 'Schokolade')?.euro).toBe(0.99);
    expect(r.total).toBe(12.88);
    expect(itemsSum(r)).toBe(12.88);
  });

  it('verträgt unsauberen Text und ordnet Lebensmittel zu, gelernte Namen zuerst', () => {
    const r = withMatches(parseReceiptText('HAFERFL.ZART    0.79 A\n\nMILCH H 1,09\nXYZ Spezial 2,00 A\nSUMME  3,88'), { 'xyz spezial': 'gouda' });
    expect(r.items.map((i) => i.foodId)).toEqual(['hafer', 'milch', 'gouda']);
    expect(matchFood('Schokolade', {})).toBeUndefined();
    expect(packsOf(6.54, 1.09)).toBe(6);
  });
});
