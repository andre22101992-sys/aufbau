// Check-in alle 4 Wochen: Maße (Oberarm, Brust, Taille) und drei Fotos. Die Fotos bleiben privat auf diesem iPhone.

import { addDays, diffDays, type DateKey } from './dates';
import { parseDecimal } from './numbers';

export type Pose = 'vorne' | 'seite' | 'hinten';

export const POSES: { id: Pose; label: string; tip: string }[] = [
  { id: 'vorne', label: 'Vorne', tip: 'Gerade stehen, Arme locker neben dem Körper, Blick nach vorn.' },
  { id: 'seite', label: 'Seitlich', tip: 'Seitlich zur Kamera, Arme locker hängen lassen, entspannt stehen.' },
  { id: 'hinten', label: 'Hinten', tip: 'Mit dem Rücken zur Kamera, Arme locker neben dem Körper.' },
];

export type MeasureKey = 'armCm' | 'chestCm' | 'waistCm';

export interface MeasureField {
  key: MeasureKey;
  label: string;
  how: string;
  min: number;
  max: number;
}

export const MEASURES: MeasureField[] = [
  { key: 'armCm', label: 'Oberarm', how: 'Arm locker hängen lassen, an der dicksten Stelle des Oberarms messen.', min: 15, max: 60 },
  { key: 'chestCm', label: 'Brust', how: 'Auf Höhe der Brustwarzen rund um den Körper, nach dem Ausatmen.', min: 60, max: 160 },
  { key: 'waistCm', label: 'Taille', how: 'Auf Höhe des Bauchnabels, locker ausgeatmet und ohne den Bauch einzuziehen. Die Taille zeigt, ob zu viel Fett dazukommt.', min: 50, max: 150 },
];

export interface CheckinEntry {
  /** „checkin:JJJJ-MM-TT“, pro Tag ein Check-in */
  id: string;
  date: DateKey;
  armCm?: number;
  chestCm?: number;
  waistCm?: number;
  /** Pose → ID des Fotos im Bereich „photos“ */
  photos: Partial<Record<Pose, string>>;
}

export const checkinId = (date: DateKey) => `checkin:${date}`;
export const photoId = (date: DateKey, pose: Pose) => `foto:${date}:${pose}`;

export const CHECKIN_INTERVAL_DAYS = 28;

export type MeasureParse = { ok: true; values: Partial<Record<MeasureKey, number>> } | { ok: false; error: string };

/** Maße aus Textfeldern lesen; leere Felder werden übersprungen, ein Check-in nur mit Fotos ist erlaubt */
export function parseMeasures(texts: Partial<Record<MeasureKey, string>>): MeasureParse {
  const values: Partial<Record<MeasureKey, number>> = {};
  for (const field of MEASURES) {
    const raw = texts[field.key]?.trim();
    if (!raw) continue;
    const value = parseDecimal(raw);
    if (value === null) return { ok: false, error: `${field.label}: Trag eine Zahl in cm ein, zum Beispiel 31,5.` };
    if (value < field.min || value > field.max) {
      return { ok: false, error: `${field.label}: Das sieht nicht richtig aus. Erwartet sind ${field.min} bis ${field.max} cm.` };
    }
    values[field.key] = Math.round(value * 10) / 10;
  }
  return { ok: true, values };
}

export interface CheckinDue {
  due: boolean;
  /** Tage seit dem letzten Check-in; null, wenn es noch keinen gibt */
  daysSince: number | null;
}

/**
 * Fällig ist der erste Check-in schon am ersten Kochtag (als Ausgangspunkt für den Vergleich),
 * danach alle 4 Wochen.
 */
export function checkinDue(entries: Pick<CheckinEntry, 'date'>[], startDate: DateKey | null, today: DateKey): CheckinDue {
  if (entries.length === 0) return { due: !!startDate && today >= addDays(startDate, -2), daysSince: null };
  const last = entries.reduce((a, b) => (a.date > b.date ? a : b)).date;
  const daysSince = diffDays(today, last);
  return { due: daysSince >= CHECKIN_INTERVAL_DAYS, daysSince };
}

export interface MeasureChange {
  latest: number;
  sinceFirst: number | null;
}

export function measureChange(entries: CheckinEntry[], key: MeasureKey): MeasureChange | null {
  const points = entries
    .filter((e) => e[key] !== undefined)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((e) => e[key] as number);
  if (!points.length) return null;
  return { latest: points[points.length - 1], sinceFirst: points.length > 1 ? points[points.length - 1] - points[0] : null };
}

/** Check-ins mit Foto in dieser Pose, neueste zuerst */
export function withPhoto(entries: CheckinEntry[], pose: Pose): CheckinEntry[] {
  return entries.filter((e) => e.photos[pose]).sort((a, b) => (a.date < b.date ? 1 : -1));
}
