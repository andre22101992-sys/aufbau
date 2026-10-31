// Eigene Vorlagen: Essen, das du öfter isst, mit festen Werten. Ein Tipp statt jedes Mal schätzen.

export const TEMPLATES_KEY = 'extras:templates';
export const MAX_TEMPLATES = 20;

export interface Template {
  label: string;
  kcal: number;
  protein: number;
}

const valid = (x: unknown): x is Template =>
  !!x && typeof x === 'object' && typeof (x as Template).label === 'string' && Number.isFinite((x as Template).kcal) && Number.isFinite((x as Template).protein);

export function parseTemplates(stored: unknown): Template[] {
  return Array.isArray(stored) ? stored.filter(valid).map(({ label, kcal, protein }) => ({ label, kcal, protein })) : [];
}

/** Hängt eine Vorlage an; gleicher Name ersetzt die alte, damit sich Werte korrigieren lassen */
export function addTemplate(list: Template[], entry: Template): Template[] {
  const label = entry.label.trim();
  if (!label) return list;
  return [...list.filter((t) => t.label !== label), { label, kcal: entry.kcal, protein: entry.protein }].slice(-MAX_TEMPLATES);
}

export function removeTemplate(list: Template[], label: string): Template[] {
  return list.filter((t) => t.label !== label);
}
