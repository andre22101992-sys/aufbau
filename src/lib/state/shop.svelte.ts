// Einkauf: Vorrat, Preise, Bons und gelernte Bon-Namen.

import { getFood } from '../../data/foods';
import { todayKey } from '../dates';
import { uid } from '../platform';
import { packsOf, type ReceiptLine } from '../receipt';
import * as repo from '../repo';
import { afterPurchase, currentPrice, stockAt, type PriceEntry, type Receipt, type StockEntry } from '../shopping';
import { app } from './app.svelte';

export const shop = $state({
  loaded: false,
  stock: [] as StockEntry[],
  prices: [] as PriceEntry[],
  receipts: [] as Receipt[],
  aliases: {} as Record<string, string>,
});

export function planOptions() {
  return { overrides: app.overrides, kcalTarget: app.settings.kcalTarget };
}

export async function loadShop(): Promise<void> {
  const [stock, prices, receipts, aliases] = await Promise.all([repo.listStock(), repo.listPrices(), repo.listReceipts(), repo.listAliases()]);
  Object.assign(shop, { stock, prices, receipts, aliases, loaded: true });
}

async function putStock(entry: StockEntry): Promise<void> {
  await repo.saveStock(entry);
  shop.stock = [...shop.stock.filter((s) => s.foodId !== entry.foodId), entry];
}

/** Gekauft (abgehakt) oder wieder zurückgenommen */
export async function changeStock(foodId: string, packs: number): Promise<void> {
  const today = todayKey();
  const entry = shop.stock.find((s) => s.foodId === foodId);
  const next = afterPurchase(entry, foodId, packs, today, planOptions());
  await putStock({ ...next, grams: Math.max(0, next.grams) });
}

/** „Noch da?“ mit Nein beantwortet */
export async function clearStock(foodId: string): Promise<void> {
  await putStock({ foodId, grams: 0, asOf: todayKey() });
}

export function stockNow(foodId: string): number {
  return stockAt(
    shop.stock.find((s) => s.foodId === foodId),
    todayKey(),
    planOptions(),
  );
}

/**
 * Bon übernehmen: Ausgaben speichern, Preise aktualisieren, gelernte Namen merken und den Vorrat auffüllen.
 * Bereits abgehakte Artikel kommen nicht noch einmal in den Vorrat.
 */
export async function importReceipt(lines: ReceiptLine[], total: number, alreadyChecked: string[], learned: Record<string, string>): Promise<string[]> {
  const today = todayKey();
  const receipt: Receipt = { id: uid(), date: today, total, items: lines.map((l) => ({ ...l })) };
  await repo.saveReceipt(receipt);
  shop.receipts = [...shop.receipts, receipt];
  for (const [text, foodId] of Object.entries(learned)) {
    await repo.saveAlias(text, foodId);
    shop.aliases[text] = foodId;
  }
  const bought: string[] = [];
  for (const line of lines) {
    if (!line.foodId) continue;
    const food = getFood(line.foodId);
    const packs = packsOf(line.euro, currentPrice(line.foodId, shop.prices));
    const price: PriceEntry = { id: `${line.foodId}:${today}`, foodId: line.foodId, date: today, euro: Math.round((line.euro / packs) * 100) / 100 };
    if (!food.basic || price.euro > 0) {
      await repo.savePrice(price);
      shop.prices = [...shop.prices.filter((p) => p.id !== price.id), price];
    }
    if (!alreadyChecked.includes(line.foodId)) await changeStock(line.foodId, packs);
    bought.push(line.foodId);
  }
  return bought;
}
