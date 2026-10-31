import { describe, expect, it } from 'vitest';
import { parseScaleInput, scaleChange, scaleId, scaleSeries, type ScaleEntry } from '../src/lib/scale';

describe('Waagenwerte', () => {
  it('liest Zahlen mit Komma, rundet und überspringt leere Felder', () => {
    const result = parseScaleInput('2026-11-01', { muscleKg: '45,126', fatPct: '12,34', waterPct: '', visceral: '3' });
    expect(result).toEqual({ ok: true, entry: { id: scaleId('2026-11-01'), date: '2026-11-01', muscleKg: 45.13, fatPct: 12.3, visceral: 3 } });
  });

  it('meldet Fehler verständlich: keine Zahl, unmöglicher Wert, nichts eingetragen', () => {
    const text = parseScaleInput('2026-11-01', { fatPct: 'viel' });
    expect(!text.ok && text.error).toContain('Körperfett');
    const range = parseScaleInput('2026-11-01', { muscleKg: '450' });
    expect(!range.ok && range.error).toContain('20 bis 90 kg');
    const empty = parseScaleInput('2026-11-01', {});
    expect(!empty.ok && empty.error).toContain('mindestens einen Wert');
  });

  it('zeigt den Verlauf und die Veränderung seit der ersten Messung', () => {
    const entries: ScaleEntry[] = [
      { id: 'b', date: '2026-12-01', muscleKg: 46, fatPct: 12 },
      { id: 'a', date: '2026-11-01', muscleKg: 45, fatPct: 12.4 },
    ];
    expect(scaleSeries(entries, 'muscleKg')).toEqual([
      { date: '2026-11-01', value: 45 },
      { date: '2026-12-01', value: 46 },
    ]);
    expect(scaleChange(entries, 'fatPct')?.sinceFirst).toBeCloseTo(-0.4);
    expect(scaleChange(entries, 'waterPct')).toBeNull();
    expect(scaleChange([entries[1]], 'muscleKg')).toEqual({ latest: 45, sinceFirst: null });
  });
});
