// Backup aller Daten als eine JSON-Datei, auf Wunsch ohne Fotos.
// Beim Einspielen prüft ein zod-Schema die Datei, bevor etwas überschrieben wird.

import { z } from 'zod';
import type { IDBPDatabase } from 'idb';
import { DB_VERSION, OUT_OF_LINE_STORES, STORE_NAMES, type AufbauSchema, type StoreName } from './db';

const entrySchema = z.object({ key: z.string().optional(), value: z.unknown() });

const backupSchema = z.object({
  app: z.literal('aufbau'),
  schema: z.number().int().min(1),
  exportedAt: z.string(),
  withPhotos: z.boolean(),
  stores: z.record(z.string(), z.array(entrySchema)),
});

export type BackupFile = z.infer<typeof backupSchema>;

/** Bereiche, die nie ins Backup gehören (ein halb fertiges Training) */
const SKIPPED: StoreName[] = ['drafts'];

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Wandelt Blobs (Fotos) in Text um, damit sie in JSON passen. */
async function encode(value: unknown): Promise<unknown> {
  if (value instanceof Blob) {
    return { __blob: bytesToBase64(new Uint8Array(await value.arrayBuffer())), type: value.type };
  }
  if (Array.isArray(value)) return Promise.all(value.map(encode));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await encode(v);
    return out;
  }
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.__blob === 'string') {
      return new Blob([base64ToBytes(obj.__blob)], { type: typeof obj.type === 'string' ? obj.type : '' });
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = decode(v);
    return out;
  }
  return value;
}

export async function createBackup(db: IDBPDatabase<AufbauSchema>, options: { withPhotos: boolean }): Promise<BackupFile> {
  const stores: BackupFile['stores'] = {};
  for (const name of STORE_NAMES) {
    if (SKIPPED.includes(name) || (!options.withPhotos && name === 'photos')) continue;
    const entries: BackupFile['stores'][string] = [];
    const tx = db.transaction(name);
    let cursor = await tx.store.openCursor();
    while (cursor) {
      const value = await encode(cursor.value);
      entries.push(OUT_OF_LINE_STORES.includes(name) ? { key: String(cursor.key), value } : { value });
      cursor = await cursor.continue();
    }
    await tx.done;
    stores[name] = entries;
  }
  return { app: 'aufbau', schema: DB_VERSION, exportedAt: new Date().toISOString(), withPhotos: options.withPhotos, stores };
}

export class BackupError extends Error {}

export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('Die Datei ist kein Aufbau-Backup. Wähle eine Datei, die mit „aufbau-backup“ beginnt.');
  }
  const result = backupSchema.safeParse(raw);
  if (!result.success) {
    throw new BackupError('Die Datei ist unvollständig oder beschädigt. Nimm ein anderes Backup.');
  }
  if (result.data.schema > DB_VERSION) {
    throw new BackupError('Das Backup stammt aus einer neueren App-Version. Aktualisiere zuerst die App.');
  }
  return result.data;
}

/** Ersetzt die Bereiche, die im Backup stehen. Fehlen Fotos im Backup, bleiben vorhandene Fotos erhalten. */
export async function restoreBackup(db: IDBPDatabase<AufbauSchema>, backup: BackupFile): Promise<void> {
  const names = STORE_NAMES.filter((n) => n in backup.stores && !SKIPPED.includes(n));
  const tx = db.transaction(names, 'readwrite');
  for (const name of names) {
    const store = tx.objectStore(name);
    await store.clear();
    for (const entry of backup.stores[name]) {
      const value = decode(entry.value);
      if (OUT_OF_LINE_STORES.includes(name)) await store.put(value as never, entry.key as never);
      else await store.put(value as never);
    }
  }
  await tx.done;
}

export function backupFileName(date = new Date(), withPhotos = false): string {
  const stamp = date.toISOString().slice(0, 10);
  return `aufbau-backup-${stamp}${withPhotos ? '-mit-fotos' : ''}.json`;
}
