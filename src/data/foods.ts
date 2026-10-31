// Lebensmittel mit Nährwerten je 100 g und geschätzten Lidl-Preisen.
// Nährwerte sind Durchschnittswerte, Preise Schätzungen; beides wird später über Bon und Barcode genauer.

export interface Food {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fiber: number;
  /** mg je 100 g */
  calcium: number;
  iron: number;
  vitaminC: number;
  /** Packung: Gramm und Preis in Euro */
  pack: { grams: number; euro: number; label: string };
  /** Haushaltsmaß, z. B. 1 Ei = 60 g, 1 EL Öl = 10 g */
  unit?: { name: string; plural: string; grams: number };
  /** Gewürze und Grundvorrat zählen nicht zu den Wochenkosten */
  basic?: boolean;
}

export const FOODS: Food[] = [
  { id: 'milch', name: 'H-Milch 3,5 %', kcal: 64, protein: 3.3, fiber: 0, calcium: 120, iron: 0, vitaminC: 1, pack: { grams: 1000, euro: 1.09, label: '1 l' }, unit: { name: 'ml', plural: 'ml', grams: 1 } },
  { id: 'banane', name: 'Banane', kcal: 95, protein: 1.1, fiber: 2, calcium: 5, iron: 0.3, vitaminC: 11, pack: { grams: 1000, euro: 1.69, label: '1 kg' }, unit: { name: 'Banane', plural: 'Bananen', grams: 120 } },
  { id: 'remoulade', name: 'Remoulade', kcal: 330, protein: 1, fiber: 0, calcium: 15, iron: 0.3, vitaminC: 0, pack: { grams: 250, euro: 1.09, label: '1 Glas' }, unit: { name: 'EL', plural: 'EL', grams: 15 } },
  { id: 'hafer', name: 'Haferflocken, zart', kcal: 370, protein: 13.5, fiber: 10, calcium: 50, iron: 4.5, vitaminC: 0, pack: { grams: 500, euro: 0.79, label: '500 g' } },
  { id: 'ei', name: 'Eier', kcal: 140, protein: 12.5, fiber: 0, calcium: 50, iron: 1.9, vitaminC: 0, pack: { grams: 600, euro: 2.5, label: '10 Stück' }, unit: { name: 'Ei', plural: 'Eier', grams: 60 } },
  { id: 'gouda', name: 'Gouda', kcal: 356, protein: 25, fiber: 0, calcium: 800, iron: 0.2, vitaminC: 0, pack: { grams: 400, euro: 2.99, label: '400 g' } },
  { id: 'hack', name: 'Hackfleisch gemischt', kcal: 250, protein: 17, fiber: 0, calcium: 10, iron: 1.8, vitaminC: 0, pack: { grams: 500, euro: 2.75, label: '500 g' } },
  { id: 'schenkel', name: 'Hähnchenschenkel, mit Knochen und Haut', kcal: 135, protein: 13, fiber: 0, calcium: 10, iron: 0.8, vitaminC: 0, pack: { grams: 1000, euro: 4.49, label: '1 kg' } },
  { id: 'suppengruen', name: 'Suppengrün', kcal: 35, protein: 1.5, fiber: 3, calcium: 40, iron: 0.7, vitaminC: 12, pack: { grams: 400, euro: 1.09, label: '1 Bund' }, unit: { name: 'Bund', plural: 'Bund', grams: 400 } },
  { id: 'haehnchen', name: 'Hähnchenbrustfilet', kcal: 110, protein: 23.5, fiber: 0, calcium: 10, iron: 0.6, vitaminC: 0, pack: { grams: 600, euro: 5.4, label: '600 g' } },
  { id: 'reis', name: 'Langkornreis', kcal: 350, protein: 7, fiber: 1.3, calcium: 10, iron: 0.8, vitaminC: 0, pack: { grams: 1000, euro: 1.59, label: '1 kg' } },
  { id: 'nudeln', name: 'Nudeln', kcal: 355, protein: 12.5, fiber: 3, calcium: 20, iron: 1.5, vitaminC: 0, pack: { grams: 500, euro: 0.79, label: '500 g' } },
  { id: 'linsen', name: 'Rote Linsen', kcal: 340, protein: 24, fiber: 11, calcium: 50, iron: 7.5, vitaminC: 2, pack: { grams: 500, euro: 1.29, label: '500 g' } },
  { id: 'kartoffeln', name: 'Kartoffeln', kcal: 77, protein: 2, fiber: 2, calcium: 6, iron: 0.4, vitaminC: 15, pack: { grams: 2500, euro: 2.49, label: '2,5 kg' } },
  { id: 'moehren', name: 'Möhren', kcal: 36, protein: 0.8, fiber: 3, calcium: 35, iron: 0.3, vitaminC: 6, pack: { grams: 1000, euro: 0.99, label: '1 kg' }, unit: { name: 'Möhre', plural: 'Möhren', grams: 80 } },
  { id: 'zwiebel', name: 'Zwiebeln', kcal: 33, protein: 1.2, fiber: 2, calcium: 25, iron: 0.2, vitaminC: 7, pack: { grams: 1000, euro: 1.29, label: '1 kg' }, unit: { name: 'Zwiebel', plural: 'Zwiebeln', grams: 100 } },
  { id: 'paprika', name: 'Paprika', kcal: 30, protein: 1, fiber: 3.5, calcium: 10, iron: 0.4, vitaminC: 120, pack: { grams: 160, euro: 0.79, label: '1 Stück' }, unit: { name: 'Paprika', plural: 'Paprika', grams: 160 } },
  { id: 'tomaten', name: 'Passierte Tomaten', kcal: 33, protein: 1.4, fiber: 1.5, calcium: 15, iron: 0.6, vitaminC: 10, pack: { grams: 500, euro: 0.45, label: '500 g' } },
  { id: 'erbsen', name: 'Erbsen und Möhren, Dose', kcal: 60, protein: 3.5, fiber: 4.5, calcium: 20, iron: 1, vitaminC: 8, pack: { grams: 265, euro: 0.89, label: '1 Dose' }, unit: { name: 'Dose', plural: 'Dosen', grams: 265 } },
  { id: 'thunfisch', name: 'Thunfisch natur, Dose', kcal: 110, protein: 25, fiber: 0, calcium: 10, iron: 1, vitaminC: 0, pack: { grams: 150, euro: 1.39, label: '1 Dose' }, unit: { name: 'Dose', plural: 'Dosen', grams: 150 } },
  { id: 'kidney', name: 'Kidneybohnen, Dose', kcal: 110, protein: 8, fiber: 7, calcium: 35, iron: 2, vitaminC: 1, pack: { grams: 250, euro: 0.69, label: '1 Dose' }, unit: { name: 'Dose', plural: 'Dosen', grams: 250 } },
  { id: 'mais', name: 'Mais, Dose', kcal: 80, protein: 2.8, fiber: 3, calcium: 5, iron: 0.5, vitaminC: 5, pack: { grams: 285, euro: 0.79, label: '1 Dose' }, unit: { name: 'Dose', plural: 'Dosen', grams: 285 } },
  { id: 'oel', name: 'Rapsöl', kcal: 884, protein: 0, fiber: 0, calcium: 0, iron: 0, vitaminC: 0, pack: { grams: 920, euro: 1.99, label: '1 l' }, unit: { name: 'EL', plural: 'EL', grams: 10 }, basic: true },
  { id: 'bruehe', name: 'Gemüsebrühe', kcal: 0, protein: 0, fiber: 0, calcium: 0, iron: 0, vitaminC: 0, pack: { grams: 200, euro: 1.29, label: '1 Glas' }, unit: { name: 'TL', plural: 'TL', grams: 5 }, basic: true },
  { id: 'gewuerz', name: 'Gewürze', kcal: 0, protein: 0, fiber: 0, calcium: 0, iron: 0, vitaminC: 0, pack: { grams: 50, euro: 0.79, label: '1 Dose' }, unit: { name: 'TL', plural: 'TL', grams: 2 }, basic: true },
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export function getFood(id: string): Food {
  const food = FOOD_BY_ID[id];
  if (!food) throw new Error(`Unbekanntes Lebensmittel: ${id}`);
  return food;
}

/** Eigene Lebensmittel, z. B. per Barcode angelegt */
export const CUSTOM_FOODS_KEY = 'foods:custom';

export function addCustomFoods(list: Food[]): void {
  for (const food of list) {
    if (FOOD_BY_ID[food.id]) continue;
    FOODS.push(food);
    FOOD_BY_ID[food.id] = food;
  }
}
