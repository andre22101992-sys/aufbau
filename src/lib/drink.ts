// Trinkziel: Wasser, Tee und Saft zählen mit. Milch und Shakes laufen über die Mahlzeiten.

export const DRINK_TARGET_ML = 2000;
export const DRINK_STEPS = [200, 300, 500];

/** Setzt den Zähler um ml hoch oder runter, nie unter null */
export function addDrink(current: number | undefined, ml: number): number {
  return Math.max(0, (current ?? 0) + ml);
}

export const drinkShare = (ml: number | undefined) => Math.min(1, (ml ?? 0) / DRINK_TARGET_ML);

export const formatLiters = (ml: number) => `${(ml / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} l`;
