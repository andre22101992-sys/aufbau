// IndexedDB mit Versionen. Jede neue Version bekommt eine eigene Umwandlung in MIGRATIONS,
// damit vorhandene Daten bei einem App-Update erhalten bleiben.

import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction, type StoreNames } from 'idb';
import type { SleepEntry, WeightEntry, Workout } from './model';

export const DB_NAME = 'aufbau';

export interface AufbauSchema extends DBSchema {
  settings: { key: string; value: unknown };
  drafts: { key: string; value: unknown };
  overrides: { key: string; value: unknown };
  workouts: { key: string; value: Workout; indexes: { byDate: string } };
  weights: { key: string; value: WeightEntry };
  sleep: { key: string; value: SleepEntry };
  meals: { key: string; value: { date: string } & Record<string, unknown> };
  shopping: { key: string; value: { week: string } & Record<string, unknown> };
  stock: { key: string; value: { foodId: string } & Record<string, unknown> };
  receipts: { key: string; value: { id: string } & Record<string, unknown> };
  prices: { key: string; value: { id: string } & Record<string, unknown> };
  checkins: { key: string; value: { id: string } & Record<string, unknown> };
  photos: { key: string; value: { id: string } & Record<string, unknown> };
  aliases: { key: string; value: { text: string } & Record<string, unknown> };
  achievements: { key: string; value: { id: string } & Record<string, unknown> };
}

export type StoreName = StoreNames<AufbauSchema>;

type UpgradeTx = IDBPTransaction<AufbauSchema, StoreName[], 'versionchange'>;
type Migration = (db: IDBPDatabase<AufbauSchema>, tx: UpgradeTx) => void;

export const MIGRATIONS: Migration[] = [
  // Version 1: alle Bereiche anlegen, auch die für spätere Phasen
  (db) => {
    db.createObjectStore('settings');
    db.createObjectStore('drafts');
    db.createObjectStore('overrides');
    const workouts = db.createObjectStore('workouts', { keyPath: 'id' });
    workouts.createIndex('byDate', 'date');
    db.createObjectStore('weights', { keyPath: 'date' });
    db.createObjectStore('sleep', { keyPath: 'date' });
    db.createObjectStore('meals', { keyPath: 'date' });
    db.createObjectStore('shopping', { keyPath: 'week' });
    db.createObjectStore('stock', { keyPath: 'foodId' });
    db.createObjectStore('receipts', { keyPath: 'id' });
    db.createObjectStore('prices', { keyPath: 'id' });
    db.createObjectStore('checkins', { keyPath: 'id' });
    db.createObjectStore('photos', { keyPath: 'id' });
    db.createObjectStore('aliases', { keyPath: 'text' });
    db.createObjectStore('achievements', { keyPath: 'id' });
  },
];

export const DB_VERSION = MIGRATIONS.length;

export const STORE_NAMES: StoreName[] = [
  'settings',
  'drafts',
  'overrides',
  'workouts',
  'weights',
  'sleep',
  'meals',
  'shopping',
  'stock',
  'receipts',
  'prices',
  'checkins',
  'photos',
  'aliases',
  'achievements',
];

/** Bereiche mit eigenem Schlüssel statt keyPath (für Backup und Import) */
export const OUT_OF_LINE_STORES: StoreName[] = ['settings', 'drafts', 'overrides'];

export function openAufbauDB(name = DB_NAME, version = DB_VERSION): Promise<IDBPDatabase<AufbauSchema>> {
  return openDB<AufbauSchema>(name, version, {
    upgrade(db, oldVersion, newVersion, tx) {
      const target = newVersion ?? version;
      for (let v = oldVersion; v < target; v++) MIGRATIONS[v](db, tx);
    },
    blocking() {
      // Ein anderes Fenster braucht eine neuere Version: neu laden, damit nichts hängen bleibt.
      if (typeof location !== 'undefined') location.reload();
    },
  });
}

let dbPromise: Promise<IDBPDatabase<AufbauSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<AufbauSchema>> {
  dbPromise ??= openAufbauDB();
  return dbPromise;
}
