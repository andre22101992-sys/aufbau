// Zahlen mit deutschem Dezimalkomma lesen und schreiben.

/** „72,4“, „72.4“ oder „ 72 “ → Zahl; alles andere → null */
export function parseDecimal(input: string): number | null {
  const s = input.trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function formatDecimal(n: number, maxDigits = 1, minDigits = 0): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits });
}

export function formatKg(kg: number): string {
  return `${formatDecimal(kg, 1)} kg`;
}

export function roundTo(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
