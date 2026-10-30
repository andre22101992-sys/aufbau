// Datumswerte werden als lokale Tages-Schlüssel „JJJJ-MM-TT“ gespeichert.
// So bleibt ein Eintrag am richtigen Tag, auch über die Zeitumstellung hinweg.

export type DateKey = string;

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;
export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(now: Date = new Date()): DateKey {
  return toKey(now);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** Tage von b bis a (a − b). Rundet, damit 23- oder 25-Stunden-Tage bei der Zeitumstellung stimmen. */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86_400_000);
}

/** 0 = Montag … 6 = Sonntag */
export function weekday(key: DateKey): number {
  return (fromKey(key).getDay() + 6) % 7;
}

/** Montag der Woche (Wochen laufen Mo–So, wie beim Wochenschnitt des Gewichts). */
export function weekStart(key: DateKey): DateKey {
  return addDays(key, -weekday(key));
}

/** Samstag, an dem die Einkaufswoche beginnt (Sa–Fr). */
export function shoppingWeekStart(key: DateKey): DateKey {
  return addDays(key, -((weekday(key) - 5 + 7) % 7));
}

/** Nächster Tag mit dem gewünschten Wochentag (0 = Mo), optional einschließlich heute. */
export function nextWeekday(key: DateKey, target: number, includeToday = true): DateKey {
  let delta = (target - weekday(key) + 7) % 7;
  if (delta === 0 && !includeToday) delta = 7;
  return addDays(key, delta);
}

export function isWeekend(key: DateKey): boolean {
  return weekday(key) >= 5;
}

export function compareKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function formatDate(key: DateKey, style: 'long' | 'short' | 'weekday' = 'long'): string {
  const d = fromKey(key);
  if (style === 'weekday') return WEEKDAYS[weekday(key)];
  if (style === 'short') return `${WEEKDAYS_SHORT[weekday(key)]}, ${d.getDate()}.${d.getMonth() + 1}.`;
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}

/** Minuten:Sekunden, ab einer Stunde Stunden:Minuten:Sekunden */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** „HH:MM“ → Minuten seit Mitternacht */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
