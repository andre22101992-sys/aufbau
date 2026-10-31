import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { CHECKIN_INTERVAL_DAYS, checkinDue, checkinId, measureChange, parseMeasures, photoId, withPhoto, type CheckinEntry } from '../src/lib/checkin';
import { addDays } from '../src/lib/dates';
import { deleteCheckin, getPhoto, listCheckins, saveCheckin, savePhoto } from '../src/lib/repo';

const entry = (date: string, extra: Partial<CheckinEntry> = {}): CheckinEntry => ({ id: checkinId(date), date, photos: {}, ...extra });

describe('Maße', () => {
  it('liest Zahlen mit Komma und überspringt leere Felder', () => {
    expect(parseMeasures({ armCm: '31,56', chestCm: '', waistCm: '70' })).toEqual({ ok: true, values: { armCm: 31.6, waistCm: 70 } });
    expect(parseMeasures({})).toEqual({ ok: true, values: {} });
  });

  it('meldet Fehler verständlich', () => {
    const text = parseMeasures({ armCm: 'dick' });
    expect(!text.ok && text.error).toContain('Oberarm');
    const range = parseMeasures({ waistCm: '700' });
    expect(!range.ok && range.error).toContain('50 bis 150 cm');
  });

  it('zeigt die Veränderung seit dem ersten Check-in', () => {
    const list = [entry('2026-12-01', { waistCm: 71 }), entry('2026-11-01', { waistCm: 70 })];
    expect(measureChange(list, 'waistCm')).toEqual({ latest: 71, sinceFirst: 1 });
    expect(measureChange(list, 'armCm')).toBeNull();
    expect(measureChange([list[0]], 'waistCm')?.sinceFirst).toBeNull();
  });
});

describe('Wann ein Check-in fällig ist', () => {
  const start = '2026-11-02';

  it('der erste schon am ersten Kochtag, als Ausgangspunkt', () => {
    expect(checkinDue([], start, '2026-10-30').due).toBe(false);
    expect(checkinDue([], start, '2026-10-31')).toEqual({ due: true, daysSince: null });
    expect(checkinDue([], null, '2026-10-31').due).toBe(false);
  });

  it('danach alle vier Wochen', () => {
    const list = [entry('2026-10-31')];
    expect(checkinDue(list, start, addDays('2026-10-31', CHECKIN_INTERVAL_DAYS - 1)).due).toBe(false);
    expect(checkinDue(list, start, addDays('2026-10-31', CHECKIN_INTERVAL_DAYS))).toEqual({ due: true, daysSince: 28 });
  });

  it('findet Check-ins mit Foto in einer Pose, neueste zuerst', () => {
    const list = [entry('2026-11-01', { photos: { vorne: 'a' } }), entry('2026-12-01', { photos: { vorne: 'b', seite: 'c' } }), entry('2026-12-29')];
    expect(withPhoto(list, 'vorne').map((e) => e.date)).toEqual(['2026-12-01', '2026-11-01']);
    expect(withPhoto(list, 'hinten')).toEqual([]);
  });
});

describe('Speichern', () => {
  it('legt Check-in und Foto ab und löscht beides gemeinsam wieder', async () => {
    const date = '2026-11-01';
    const id = photoId(date, 'vorne');
    await savePhoto(id, date, 'vorne', new Blob(['foto'], { type: 'image/jpeg' }));
    await saveCheckin(entry(date, { waistCm: 70, photos: { vorne: id } }));
    expect((await listCheckins()).map((e) => e.waistCm)).toEqual([70]);
    expect(await getPhoto(id)).toBeInstanceOf(Blob);
    await deleteCheckin(entry(date, { photos: { vorne: id } }));
    expect(await listCheckins()).toEqual([]);
    expect(await getPhoto(id)).toBeNull();
  });
});
