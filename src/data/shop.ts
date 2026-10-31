// Einkauf: Bereiche, Symbole und Bon-Stichwörter je Lebensmittel.

export const SECTIONS = ['Obst und Gemüse', 'Kühlregal', 'Milch und Trockenwaren', 'Konserven', 'Grundvorrat'] as const;
export type Section = (typeof SECTIONS)[number];

export interface ShopInfo {
  section: Section;
  icon: string;
  /** Vorrat: hält lange, deshalb vor dem Einkauf kurz „Noch da?“ fragen */
  pantry?: boolean;
  /** Wörter, an denen die App den Artikel auf dem Bon erkennt (klein, ohne Umlaute) */
  keywords: string[];
}

export const SHOP: Record<string, ShopInfo> = {
  banane: { section: 'Obst und Gemüse', icon: '🍌', keywords: ['banan'] },
  kartoffeln: { section: 'Obst und Gemüse', icon: '🥔', pantry: true, keywords: ['kartoff', 'drillinge'] },
  moehren: { section: 'Obst und Gemüse', icon: '🥕', pantry: true, keywords: ['moehr', 'mohr', 'karott'] },
  zwiebel: { section: 'Obst und Gemüse', icon: '🧅', pantry: true, keywords: ['zwieb'] },
  paprika: { section: 'Obst und Gemüse', icon: '🫑', keywords: ['paprika'] },
  hack: { section: 'Kühlregal', icon: '🥩', keywords: ['hack'] },
  schenkel: { section: 'Kühlregal', icon: '🍗', keywords: ['schenkel', 'keule'] },
  suppengruen: { section: 'Obst und Gemüse', icon: '🥬', keywords: ['suppengr'] },
  haehnchen: { section: 'Kühlregal', icon: '🍗', keywords: ['haehn', 'hahn', 'huhn', 'chicken', 'gefl'] },
  remoulade: { section: 'Kühlregal', icon: '🫙', pantry: true, keywords: ['remoulade', 'mayo'] },
  gouda: { section: 'Kühlregal', icon: '🧀', keywords: ['gouda', 'kaese'] },
  ei: { section: 'Kühlregal', icon: '🥚', keywords: ['eier', 'ei '] },
  milch: { section: 'Milch und Trockenwaren', icon: '🥛', keywords: ['milch'] },
  hafer: { section: 'Milch und Trockenwaren', icon: '🌾', pantry: true, keywords: ['hafer'] },
  nudeln: { section: 'Milch und Trockenwaren', icon: '🍝', pantry: true, keywords: ['nudel', 'spaghetti', 'fusilli', 'penne', 'farfalle', 'makkaroni'] },
  reis: { section: 'Milch und Trockenwaren', icon: '🍚', pantry: true, keywords: ['reis'] },
  linsen: { section: 'Milch und Trockenwaren', icon: '🫘', pantry: true, keywords: ['linse'] },
  tomaten: { section: 'Konserven', icon: '🍅', pantry: true, keywords: ['passiert', 'tomat'] },
  erbsen: { section: 'Konserven', icon: '🫛', pantry: true, keywords: ['erbse'] },
  thunfisch: { section: 'Konserven', icon: '🐟', pantry: true, keywords: ['thunf'] },
  kidney: { section: 'Konserven', icon: '🫘', pantry: true, keywords: ['kidney', 'bohne'] },
  mais: { section: 'Konserven', icon: '🌽', pantry: true, keywords: ['mais'] },
  oel: { section: 'Grundvorrat', icon: '🫒', pantry: true, keywords: ['oel', 'rapsoel', 'sonnenbl'] },
  bruehe: { section: 'Grundvorrat', icon: '🥣', pantry: true, keywords: ['bruehe', 'bouillon'] },
  gewuerz: { section: 'Grundvorrat', icon: '🧂', pantry: true, keywords: ['salz', 'pfeffer', 'paprikapulver', 'curry', 'oregano', 'gewuerz'] },
};

export function shopInfo(foodId: string): ShopInfo {
  return SHOP[foodId] ?? { section: 'Milch und Trockenwaren', icon: '🛒', keywords: [] };
}

/** Tagesbudget für Lebensmittel bei Lidl */
export const BUDGET_PER_DAY = 5.25;
