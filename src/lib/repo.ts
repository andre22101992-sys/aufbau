// Lesen und Schreiben der gespeicherten Daten.
// Wichtig: Svelte-Zustände vor dem Speichern mit $state.snapshot in normale Objekte verwandeln.

import { STORE_NAMES, getDB } from './db';
import type { CheckinEntry, Pose } from './checkin';
import type { ScaleEntry } from './scale';
import type { PriceEntry, Receipt, StockEntry } from './shopping';
import { withDefaults, type ActiveWorkout, type Settings, type SleepEntry, type WeightEntry, type Workout } from './model';

const SETTINGS_KEY = 'main';
const ACTIVE_WORKOUT_KEY = 'activeWorkout';

export async function loadSettings(): Promise<Settings> {
  const db = await getDB();
  return withDefaults((await db.get('settings', SETTINGS_KEY)) as Partial<Settings> | undefined);
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, SETTINGS_KEY);
}

export async function listWorkouts(): Promise<Workout[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('workouts', 'byDate');
  return all.filter((w) => w.finishedAt).sort((a, b) => a.startedAt - b.startedAt);
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const db = await getDB();
  await db.put('workouts', workout);
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('workouts', id);
}

/** Gewichte nach Datum sortiert (der Schlüssel „JJJJ-MM-TT“ sortiert von selbst richtig) */
export async function listWeights(): Promise<WeightEntry[]> {
  const db = await getDB();
  return db.getAll('weights');
}

export async function saveWeight(entry: WeightEntry): Promise<void> {
  const db = await getDB();
  await db.put('weights', entry);
}

export async function deleteWeight(date: string): Promise<void> {
  const db = await getDB();
  await db.delete('weights', date);
}

export async function listSleep(): Promise<SleepEntry[]> {
  const db = await getDB();
  return db.getAll('sleep');
}

export async function saveSleep(entry: SleepEntry): Promise<void> {
  const db = await getDB();
  await db.put('sleep', entry);
}

export async function loadActiveWorkout(): Promise<ActiveWorkout | null> {
  const db = await getDB();
  return ((await db.get('drafts', ACTIVE_WORKOUT_KEY)) as ActiveWorkout | undefined) ?? null;
}

export async function saveActiveWorkout(workout: ActiveWorkout | null): Promise<void> {
  const db = await getDB();
  if (workout) await db.put('drafts', workout, ACTIVE_WORKOUT_KEY);
  else await db.delete('drafts', ACTIVE_WORKOUT_KEY);
}

export async function loadChecked(week: string): Promise<string[]> {
  const db = await getDB();
  const entry = await db.get('shopping', week);
  return Array.isArray(entry?.checked) ? (entry.checked as string[]) : [];
}

export async function saveChecked(week: string, checked: string[]): Promise<void> {
  const db = await getDB();
  await db.put('shopping', { week, checked });
}

export async function getOverride<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return (await db.get('overrides', key)) as T | undefined;
}

export async function setOverride(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  if (value === undefined || value === null || value === '') await db.delete('overrides', key);
  else await db.put('overrides', value, key);
}

/** Löscht alle Daten der App auf diesem Gerät. */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  await Promise.all(STORE_NAMES.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}

export async function listOverrides(): Promise<Record<string, unknown>> {
  const db = await getDB();
  const tx = db.transaction('overrides');
  const result: Record<string, unknown> = {};
  let cursor = await tx.store.openCursor();
  while (cursor) {
    result[String(cursor.key)] = cursor.value;
    cursor = await cursor.continue();
  }
  await tx.done;
  return result;
}

export type Extra = {
  id: string;
  label: string;
  kcal: number;
  protein: number;
  /** ID der geplanten Mahlzeit, die dieser Eintrag ersetzt */
  replaces?: string;
  /** Zeitpunkt des Eintrags */
  at?: number;
};

export type DayMeals = {
  date: string;
  /** Mahlzeit → gegessene Portion (0,5 / 1 / 1,5) */
  done: Record<string, number>;
  /** Zeitpunkt, an dem eine Mahlzeit abgehakt wurde */
  doneAt?: Record<string, number>;
  extras: Extra[];
  /** Getrunkene Menge in ml (Wasser, Tee, Saft) */
  drinkMl?: number;
};

