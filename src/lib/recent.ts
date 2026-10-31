// Zuletzt gegessene Extras: Beim Eintragen stehen sie oben, ein Tipp statt Zahlen eintippen.

export const RECENT_KEY = 'extras:recent';
export const UNNAMED = 'Eigener Eintrag';

export interface RecentExtra {
  label: string;
  kcal: number;
  protein: number;
  /** wie oft eingetragen */
  n: number;
  /** zuletzt eingetragen */
  at: number;
}

const same = (a: Pick<RecentExtra, 'label' | 'kcal' | 'protein'>, b: Pick<RecentExtra, 'label' | 'kcal' | 'protein'>) =>
  a.label === b.label && a.kcal === b.kcal && a.protein === b.protein;

/** Merkt sich einen Eintrag; die zwölf neuesten bleiben. Namenlose Einträge sagen später nichts und bleiben draußen. */
export function remember(list: RecentExtra[], entry: Pick<RecentExtra, 'label' | 'kcal' | 'protein'>, now: number): RecentExtra[] {
  if (entry.label === UNNAMED) return list;
  const existing = list.find((x) => same(x, entry));
  const next = existing ? list.map((x) => (x === existing ? { ...x, n: x.n + 1, at: now } : x)) : [...list, { ...entry, n: 1, at: now }];
  return next.sort((a, b) => b.at - a.at).slice(0, 12);
}

/** Die zuletzt eingetragenen, ohne die festen Schnellauswahl-Einträge */
export function topRecent(stored: unknown, skipLabels: string[], count = 6): RecentExtra[] {
  if (!Array.isArray(stored)) return [];
  return (stored as RecentExtra[]).filter((r) => !skipLabels.includes(r.label)).slice(0, count);
}
