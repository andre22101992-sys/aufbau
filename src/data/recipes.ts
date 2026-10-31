// Rezepte mit Schritten. Mengen gelten für 2 Portionen: eine fürs Abendessen, eine für die Büro-Box.
// In den Schritten stehen Platzhalter: {reis} wird zur passenden Menge Reis, {wasser:reis:2} zu 2 ml Wasser je Gramm Reis.
// Jeder Schritt hat ein Gerät, eine Startminute und eine Dauer; daraus entsteht der Zeitstrahl.

import { MORE_RECIPES } from './recipes-more';

export type Device = 'topf' | 'crispi' | 'du';

export interface Step {
  text: string;
  device: Device;
  /** Startminute ab Kochbeginn */
  at: number;
  minutes: number;
  /** Koch-Timer in Minuten */
  timer?: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: { food: string; grams: number }[];
  steps: Step[];
  /** höchstens so viel Gramm passen auf einmal in den Crispi */
  crispiMax?: { food: string; grams: number };
}

export const DEVICE_LABELS: Record<Device, string> = { topf: 'Topf', crispi: 'Crispi', du: 'Du' };

export const RECIPES: Recipe[] = [
  {
    id: 'hack',
    name: 'Nudeltopf mit Hack',
    servings: 2,
    ingredients: [
      { food: 'hack', grams: 500 },
      { food: 'nudeln', grams: 140 },
      { food: 'tomaten', grams: 500 },
      { food: 'zwiebel', grams: 100 },
      { food: 'moehren', grams: 160 },
      { food: 'bruehe', grams: 5 },
      { food: 'gewuerz', grams: 4 },
    ],
    steps: [
      { device: 'du', at: 0, minutes: 4, text: 'Zwiebel ({zwiebel}) würfeln, Möhren ({moehren}) schälen und in Scheiben schneiden.' },
      { device: 'topf', at: 4, minutes: 6, text: 'Hack ({hack}) ohne Öl im Topf krümelig anbraten, das Hack hat genug Fett. Zwiebel und Möhren 2 Minuten mitbraten.' },
      { device: 'topf', at: 10, minutes: 2, text: 'Tomaten ({tomaten}), {wasser:nudeln:2.5} Wasser, 1 TL Brühe, Paprikapulver und Oregano dazu und aufkochen.' },
      { device: 'topf', at: 12, minutes: 12, timer: 12, text: 'Nudeln ({nudeln}) einrühren, mittlere Stufe, Deckel halb drauf. Ab und zu umrühren, damit nichts ansetzt.' },
      { device: 'du', at: 24, minutes: 2, text: 'Mit Salz und Pfeffer abschmecken, halbieren. Die Büro-Box 10–15 Minuten offen abkühlen lassen, dann in den Kühlschrank.' },
    ],
  },
  {
    id: 'haehnchen',
    name: 'Crispi-Hähnchen mit Reis und Gemüse',
    servings: 2,
    ingredients: [
      { food: 'haehnchen', grams: 300 },
      { food: 'reis', grams: 250 },
      { food: 'erbsen', grams: 265 },
      { food: 'paprika', grams: 160 },
      { food: 'oel', grams: 30 },
      { food: 'gewuerz', grams: 4 },
    ],
    crispiMax: { food: 'haehnchen', grams: 600 },
    steps: [
      { device: 'du', at: 0, minutes: 2, text: '{wasser:reis:2} Wasser in den Topf, Deckel drauf, Herd auf höchste Stufe. Paprika waschen.' },
      { device: 'du', at: 2, minutes: 5, text: 'Hähnchen ({haehnchen}) in 2–3 cm große Würfel schneiden. Mit 2 EL Öl, 1 TL Paprikapulver, ½ TL Curry, Salz und Pfeffer mischen. Danach Hände und Brett waschen.' },
      { device: 'topf', at: 6, minutes: 15, timer: 15, text: 'Sobald das Wasser kocht: Reis ({reis}) und ½ TL Salz hinein, kleine Stufe, Deckel drauf.' },
      { device: 'crispi', at: 7, minutes: 14, timer: 14, text: 'Hähnchen nebeneinander in den Crispi, 180 °C.' },
      { device: 'du', at: 8, minutes: 4, text: 'Währenddessen die Paprika ({paprika}) in Streifen schneiden und die Dose ({erbsen}) abgießen.' },
      { device: 'crispi', at: 14, minutes: 1, text: 'Crispi schütteln, Paprika und 1 EL Öl dazugeben.' },
      { device: 'topf', at: 21, minutes: 3, timer: 3, text: 'Reis fertig: Herd aus, Erbsen und Möhren unterheben, 3 Minuten zugedeckt ziehen lassen.' },
      { device: 'du', at: 21, minutes: 1, text: 'Garprobe: Das größte Stück Hähnchen aufschneiden. Innen muss es weiß sein, ohne Rosa. Sonst 2–3 Minuten weiter.' },
      { device: 'du', at: 24, minutes: 2, text: 'Mischen und halbieren. Die Büro-Box 10–15 Minuten offen abkühlen lassen, dann in den Kühlschrank. Später dampfend heiß aufwärmen.' },
    ],
  },
  {
    id: 'linsen',
    name: 'Linsen-Kartoffel-Eintopf mit Ei',
    servings: 2,
    ingredients: [
      { food: 'linsen', grams: 200 },
      { food: 'kartoffeln', grams: 500 },
      { food: 'moehren', grams: 160 },
      { food: 'zwiebel', grams: 100 },
      { food: 'oel', grams: 30 },
      { food: 'ei', grams: 120 },
      { food: 'bruehe', grams: 10 },
    ],
    steps: [
      { device: 'du', at: 0, minutes: 6, text: 'Zwiebel ({zwiebel}) würfeln. Kartoffeln ({kartoffeln}) schälen und würfeln, Möhren ({moehren}) in Scheiben schneiden.' },
      { device: 'crispi', at: 2, minutes: 13, timer: 13, text: 'Eier ({ei}) in den Crispi, 160 °C. So werden sie hart gekocht.' },
      { device: 'topf', at: 6, minutes: 3, text: 'Öl ({oel}) im Topf erhitzen, Zwiebel darin glasig anbraten.' },
      { device: 'topf', at: 9, minutes: 18, timer: 18, text: 'Kartoffeln, Möhren, Linsen ({linsen}), {wasser:linsen:5} Wasser und 2 TL Brühe dazu. Aufkochen, dann mittlere Stufe, ab und zu umrühren.' },
      { device: 'du', at: 15, minutes: 2, text: 'Eier in kaltes Wasser legen und pellen.' },
      { device: 'du', at: 27, minutes: 3, text: 'Abschmecken, halbieren und je ein Ei dazugeben. Die Büro-Box offen abkühlen lassen, dann in den Kühlschrank.' },
    ],
  },
  {
    id: 'curry',
    name: 'Linsen-Curry',
    servings: 2,
    ingredients: [
      { food: 'linsen', grams: 200 },
      { food: 'kartoffeln', grams: 400 },
      { food: 'tomaten', grams: 300 },
      { food: 'zwiebel', grams: 100 },
      { food: 'oel', grams: 30 },
      { food: 'ei', grams: 120 },
      { food: 'bruehe', grams: 5 },
      { food: 'gewuerz', grams: 4 },
    ],
    steps: [
      { device: 'du', at: 0, minutes: 6, text: 'Zwiebel ({zwiebel}) würfeln, Kartoffeln ({kartoffeln}) schälen und würfeln.' },
      { device: 'crispi', at: 2, minutes: 13, timer: 13, text: 'Eier ({ei}) in den Crispi, 160 °C.' },
      { device: 'topf', at: 6, minutes: 3, text: 'Öl ({oel}) erhitzen, Zwiebel glasig anbraten, 2 TL Curry kurz mitrösten.' },
      { device: 'topf', at: 9, minutes: 18, timer: 18, text: 'Kartoffeln, Linsen ({linsen}), Tomaten ({tomaten}), {wasser:linsen:3.5} Wasser und 1 TL Brühe dazu. Aufkochen, dann mittlere Stufe.' },
      { device: 'du', at: 15, minutes: 2, text: 'Eier in kaltes Wasser legen und pellen.' },
      { device: 'du', at: 27, minutes: 3, text: 'Abschmecken, halbieren und je ein Ei dazugeben. Die Büro-Box offen abkühlen lassen, dann in den Kühlschrank.' },
    ],
  },
  {
    id: 'thunfisch',
    name: 'Nudeltopf mit Thunfisch',
    servings: 2,
    ingredients: [
      { food: 'nudeln', grams: 260 },
      { food: 'thunfisch', grams: 150 },
      { food: 'tomaten', grams: 500 },
      { food: 'zwiebel', grams: 100 },
      { food: 'oel', grams: 20 },
      { food: 'gouda', grams: 60 },
      { food: 'bruehe', grams: 5 },
      { food: 'gewuerz', grams: 2 },
    ],
    steps: [
      { device: 'du', at: 0, minutes: 3, text: 'Zwiebel ({zwiebel}) würfeln.' },
      { device: 'topf', at: 3, minutes: 3, text: 'Öl ({oel}) erhitzen, Zwiebel glasig anbraten.' },
      { device: 'topf', at: 6, minutes: 2, text: 'Tomaten ({tomaten}), {wasser:nudeln:2.5} Wasser, 1 TL Brühe und Oregano dazu und aufkochen.' },
      { device: 'topf', at: 8, minutes: 11, timer: 11, text: 'Nudeln ({nudeln}) einrühren, mittlere Stufe, ab und zu umrühren.' },
      { device: 'du', at: 10, minutes: 3, text: 'Thunfisch ({thunfisch}) abgießen, Gouda ({gouda}) klein schneiden.' },
      { device: 'du', at: 19, minutes: 2, text: 'Thunfisch unterheben, Gouda darüber, halbieren. Die Büro-Box offen abkühlen lassen, dann in den Kühlschrank.' },
    ],
  },
  ...MORE_RECIPES,
];

/** Schnell aus dem Vorrat, wenn du nicht richtig kochen kannst */
export const PLAN_B = ['eierreis', 'thunfisch'];

/** Grundgerichte im Wechsel; die übrigen sind die Rezeptsammlung */
export const BASE_RECIPES = ['hack', 'haehnchen', 'linsen', 'curry', 'thunfisch'];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function getRecipe(id: string): Recipe {
  const recipe = RECIPE_BY_ID[id];
  if (!recipe) throw new Error(`Unbekanntes Rezept: ${id}`);
  return recipe;
}

/** Gespeicherte eigene Rezepte (von Claude, Apple Intelligence oder umgewandelt) */
export const CUSTOM_KEY = 'recipes:custom';

export function addCustomRecipes(list: Recipe[]): void {
  for (const recipe of list) {
    if (RECIPE_BY_ID[recipe.id]) continue;
    RECIPES.push(recipe);
    RECIPE_BY_ID[recipe.id] = recipe;
  }
}
