// Einfache Lebensmittel beim Eintragen: Menge wählen, bei Eiern auch Remoulade dazu.

import { getFood } from '../data/foods';
import { describeItem } from './nutrition';

export interface QuickAddon {
  food: string;
  /** Gramm pro Tipp */
  step: number;
  max: number;
}

export interface QuickFood {
  food: string;
  /** Name auf dem Knopf */
  label: string;
  /** Gramm pro Tipp */
  step: number;
  /** Menge, mit der die Auswahl startet (Gramm) */
  start: number;
  min: number;
  max: number;
  addon?: QuickAddon;
}

export const QUICK_FOODS: QuickFood[] = [
  { food: 'ei', label: 'Eier', step: 60, start: 120, min: 60, max: 480, addon: { food: 'remoulade', step: 15, max: 60 } },
  { food: 'banane', label: 'Banane', step: 120, start: 120, min: 120, max: 480 },
  { food: 'milch', label: 'Milch', step: 50, start: 250, min: 50, max: 1000 },
  { food: 'gouda', label: 'Gouda', step: 10, start: 30, min: 10, max: 150 },
  { food: 'hafer', label: 'Haferflocken', step: 10, start: 50, min: 10, max: 200 },
];

export interface QuickEntry {
  label: string;
  kcal: number;
  protein: number;
}

/** Name und Werte für gewählte Menge (Gramm) und Zusatz (Gramm, 0 = ohne) */
export function quickEntry(def: QuickFood, grams: number, addonGrams = 0): QuickEntry {
  const parts: [string, number][] = [[def.food, grams]];
  if (def.addon && addonGrams > 0) parts.push([def.addon.food, addonGrams]);
  let kcal = 0;
  let protein = 0;
  for (const [id, g] of parts) {
    const food = getFood(id);
    kcal += (food.kcal * g) / 100;
    protein += (food.protein * g) / 100;
  }
  return { label: parts.map(([id, g]) => describeItem(id, g)).join(', '), kcal: Math.round(kcal), protein: Math.round(protein) };
}

/** Eine Stufe rauf oder runter, begrenzt auf min und max */
export function stepAmount(current: number, step: number, direction: 1 | -1, min: number, max: number): number {
  return Math.min(max, Math.max(min, current + direction * step));
}
