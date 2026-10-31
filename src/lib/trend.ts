// Trendgewicht: ein geglätteter Durchschnitt, der Schwankungen durch Wasser und Essen herausfiltert.
// Tempo und Prognose kommen aus dem Trend, die Kalorien-Steuerung aus dem Wochenschnitt.

import { addDays, diffDays, weekStart, type DateKey } from './dates';
import type { WeightEntry } from './model';

/** Jeder neue Wert fließt zu 10 % in den Trend ein. */
export const TREND_ALPHA = 0.1;

export interface TrendPoint extends WeightEntry {
  trend: number;
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

export function trendSeries(entries: WeightEntry[]): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  let trend: number | null = null;
  return sorted.map((e) => {
    trend = trend === null ? e.kg : trend + TREND_ALPHA * (e.kg - trend);
    return { ...e, trend };
  });
}

/** Veränderung pro Woche aus dem Trend der letzten 14 Tage; null, solange es zu wenige Werte gibt */
export function tempoPerWeek(series: TrendPoint[]): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1].date;
  const recent = series.filter((p) => diffDays(last, p.date) <= 14);
  if (recent.length < 4 || diffDays(last, recent[0].date) < 7) return null;
  const xs = recent.map((p) => diffDays(p.date, recent[0].date));
  const ys = recent.map((p) => p.trend);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  return den === 0 ? null : (num / den) * 7;
}

/** Tag, an dem der Trend das Zielgewicht erreicht; null, wenn das beim aktuellen Tempo nicht absehbar ist */
export function forecastDate(trend: number, tempo: number | null, target: number, today: DateKey): DateKey | null {
  if (tempo === null || tempo < 0.05 || target <= trend) return null;
  const days = Math.round(((target - trend) / tempo) * 7);
  return days > 730 ? null : addDays(today, days);
}

export interface WeekAverage {
  /** Montag der Woche */
  week: DateKey;
  avg: number;
  count: number;
}

/** Wochenschnitt Mo–So, nur aus Wochen mit mindestens 3 Werten */
export function weeklyAverages(entries: WeightEntry[], minCount = 3): WeekAverage[] {
  const byWeek = new Map<DateKey, number[]>();
  for (const e of entries) {
    const week = weekStart(e.date);
    byWeek.set(week, [...(byWeek.get(week) ?? []), e.kg]);
  }
  return [...byWeek.entries()]
    .filter(([, values]) => values.length >= minCount)
    .map(([week, values]) => ({ week, avg: mean(values), count: values.length }))
    .sort((a, b) => (a.week < b.week ? -1 : 1));
}
