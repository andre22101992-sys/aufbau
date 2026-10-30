import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { DB_VERSION, MIGRATIONS, STORE_NAMES, openAufbauDB } from '../src/lib/db';
import { BackupError, createBackup, parseBackup, restoreBackup } from '../src/lib/backup';
import type { Workout } from '../src/lib/model';

let counter = 0;
const freshName = () => `test-${Date.now()}-${counter++}`;

const workout: Workout = {
  id: 'w1',
  date: '2026-11-02',
  dayId: 'mo',
  blockId: 'block-1',
  startedAt: 1,
  finishedAt: 2,
  mode: 'normal',
  feeling: 4,
  exercises: [{ slotIndex: 0, exerciseId: 'liegestuetze', sets: [{ load: { kind: 'level', level: 0 }, reps: 12, done: true }] }],
};

describe('Datenbank', () => {
  it('hat für jede Version eine Umwandlung', () => {
    expect(DB_VERSION).toBe(MIGRATIONS.length);
  });

  it('legt alle Bereiche an, auch Schritt für Schritt über jede Version', async () => {
    const name = freshName();
    for (let v = 1; v <= DB_VERSION; v++) {
      const db = await openAufbauDB(name, v);
      db.close();
    }
    const db = await openAufbauDB(name);
    for (const store of STORE_NAMES) expect(db.objectStoreNames.contains(store)).toBe(true);
    db.close();
  });
});

describe('Backup', () => {
  it('ergibt nach Export und Import dieselben Daten, Fotos eingeschlossen', async () => {
    const source = await openAufbauDB(freshName());
    await source.put('settings', { onboarded: true, theme: 'dark' }, 'main');
    await source.put('overrides', 'Stuhl an die Wand', 'note:rudern');
    await source.put('workouts', workout);
    await source.put('photos', { id: 'p1', blob: new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'image/jpeg' }) });

    const backup = await createBackup(source, { withPhotos: true });
    const parsed = parseBackup(JSON.stringify(backup));

    const target = await openAufbauDB(freshName());
    await restoreBackup(target, parsed);
    expect(await target.get('settings', 'main')).toEqual({ onboarded: true, theme: 'dark' });
    expect(await target.get('overrides', 'note:rudern')).toBe('Stuhl an die Wand');
    expect(await target.get('workouts', 'w1')).toEqual(workout);
    const photo = (await target.get('photos', 'p1')) as unknown as { blob: Blob };
    expect([...new Uint8Array(await photo.blob.arrayBuffer())]).toEqual([1, 2, 3, 250]);
    expect(photo.blob.type).toBe('image/jpeg');
    source.close();
    target.close();
  });

  it('lässt vorhandene Fotos stehen, wenn das Backup keine enthält', async () => {
    const source = await openAufbauDB(freshName());
    await source.put('workouts', workout);
    const backup = await createBackup(source, { withPhotos: false });
    expect(backup.stores.photos).toBeUndefined();

    const target = await openAufbauDB(freshName());
    await target.put('photos', { id: 'alt', blob: new Blob(['x']) });
    await restoreBackup(target, parseBackup(JSON.stringify(backup)));
    expect(await target.get('photos', 'alt')).toBeTruthy();
    source.close();
    target.close();
  });

  it('weist kaputte und zu neue Dateien mit einer Erklärung ab', () => {
    expect(() => parseBackup('kein json')).toThrow(BackupError);
    expect(() => parseBackup(JSON.stringify({ app: 'andere' }))).toThrow(BackupError);
    expect(() =>
      parseBackup(JSON.stringify({ app: 'aufbau', schema: DB_VERSION + 1, exportedAt: '', withPhotos: false, stores: {} })),
    ).toThrow(/neueren App-Version/);
  });
});
