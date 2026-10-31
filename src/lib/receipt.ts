// Bon auslesen: aus dem Text von „Text scannen“ (oder einem Lidl-Plus-Screenshot) Artikel, Preise und Summe holen
// und den Lebensmitteln zuordnen. Die App merkt sich, wie ein Artikel auf dem Bon heißt.

import { FOODS } from '../data/foods';
import { shopInfo } from '../data/shop';

export interface ReceiptLine {
  text: string;
  euro: number;
  foodId?: string;
}

export interface ParsedReceipt {
  items: ReceiptLine[];
  total: number | null;
}

const PRICE = /(-?\d{1,3}[,.]\d{2})\s*(?:[ABC]|\*)?\s*$/;
const TOTAL = /^(summe|zu zahlen|gesamt|total)\b/i;
const STOP = /^(gegeben|rueckgeld|rückgeld|bar|ec[- ]|karte|kartenzahlung|visa|mastercard|mwst|steuer|netto|brutto|beleg|tse|uhrzeit)/i;
const DISCOUNT = /(preisvorteil|rabatt|lidl plus|coupon|aktion|nachlass)/i;
const DETAIL = /^\d+([,.]\d+)?\s*(kg|x|stk|st\.?)\b/i;

/** Kleinbuchstaben, Umlaute ausgeschrieben, Satzzeichen weg */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const toEuro = (s: string) => Number(s.replace(',', '.'));

export function parseReceiptText(text: string): ParsedReceipt {
  const items: ReceiptLine[] = [];
  let total: number | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    const match = PRICE.exec(line);
    if (TOTAL.test(line)) {
      if (match) total = toEuro(match[1]);
      break;
    }
    if (STOP.test(line) || !match) continue;
    if (DETAIL.test(line)) continue;
    const euro = toEuro(match[1]);
    const label = line.slice(0, match.index).replace(/\s+[-–]\s*$/, '').trim();
    if (DISCOUNT.test(label) || euro < 0) {
      const last = items[items.length - 1];
      if (last) last.euro = Math.round((last.euro + (euro < 0 ? euro : -euro)) * 100) / 100;
      continue;
    }
    if (!label || /^eur$/i.test(label)) continue;
    items.push({ text: label, euro });
  }
  return { items, total };
}

/** Zuordnung über gelernte Namen, dann über Stichwörter */
export function matchFood(text: string, aliases: Record<string, string>): string | undefined {
  const key = normalize(text);
  if (aliases[key]) return aliases[key] === '-' ? undefined : aliases[key];
  const padded = ` ${key} `;
  for (const food of FOODS) {
    if (shopInfo(food.id).keywords.some((k) => padded.includes(k))) return food.id;
  }
  return undefined;
}

export function withMatches(receipt: ParsedReceipt, aliases: Record<string, string>): ParsedReceipt {
  return { ...receipt, items: receipt.items.map((i) => ({ ...i, foodId: i.foodId ?? matchFood(i.text, aliases) })) };
}

export function itemsSum(receipt: ParsedReceipt): number {
  return Math.round(receipt.items.reduce((s, i) => s + i.euro, 0) * 100) / 100;
}

/** Wie viele Packungen ein Bonposten wohl war, gemessen am bisherigen Packungspreis */
export function packsOf(euro: number, packPrice: number): number {
  return Math.max(1, Math.round(euro / packPrice));
}
