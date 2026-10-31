// Open Food Facts: Nährwerte und Packungsgröße zu einem Barcode. Gesendet wird nur die Barcode-Nummer.

export interface OffProduct {
  ean: string;
  name: string;
  kcal: number | null;
  protein: number | null;
  fiber: number | null;
  /** Packungsgröße in Gramm bzw. ml */
  grams: number | null;
}

function num(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

/** „500 g“, „1 l“, „0,5 kg“, „4 x 125 g“ → Gramm */
export function parseQuantity(text: string | undefined): number | null {
  if (!text) return null;
  const t = text.toLowerCase().replace(',', '.');
  const multi = /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|kg|l)\b/.exec(t);
  const single = /(\d+(?:\.\d+)?)\s*(g|ml|kg|l|cl)\b/.exec(t);
  const toGrams = (v: number, unit: string) => (unit === 'kg' || unit === 'l' ? v * 1000 : unit === 'cl' ? v * 10 : v);
  if (multi) return Math.round(Number(multi[1]) * toGrams(Number(multi[2]), multi[3]));
  if (single) return Math.round(toGrams(Number(single[1]), single[2]));
  return null;
}

export function parseOff(ean: string, json: unknown): OffProduct | null {
  const data = json as { status?: number; product?: Record<string, unknown> };
  if (!data || data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = (p.nutriments ?? {}) as Record<string, unknown>;
  const name = [p.product_name_de, p.product_name, p.generic_name].find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) !== null ? Math.round((num(n['energy_100g'])! / 4.184) * 10) / 10 : null);
  return {
    ean,
    name: name?.trim() ?? `Produkt ${ean}`,
    kcal,
    protein: num(n['proteins_100g']),
    fiber: num(n['fiber_100g']),
    grams: num(p.product_quantity) ?? parseQuantity(p.quantity as string | undefined),
  };
}

export async function lookup(ean: string): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json?fields=product_name,product_name_de,generic_name,nutriments,quantity,product_quantity`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return parseOff(ean, await response.json());
}
