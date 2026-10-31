// Barcodes erkennen mit zxing-wasm. Die Bibliothek wird erst geladen, wenn du den Scanner öffnest,
// und die wasm-Datei kommt aus der App selbst statt von einem fremden Server.

import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

let ready: Promise<typeof import('zxing-wasm/reader')> | null = null;

function load(): Promise<typeof import('zxing-wasm/reader')> {
  ready ??= import('zxing-wasm/reader').then((zxing) => {
    zxing.prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } });
    return zxing;
  });
  return ready;
}

/** Sucht in einem Kamerabild nach einem Produkt-Barcode (EAN/UPC) */
export async function scanImage(image: ImageData): Promise<string | null> {
  const zxing = await load();
  const results = await zxing.readBarcodes(image, { formats: ['EAN13', 'EAN8', 'UPCA', 'UPCE'], tryHarder: true, maxNumberOfSymbols: 1 });
  return results.find((r) => r.isValid)?.text ?? null;
}

export function validEan(code: string): boolean {
  if (!/^\d{8}$|^\d{12,13}$/.test(code)) return false;
  const digits = code.padStart(13, '0').split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === check;
}
