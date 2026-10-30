// Vorschau auf die erste Woche, bis das Essen- und Einkaufsmodul fertig ist (Phase 4 und 5).
// Werte sind Durchschnittswerte, Preise geschätzte Lidl-Preise.

export interface MealRow {
  time: string;
  place: string;
  meal: string;
  kcal: number;
  protein: number;
}

export const OFFICE_DAY: MealRow[] = [
  { time: '5:30', place: 'zu Hause', meal: '250 ml Milch und eine Banane', kcal: 270, protein: 10 },
  { time: '9:00', place: 'Büro', meal: 'Overnight Oats aus 100 g Haferflocken und 300 ml Milch, dazu optional Kreatin', kcal: 560, protein: 23 },
  { time: '12:30', place: 'Büro', meal: 'Portion vom Vorabend, in der Mikrowelle dampfend heiß aufwärmen', kcal: 800, protein: 40 },
  { time: '15:30', place: 'Büro', meal: '2 hart gekochte Eier und 30 g Gouda', kcal: 270, protein: 21 },
  { time: '20:15', place: 'zu Hause', meal: 'Abendessen nach dem Training', kcal: 800, protein: 40 },
  { time: '21:15', place: 'zu Hause', meal: '250 ml Milch, danach Oats für morgen ansetzen', kcal: 160, protein: 8 },
];

export interface Dish {
  id: string;
  name: string;
  device: string;
  minutes: number;
  ingredients: string[];
  kcal: number;
  protein: number;
  euro: number;
  steps?: string[];
}

export const DISHES: Record<string, Dish> = {
  hack: {
    id: 'hack',
    name: 'Nudeltopf mit Hack',
    device: 'Topf',
    minutes: 25,
    ingredients: ['500 g Hackfleisch gemischt (ganze Packung)', '140 g Nudeln', '500 g passierte Tomaten', '1 Zwiebel', '2 Möhren', 'Brühe, Paprikapulver, Oregano'],
    kcal: 990,
    protein: 60,
    euro: 2.0,
  },
  haehnchen: {
    id: 'haehnchen',
    name: 'Crispi-Hähnchen mit Reis und Gemüse',
    device: 'Crispi und Topf',
    minutes: 25,
    ingredients: ['300 g Hähnchenbrust', '250 g Reis', '1 Dose Erbsen und Möhren', '1 Paprika', '3 EL Öl', 'Paprika- und Currypulver, Salz, Pfeffer'],
    kcal: 820,
    protein: 49,
    euro: 2.4,
    steps: [
      '500 ml Wasser in den Topf, Deckel drauf, Herd auf höchste Stufe. Paprika waschen.',
      'Hähnchen in 2–3 cm große Würfel schneiden. Mit 2 EL Öl, 1 TL Paprikapulver, ½ TL Curry, Salz und Pfeffer mischen. Danach Hände und Brett waschen.',
      'Sobald das Wasser kocht: Reis und ½ TL Salz hinein, kleine Stufe, Deckel drauf. Timer 15 Minuten.',
      'Hähnchen nebeneinander in den Crispi, 180 °C. Timer 14 Minuten.',
      'Währenddessen die Paprika in Streifen schneiden und die Dose abgießen.',
      'Nach 7 Minuten den Crispi schütteln, Paprika und 1 EL Öl dazugeben.',
      'Reis fertig: Herd aus, Erbsen und Möhren unterheben, 3 Minuten zugedeckt ziehen lassen.',
      'Garprobe: Das größte Stück aufschneiden. Es muss innen weiß sein, ohne Rosa. Sonst 2–3 Minuten weiter.',
      'Mischen und halbieren. Die Büro-Box 10–15 Minuten offen abkühlen lassen, dann vor dem Training in den Kühlschrank.',
      'Nach dem Training und im Büro dampfend heiß aufwärmen. Bei Reis ist das wichtig.',
    ],
  },
  linsen: {
    id: 'linsen',
    name: 'Linsen-Kartoffel-Eintopf mit Ei',
    device: 'Topf, Eier im Crispi',
    minutes: 30,
    ingredients: ['200 g rote Linsen', '500 g Kartoffeln', '2 Möhren', '1 Zwiebel', '3 EL Öl', 'Brühe', '2 Eier'],
    kcal: 790,
    protein: 37,
    euro: 1.1,
  },
  curry: {
    id: 'curry',
    name: 'Linsen-Curry',
    device: 'Topf',
    minutes: 30,
    ingredients: ['200 g rote Linsen', '400 g Kartoffeln', '300 g passierte Tomaten', '1 Zwiebel', '3 EL Öl', 'Currypulver', '2 Eier'],
    kcal: 760,
    protein: 38,
    euro: 1.1,
  },
  thunfisch: {
    id: 'thunfisch',
    name: 'Nudeltopf mit Thunfisch',
    device: 'Topf',
    minutes: 20,
    ingredients: ['260 g Nudeln', '1 Dose Thunfisch natur', '500 g passierte Tomaten', '1 Zwiebel', '2 EL Öl', '60 g Gouda'],
    kcal: 830,
    protein: 46,
    euro: 1.6,
  },
};

