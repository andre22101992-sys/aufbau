// Typen für die Trainingsinhalte (Übungen, Blöcke, Aufwärmen).

export type Muscle = 'brust' | 'ruecken' | 'schultern' | 'bizeps' | 'trizeps' | 'beine' | 'bauch';

export const MUSCLES: Muscle[] = ['brust', 'ruecken', 'schultern', 'bizeps', 'trizeps', 'beine', 'bauch'];

export const MUSCLE_LABELS: Record<Muscle, string> = {
  brust: 'Brust',
  ruecken: 'Rücken',
  schultern: 'Schultern',
  bizeps: 'Bizeps',
  trizeps: 'Trizeps',
  beine: 'Beine',
  bauch: 'Bauch',
};

/** dumbbell: Hantelstufen · bodyweight: eigene Stufen · time: Stufen, gemessen in Sekunden */
export type LoadKind = 'dumbbell' | 'bodyweight' | 'time';

export interface Exercise {
  id: string;
  name: string;
  kind: LoadKind;
  /** Einarmig bzw. einbeinig: Wiederholungen gelten je Seite */
  unilateral: boolean;
  primary: Muscle;
  /** Muskeln, die mitarbeiten; sie zählen in der Muskel-Übersicht halb */
  secondary: Muscle[];
  /** Stufen für Körpergewicht- und Zeitübungen, leicht nach schwer */
  levels?: string[];
  /** Hantelübung, die auch ohne Gewicht beginnen kann */
  allowNoWeight?: boolean;
  cues: string[];
  mistakes: string[];
  safety?: string;
  /** Gleichwertige Alternativen für „Übung tauschen“ */
  alternatives: string[];
  /** Schwerere Variante, wenn die Stufen-Leiter ausgereizt ist */
  harder?: string;
}

export type DayId = 'mo' | 'di' | 'mi' | 'do' | 'fr';

export const DAY_IDS: DayId[] = ['mo', 'di', 'mi', 'do', 'fr'];

export interface Slot {
  exerciseId: string;
  sets: number;
  /** Untere und obere Grenze: Wiederholungen bzw. Sekunden bei Zeitübungen */
  min: number;
  max: number;
  restSec: number;
  /** Gleicher Buchstabe = Supersatz */
  superset?: string;
}

export type WarmupId = 'oberkoerper' | 'beine';

export interface DayPlan {
  id: DayId;
  title: string;
  warmup: WarmupId;
  slots: Slot[];
}

export interface Block {
  id: string;
  name: string;
  firstWeek: number;
  lastWeek: number;
  days: Record<DayId, DayPlan>;
}

export interface WarmupItem {
  name: string;
  seconds: number;
  detail?: string;
}

export interface Warmup {
  id: WarmupId;
  title: string;
  items: WarmupItem[];
}
