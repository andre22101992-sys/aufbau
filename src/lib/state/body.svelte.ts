// Gewicht, Schlaf und Kalorienziel speichern.

import type { DateKey } from '../dates';
import type { SleepEntry, WeightEntry } from '../model';
import { roundTo } from '../numbers';
import * as repo from '../repo';
import { checkinId, photoId, POSES, type CheckinEntry, type MeasureKey, type Pose } from '../checkin';
import type { ScaleEntry } from '../scale';
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

/** Kalorienziel selbst einstellen. Mehrere Schritte am selben Tag ergeben einen Eintrag im Verlauf. */
export async function setKcalTarget(date: DateKey, value: number): Promise<void> {
  const entry = { date, kcal: value, reason: 'Von dir eingestellt' };
  const history = [...app.settings.goalHistory];
  const last = history.at(-1);
  if (last && last.date === date && last.reason === entry.reason) history[history.length - 1] = entry;
  else history.push(entry);
  app.settings.kcalTarget = value;
  app.settings.goalHistory = history;
  await saveSettingsNow();
}

/** Ersetzt die Messung desselben Tages */
export async function saveScaleEntry(entry: ScaleEntry): Promise<void> {
  await repo.saveScale(entry);
  app.scale = upsert(app.scale, entry);
}

export async function removeScaleEntry(entry: ScaleEntry): Promise<void> {
  await repo.deleteScale(entry.id);
  app.scale = app.scale.filter((e) => e.id !== entry.id);
}

/**
 * Speichert den Check-in dieses Tages. Neue Fotos ersetzen die alten derselben Pose,
 * Fotos ohne neue Aufnahme bleiben, wenn der Check-in heute schon einmal gespeichert wurde.
 */
export async function saveCheckinEntry(date: DateKey, values: Partial<Record<MeasureKey, number>>, shots: Partial<Record<Pose, Blob>>): Promise<void> {
  const before = app.checkins.find((e) => e.date === date);
  const entry: CheckinEntry = { id: checkinId(date), date, ...values, photos: { ...(before?.photos ?? {}) } };
  for (const pose of POSES) {
    const blob = shots[pose.id];
    if (!blob) continue;
    const id = photoId(date, pose.id);
    await repo.savePhoto(id, date, pose.id, blob);
    entry.photos[pose.id] = id;
  }
  await repo.saveCheckin(entry);
  app.checkins = upsert(app.checkins, entry);
}

export async function removeCheckin(entry: CheckinEntry): Promise<void> {
  await repo.deleteCheckin(entry);
  app.checkins = app.checkins.filter((e) => e.id !== entry.id);
}
