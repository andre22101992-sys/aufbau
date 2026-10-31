// Lesen und Schreiben der gespeicherten Daten.
// Wichtig: Svelte-Zustände vor dem Speichern mit $state.snapshot in normale Objekte verwandeln.

import { STORE_NAMES, getDB } from './db';
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

export type DayMeals = {
  date: string;
  /** Mahlzeit → gegessene Portion (0,5 / 1 / 1,5) */
  done: Record<string, number>;
  extras: { id: string; label: string; kcal: number; protein: number }[];
};

export async function loadMeals(date: string): Promise<DayMeals> {
  const db = await getDB();
  const entry = (await db.get('meals', date)) as DayMeals | undefined;
  return { date, done: entry?.done ?? {}, extras: entry?.extras ?? [] };
}

export async function saveMeals(day: DayMeals): Promise<void> {
  const db = await getDB();
  await db.put('meals', { ...day });
}
