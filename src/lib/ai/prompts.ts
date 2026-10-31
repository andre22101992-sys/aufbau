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

const RECEIPT_FORMAT = '{"items": [{"text": "<Name wie auf dem Bon>", "euro": 1.29, "food": "<id oder leer>"}], "total": 33.85}';

/** Bon auslesen: per Foto an Claude oder als gescannter Text an Apple Intelligence */
export function receiptPrompt(text?: string, short = false): string {
  const ids = FOODS.map((f) => f.id).join(', ');
  if (short) {
    return `Sortiere diesen Kassenbon in Artikel und Preise. Rabatte vom Artikel abziehen, Pfand als eigener Artikel, die Summe als "total". Ordne jedem Artikel wenn möglich eine dieser IDs zu: ${ids}. Antworte nur mit JSON: ${RECEIPT_FORMAT}\n\nBon:\n${text ?? ''}`;
  }
  return [
    text ? 'Hier ist der Text eines Lidl-Kassenbons:' : 'Im Bild siehst du einen Lidl-Kassenbon (Papier oder Lidl Plus).',
    text ?? '',
    '',
    'Lies alle Artikel mit ihrem Endpreis aus. Rabatte und Preisvorteile ziehst du direkt vom Artikel ab, Pfand ist ein eigener Artikel. Mengenzeilen wie „2 x 0,79“ gehören zum Artikel darüber. Zahlungsdaten ignorierst du.',
    `Ordne jedem Artikel wenn möglich eine dieser Lebensmittel-IDs zu, sonst lass "food" leer: ${FOOD_LIST}.`,
    '',
    'Antworte nur mit einem JSON-Block in genau diesem Format, ohne weiteren Text:',
    '```json',
    RECEIPT_FORMAT,
    '```',
  ]
    .filter((line, i) => !(i === 1 && !line))
    .join('\n');
}

export interface WeekSummary {
  trainings: number;
  planned: number;
  weightChange: number | null;
  trend: number | null;
  sleepAvg: number | null;
  kcalTarget: number;
  feelings: number[];
  /** Was du in den letzten 7 Tagen wirklich gegessen hast */
  intakeKcal?: number | null;
  intakeProtein?: number | null;
  goodDays?: number;
}

/** Wochen-Coach: kurze Tipps über Apple Intelligence, ausführliche Auswertung über Claude */
export function coachPrompt(s: WeekSummary, short = false): string {
  const facts = [
    `Trainings: ${s.trainings} von ${s.planned}`,
    s.weightChange !== null ? `Wochenschnitt Gewicht: ${s.weightChange >= 0 ? '+' : ''}${s.weightChange.toFixed(1)} kg zur Vorwoche (Ziel +0,2 bis +0,5 kg)` : 'Gewicht: zu wenige Werte',
    s.trend !== null ? `Trendgewicht: ${s.trend.toFixed(1)} kg` : '',
    s.sleepAvg !== null ? `Schlaf im Schnitt: ${s.sleepAvg.toFixed(1)} h` : '',
    s.intakeKcal != null
      ? `Gegessen im Schnitt: ${Math.round(s.intakeKcal)} kcal und ${Math.round(s.intakeProtein ?? 0)} g Protein pro Tag, an ${s.goodDays ?? 0} Tagen mindestens 4 Mahlzeiten`
      : '',
    s.feelings.length ? `Gefühl nach den Trainings (1–5): ${s.feelings.join(', ')}` : '',
    `Kalorienziel: ${s.kcalTarget} kcal, mindestens 120 g Protein`,
  ].filter(Boolean);
  if (short) return `Gib mir 2 kurze, freundliche Tipps auf Deutsch für meine nächste Trainingswoche (Muskelaufbau, Anfänger). Daten: ${facts.join('; ')}.`;
  return [
    'Ich bin Anfänger im Muskelaufbau (Fokus Oberkörper und Arme), trainiere 5× pro Woche zu Hause mit einer Kurzhantel und esse nach Plan. Hier ist meine Woche:',
    ...facts.map((f) => `- ${f}`),
    '',
    'Gib mir 2–3 konkrete, ermutigende Tipps für die nächste Woche: Training, Essen oder Erholung. Kurz und ohne Fachchinesisch.',
  ].join('\n');
}
