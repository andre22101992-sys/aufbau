// Gewicht, Schlaf und Kalorienziel speichern.

import type { DateKey } from '../dates';
import type { SleepEntry, WeightEntry } from '../model';
import { roundTo } from '../numbers';
import * as repo from '../repo';
import { app, saveSettingsNow } from './app.svelte';

/** Ersetzt den Eintrag mit demselben Datum und hält die Liste sortiert. */
function upsert<T extends { date: DateKey }>(list: T[], entry: T): T[] {
  return [...list.filter((e) => e.date !== entry.date), entry].sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function saveWeight(date: DateKey, kg: number): Promise<void> {
  const entry: WeightEntry = { date, kg: roundTo(kg, 1) };
  await repo.saveWeight(entry);
  app.weights = upsert(app.weights, entry);
}

export async function removeWeight(date: DateKey): Promise<void> {
  await repo.deleteWeight(date);
  app.weights = app.weights.filter((e) => e.date !== date);
}

export async function saveSleep(entry: SleepEntry): Promise<void> {
  const clean: SleepEntry = { ...entry, hours: roundTo(entry.hours, 2) };
  await repo.saveSleep(clean);
  app.sleep = upsert(app.sleep, clean);
}

/** Übernimmt einen Vorschlag der Kalorien-Steuerung. */
export async function changeKcalTarget(date: DateKey, delta: number, reason: string): Promise<void> {
  app.settings.kcalTarget += delta;
  app.settings.goalHistory = [...app.settings.goalHistory, { date, kcal: app.settings.kcalTarget, reason }];
  await saveSettingsNow();
}
