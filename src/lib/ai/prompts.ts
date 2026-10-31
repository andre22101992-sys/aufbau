// Anfragen an Claude und Apple Intelligence. Die App schickt nur, was für die Aufgabe nötig ist.
// Für Apple Intelligence sind die Anfragen kürzer, weil das Modell auf dem iPhone nur wenig Text verarbeitet.

import { FOODS } from '../../data/foods';

const FOOD_LIST = FOODS.map((f) => `${f.id} (${f.name})`).join(', ');

const RECIPE_FORMAT = `{"name": "…", "servings": 2, "ingredients": [{"food": "<id>", "grams": 300}], "steps": [{"text": "…", "device": "topf|crispi|du", "at": 0, "minutes": 5, "timer": 15}]}`;

const RULES = [
  '2 Portionen: eine fürs Abendessen, eine als Büro-Box für den nächsten Mittag (Mikrowelle).',
  'Geräte: ein Topf auf dem Herd und eine Heißluftfritteuse (Ninja Crispi) mit höchstens 180 °C. Kein Backofen, kein Gefrierfach.',
  'Pro Portion mindestens 35 g Protein und etwa 750–950 kcal.',
  'Nur günstige Zutaten von Lidl, höchstens etwa 2,50 € pro Portion.',
  'Kein Erdnussmus, kein Magerquark.',
  `Zutaten nur aus dieser Liste, mit genau diesen IDs und Gramm für 2 Portionen: ${FOOD_LIST}.`,
  'Schritte kurz und konkret, mit Mengen im Text. Jeder Schritt hat ein Gerät (topf, crispi oder du), eine Startminute "at", eine Dauer "minutes" und bei Wartezeiten einen "timer" in Minuten. Topf und Crispi dürfen parallel laufen, aber jedes Gerät nur einen Schritt gleichzeitig.',
  'Am Ende: Garprobe bei Fleisch, Box offen abkühlen lassen, dann in den Kühlschrank, später dampfend heiß aufwärmen.',
];

export function newRecipePrompt(wish: string, short = false): string {
  if (short) {
    return `Erfinde ein Rezept für 2 Portionen mit Topf und Heißluftfritteuse (max. 180 °C), mindestens 35 g Protein pro Portion, günstige Lidl-Zutaten. ${wish ? `Wunsch: ${wish}. ` : ''}Zutaten nur mit diesen IDs: ${FOODS.map((f) => f.id).join(', ')}. Antworte nur mit JSON: ${RECIPE_FORMAT}`;
  }
  return [
    'Ich nutze eine Trainings-App zum Muskelaufbau und brauche ein neues Rezept.',
    wish ? `Mein Wunsch: ${wish}` : 'Überrasch mich mit etwas, das gut zu meinem Plan passt.',
    '',
    'Regeln:',
    ...RULES.map((r) => `- ${r}`),
    '',
    'Antworte nur mit einem JSON-Block in genau diesem Format, ohne weiteren Text:',
    '```json',
    RECIPE_FORMAT,
    '```',
  ].join('\n');
}

export function convertPrompt(note: string): string {
  return [
    'Im Bild siehst du ein Rezept (Screenshot aus einer App, von Instagram oder einem Kochbuch). Bau es für mich um.',
    note ? `Hinweis: ${note}` : '',
    '',
    'Regeln:',
    ...RULES.map((r) => `- ${r}`),
    'Behalte den Charakter des Gerichts, ersetze aber teure oder fehlende Zutaten durch passende aus der Liste.',
    '',
    'Antworte nur mit einem JSON-Block in genau diesem Format, ohne weiteren Text:',
    '```json',
    RECIPE_FORMAT,
    '```',
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n');
}

export function photoPrompt(): string {
  return [
    'Schätze für das Essen auf dem Foto die Kalorien und das Protein der ganzen sichtbaren Portion.',
    'Antworte nur mit einem JSON-Block, ohne weiteren Text:',
    '```json',
    '{"label": "<kurzer Name>", "kcal": 650, "protein": 30}',
    '```',
  ].join('\n');
}