export const DINNERS: { day: string; dish: string }[] = [
  { day: 'Samstag', dish: 'hack' },
  { day: 'Sonntag', dish: 'haehnchen' },
  { day: 'Montag', dish: 'linsen' },
  { day: 'Dienstag', dish: 'haehnchen' },
  { day: 'Mittwoch', dish: 'curry' },
  { day: 'Donnerstag', dish: 'thunfisch' },
  { day: 'Freitag', dish: 'linsen' },
];

export interface ShoppingSection {
  title: string;
  note?: string;
  items: { id: string; label: string; amount: string; hint?: string }[];
}

export const FIRST_SHOPPING: ShoppingSection[] = [
  {
    title: 'Obst und Gemüse',
    items: [
      { id: 'bananen', label: 'Bananen', amount: '7 Stück' },
      { id: 'kartoffeln', label: 'Kartoffeln', amount: '2,5 kg' },
      { id: 'moehren', label: 'Möhren', amount: '1 kg' },
      { id: 'zwiebeln', label: 'Zwiebeln', amount: '1 kg' },
      { id: 'paprika', label: 'Paprika', amount: '2 Stück' },
    ],
  },
  {
    title: 'Kühlregal',
    items: [
      { id: 'hack', label: 'Hackfleisch gemischt', amount: '500 g', hint: 'Am Einkaufstag kochen' },
      { id: 'haehnchen', label: 'Hähnchenbrustfilet', amount: '600 g', hint: 'Verbrauchsdatum bis mindestens Dienstag' },
      { id: 'gouda', label: 'Gouda', amount: '400 g' },
      { id: 'eier', label: 'Eier', amount: '20 Stück' },
    ],
  },
  {
    title: 'Milch und Trockenwaren',
    items: [
      { id: 'milch', label: 'H-Milch 3,5 %', amount: '6 × 1 l', hint: 'Hält ungeöffnet ohne Kühlschrank' },
      { id: 'hafer', label: 'Haferflocken, zart', amount: '2 × 500 g' },
      { id: 'nudeln', label: 'Nudeln', amount: '500 g' },
      { id: 'reis', label: 'Langkornreis', amount: '1 kg' },
      { id: 'linsen', label: 'Rote Linsen', amount: '2 × 500 g' },
    ],
  },
  {
    title: 'Konserven',
    items: [
      { id: 'tomaten', label: 'Passierte Tomaten', amount: '3 × 500 g' },
      { id: 'erbsen', label: 'Erbsen und Möhren', amount: '2 Dosen' },
      { id: 'thunfisch', label: 'Thunfisch natur', amount: '1 Dose' },
    ],
  },
  {
    title: 'Grundvorrat, nur beim ersten Einkauf',
    note: 'Zusammen etwa 8–10 €, hält viele Wochen.',
    items: [
      { id: 'oel', label: 'Rapsöl', amount: '1 l' },
      { id: 'salz', label: 'Salz und Pfeffer', amount: 'je 1' },
      { id: 'gewuerze', label: 'Paprikapulver, Curry, Oregano', amount: 'je 1' },
      { id: 'bruehe', label: 'Gemüsebrühe', amount: '1 Glas' },
    ],
  },
  {
    title: 'Ausstattung, falls noch nicht da',
    items: [
      { id: 'boxen', label: 'Mikrowellenfeste Boxen', amount: '2–3 Stück' },
      { id: 'glas', label: 'Schraubglas für Oats und Shake', amount: '1 Stück' },
      { id: 'waage', label: 'Küchenwaage', amount: 'empfohlen' },
    ],
  },
  {
    title: 'Drogerie, freiwillig',
    note: 'Bei Lidl nur ab und zu im Angebot.',
    items: [{ id: 'kreatin', label: 'Kreatin-Monohydrat', amount: '500 g, reicht etwa 3–4 Monate' }],
  },
];
