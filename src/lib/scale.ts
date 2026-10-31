// Körperwerte deiner Waage (Körperfett, Muskelmasse …): alle paar Wochen eintragen, nur der Verlauf zählt.
// Waagen messen über einen schwachen Strom durch den Körper. Wasser, Essen und Uhrzeit verändern die Werte,
// einzelne Zahlen sind deshalb ungenau.

import { compareKeys, type DateKey } from './dates';
import { parseDecimal } from './numbers';

export type ScaleKey = 'muscleKg' | 'fatPct' | 'skeletalPct' | 'waterPct' | 'visceral';

export interface ScaleEntry {
  /** „waage:JJJJ-MM-TT“, pro Tag ein Eintrag */
  id: string;
  date: DateKey;
  muscleKg?: number;
  fatPct?: number;
  skeletalPct?: number;
  waterPct?: number;
  visceral?: number;
}

export interface ScaleField {
  key: ScaleKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  digits: number;
  placeholder: string;
  /** Veränderung gilt als gut, wenn der Wert steigt */
  upIsGood: boolean | null;
}

export const SCALE_FIELDS: ScaleField[] = [
  { key: 'muscleKg', label: 'Muskelmasse', unit: 'kg', min: 20, max: 90, digits: 2, placeholder: 'z. B. 45,00', upIsGood: true },
  { key: 'fatPct', label: 'Körperfett', unit: '%', min: 3, max: 60, digits: 1, placeholder: 'z. B. 12,0', upIsGood: null },
  { key: 'skeletalPct', label: 'Skelettmuskeln', unit: '%', min: 20, max: 80, digits: 1, placeholder: 'z. B. 50,0', upIsGood: true },
  { key: 'waterPct', label: 'Körperwasser', unit: '%', min: 30, max: 80, digits: 1, placeholder: 'z. B. 60,0', upIsGood: null },
  { key: 'visceral', label: 'Viszerales Fett', unit: '', min: 1, max: 30, digits: 0, placeholder: 'z. B. 3', upIsGood: false },
];

export const scaleId = (date: DateKey) => `waage:${date}`;

export type ScaleParse = { ok: true; entry: ScaleEntry } | { ok: false; error: string };

/** Liest die Eingaben aus den Textfeldern; leere Felder werden übersprungen */
export function parseScaleInput(date: DateKey, texts: Partial<Record<ScaleKey, string>>): ScaleParse {
  const entry: ScaleEntry = { id: scaleId(date), date };
  let any = false;
  for (const field of SCALE_FIELDS) {
    const raw = texts[field.key]?.trim();
    if (!raw) continue;
    const value = parseDecimal(raw);
    if (value === null) return { ok: false, error: `${field.label}: Trag eine Zahl ein, zum Beispiel ${field.placeholder.replace('z. B. ', '')}.` };
    if (value < field.min || value > field.max) {
      return { ok: false, error: `${field.label}: Das sieht nicht richtig aus. Erwartet sind ${field.min} bis ${field.max}${field.unit ? ` ${field.unit}` : ''}.` };
    }
    entry[field.key] = Math.round(value * 10 ** field.digits) / 10 ** field.digits;
    any = true;
  }
  return any ? { ok: true, entry } : { ok: false, error: 'Trag mindestens einen Wert ein.' };
}

/** Werte eines Feldes über die Zeit, älteste zuerst */
export function scaleSeries(entries: ScaleEntry[], key: ScaleKey): { date: DateKey; value: number }[] {
  return entries
    .filter((e) => e[key] !== undefined)
    .sort((a, b) => compareKeys(a.date, b.date))
    .map((e) => ({ date: e.date, value: e[key] as number }));
}

export interface ScaleChange {
  latest: number;
  /** Veränderung seit der ersten Messung; null bei nur einer Messung */
  sinceFirst: number | null;
}

export function scaleChange(entries: ScaleEntry[], key: ScaleKey): ScaleChange | null {
  const points = scaleSeries(entries, key);
  if (!points.length) return null;
  const latest = points[points.length - 1].value;
  return { latest, sinceFirst: points.length > 1 ? latest - points[0].value : null };
}
