// Kalorien-Steuerung nach dem Wochenschnitt des Gewichts.
// Ziel sind +0,2 bis +0,5 kg pro Woche: Steigt es zu wenig, mehr essen; steigt es deutlich zu schnell, etwas weniger.

import { addDays, diffDays, weekStart, type DateKey } from './dates';
import { formatDecimal } from './numbers';
import type { WeekAverage } from './trend';

export const MIN_GAIN = 0.2;
export const MAX_GAIN = 0.5;

export type Steering = { kind: 'none' } | { kind: 'more' | 'less'; kcal: number; reason: string; how: string };

export interface SteeringInput {
  weeks: WeekAverage[];
  startDate: DateKey | null;
  /** Tag der letzten Änderung am Kalorienziel */
  lastChange: DateKey | null;
  today: DateKey;
}

const signed = (kg: number) => `${kg >= 0 ? '+' : '−'}${formatDecimal(Math.abs(kg), 1, 1)} kg`;

export function steeringAdvice({ weeks, startDate, lastChange, today }: SteeringInput): Steering {
  if (!startDate) return { kind: 'none' };
  // Nach einer Anpassung 2 Wochen lang kein neuer Vorschlag
  if (lastChange && diffDays(today, lastChange) < 14) return { kind: 'none' };

  const done = weeks.filter((w) => w.week >= weekStart(startDate) && diffDays(today, w.week) >= 7);
  if (done.length < 3) return { kind: 'none' };
  const [a, b, c] = done.slice(-3);
  if (diffDays(b.week, a.week) !== 7 || diffDays(c.week, b.week) !== 7) return { kind: 'none' };

  const first = b.avg - a.avg;
  const second = c.avg - b.avg;
  if (first < MIN_GAIN && second < MIN_GAIN) {
    return {
      kind: 'more',
      kcal: 250,
      reason: `Dein Wochenschnitt ist zwei Wochen in Folge um weniger als 0,2 kg gestiegen (${signed(first)} und ${signed(second)}).`,
      how: '+40 g Haferflocken und +150 ml Milch in die Oats, zusammen etwa 250 kcal und 10 g Protein.',
    };
  }

  // Die erste Woche zählt nicht als Ausgangswert: Wasser und Glykogen lassen das Gewicht anfangs schneller steigen.
  const perWeek = (c.avg - a.avg) / 2;
  if (a.week >= addDays(weekStart(startDate), 7) && perWeek > MAX_GAIN) {
    return {
      kind: 'less',
      kcal: -150,
      reason: `Du nimmst im Schnitt ${signed(perWeek)} pro Woche zu. Über 0,5 kg ist meist zu viel Fett dabei.`,
      how: '1 EL Öl weniger im Abendessen und 100 ml Milch weniger, zusammen etwa 150 kcal.',
    };
  }
  return { kind: 'none' };
}