export async function loadMeals(date: string): Promise<DayMeals> {
  const db = await getDB();
  const entry = (await db.get('meals', date)) as DayMeals | undefined;
  return { date, done: entry?.done ?? {}, doneAt: entry?.doneAt ?? {}, extras: entry?.extras ?? [], drinkMl: entry?.drinkMl ?? 0 };
}

export async function saveMeals(day: DayMeals): Promise<void> {
  const db = await getDB();
  await db.put('meals', { ...day });
}

// ---------- Einkauf ----------

export async function listStock(): Promise<StockEntry[]> {
  const db = await getDB();
  return (await db.getAll('stock')) as unknown as StockEntry[];
}

export async function saveStock(entry: StockEntry): Promise<void> {
  const db = await getDB();
  await db.put('stock', { ...entry });
}

export async function listPrices(): Promise<PriceEntry[]> {
  const db = await getDB();
  return (await db.getAll('prices')) as unknown as PriceEntry[];
}

export async function savePrice(entry: PriceEntry): Promise<void> {
  const db = await getDB();
  await db.put('prices', { ...entry });
}

export async function listReceipts(): Promise<Receipt[]> {
  const db = await getDB();
  return (await db.getAll('receipts')) as unknown as Receipt[];
}

export async function saveReceipt(receipt: Receipt): Promise<void> {
  const db = await getDB();
  await db.put('receipts', { ...receipt });
}

export async function listAliases(): Promise<Record<string, string>> {
  const db = await getDB();
  const all = (await db.getAll('aliases')) as unknown as { text: string; foodId: string }[];
  return Object.fromEntries(all.map((a) => [a.text, a.foodId]));
}

export async function saveAlias(text: string, foodId: string): Promise<void> {
  const db = await getDB();
  await db.put('aliases', { text, foodId });
}

// ---------- Waagenwerte (im Bereich „checkins“, Art „waage“) ----------

export async function listScale(): Promise<ScaleEntry[]> {
  const db = await getDB();
  const all = await db.getAll('checkins');
  return all.filter((c) => c.kind === 'waage').map(({ kind: _kind, ...entry }) => entry as unknown as ScaleEntry);
}

export async function saveScale(entry: ScaleEntry): Promise<void> {
  const db = await getDB();
  await db.put('checkins', { ...entry, kind: 'waage' });
}

export async function deleteScale(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('checkins', id);
}

// ---------- Check-ins mit Fotos (Bereiche „checkins“ und „photos“) ----------

export async function listCheckins(): Promise<CheckinEntry[]> {
  const db = await getDB();
  const all = await db.getAll('checkins');
  return all.filter((c) => c.kind === 'checkin').map(({ kind: _kind, ...entry }) => entry as unknown as CheckinEntry);
}

export async function saveCheckin(entry: CheckinEntry): Promise<void> {
  const db = await getDB();
  await db.put('checkins', { ...entry, kind: 'checkin' });
}

export async function savePhoto(id: string, date: string, pose: Pose, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put('photos', { id, date, pose, blob });
}

export async function getPhoto(id: string): Promise<Blob | null> {
  const db = await getDB();
  const entry = await db.get('photos', id);
  return entry && entry.blob instanceof Blob ? entry.blob : null;
}

/** Löscht einen Check-in samt seinen Fotos */
export async function deleteCheckin(entry: CheckinEntry): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['checkins', 'photos'], 'readwrite');
  await tx.objectStore('checkins').delete(entry.id);
  for (const id of Object.values(entry.photos)) if (id) await tx.objectStore('photos').delete(id);
  await tx.done;
}

// ---------- Erfolge und alle Mahlzeiten-Tage ----------

export async function listAchievements(): Promise<Record<string, string>> {
  const db = await getDB();
  const all = await db.getAll('achievements');
  return Object.fromEntries(all.map((a) => [a.id, String(a.date ?? '')]));
}

export async function saveAchievement(id: string, date: string): Promise<void> {
  const db = await getDB();
  await db.put('achievements', { id, date });
}

export async function listAllMealDays(): Promise<DayMeals[]> {
  const db = await getDB();
  return (await db.getAll('meals')) as unknown as DayMeals[];
}
