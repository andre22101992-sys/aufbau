import { describe, expect, it } from 'vitest';
import { validEan } from '../src/lib/barcode';
import { parseOff, parseQuantity } from '../src/lib/off';

// Gespeicherte Antwort von Open Food Facts (gekürzt); die Tests gehen nicht ins Internet
const SAMPLE = {
  status: 1,
  product: {
    product_name: 'Haferflocken zart',
    quantity: '500 g',
    nutriments: { 'energy-kcal_100g': 372, proteins_100g: 13.5, fiber_100g: 10 },
  },
};

describe('Open Food Facts', () => {
  it('liest Name, Nährwerte und Packungsgröße', () => {
    expect(parseOff('4056489123456', SAMPLE)).toEqual({ ean: '4056489123456', name: 'Haferflocken zart', kcal: 372, protein: 13.5, fiber: 10, grams: 500 });
  });

  it('kommt mit fehlenden Werten und unbekannten Produkten klar', () => {
    expect(parseOff('1', { status: 0 })).toBeNull();
    const noKcal = parseOff('1', { status: 1, product: { product_name: 'Milch', quantity: '1 l', nutriments: { energy_100g: 268 } } });
    expect(noKcal?.kcal).toBeCloseTo(64, 0);
    expect(noKcal?.grams).toBe(1000);
  });

  it('versteht Mengenangaben', () => {
    expect(parseQuantity('4 x 125 g')).toBe(500);
    expect(parseQuantity('0,5 kg')).toBe(500);
    expect(parseQuantity('etwas')).toBeNull();
  });

  it('prüft die Prüfziffer von EAN-Codes', () => {
    expect(validEan('4006381333931')).toBe(true);
    expect(validEan('4006381333932')).toBe(false);
    expect(validEan('96385074')).toBe(true);
  });
});
