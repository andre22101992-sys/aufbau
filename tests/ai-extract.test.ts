import { describe, expect, it } from 'vitest';
import { extractJson } from '../src/lib/ai/extract';

describe('extractJson', () => {
  it('liest einen json-Codeblock mitten in der Antwort', () => {
    const text = 'Gern!\n```json\n{"ok": true, "satz": "Protein hilft."}\n```\nViel Erfolg';
    expect(extractJson(text)).toEqual({ ok: true, satz: 'Protein hilft.' });
  });

  it('liest einen Codeblock ohne Sprachangabe', () => {
    expect(extractJson('```\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it('liest reines JSON und JSON im Fließtext', () => {
    expect(extractJson(' {"a": 1} ')).toEqual({ a: 1 });
    expect(extractJson('Hier: {"a": {"b": 2}} – sonst noch was?')).toEqual({ a: { b: 2 } });
  });

  it('verträgt typografische Anführungszeichen', () => {
    expect(extractJson('{“ok”: true, „satz“: “Hallo”}')).toEqual({ ok: true, satz: 'Hallo' });
  });

  it('gibt undefined zurück, wenn nichts Gültiges drinsteht', () => {
    expect(extractJson('Ich kann kein Bild sehen.')).toBeUndefined();
    expect(extractJson('```json\n{"a": 1,\n```')).toBeUndefined();
  });
});
