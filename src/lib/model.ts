// Gespeicherte Datensätze und Einstellungen.

import type { DayId, Slot } from '../data/types';
import type { DateKey } from './dates';
import type { Timer } from './timers';

export type Technique = 'langsam' | 'pause';

/** Belastung eines Satzes: Hantelgewicht (optional mit Technik) oder Stufe einer Körpergewicht-/Zeitübung */
export type Load = { kind: 'kg'; kg: number; tech?: Technique } | { kind: 'level'; level: number };

export interface SetLog {
  load: Load;
  /** Wiederholungen, bei Zeitübungen Sekunden */
  reps: number;
  done: boolean;
}

export interface ExerciseLog {
  slotIndex: number;
  exerciseId: string;
  /** Wiederholungsbereich, der an diesem Tag galt */
  target?: { min: number; max: number };
  sets: SetLog[];
}

export type WorkoutMode = 'normal' | 'kurz' | 'entlastung';

export interface Workout {
  id: string;
  /** Tag, an dem trainiert wurde */
  date: DateKey;
  /** Geplanter Trainingstag (beim Nachholen kann er vom Wochentag abweichen) */
  dayId: DayId;
  blockId: string;
  startedAt: number;
  finishedAt?: number;
  mode: WorkoutMode;
  /** Gefühl nach dem Training, 1 (sehr schwer) bis 5 (richtig gut) */
  feeling?: number;
  exercises: ExerciseLog[];
}

export interface WorkoutHint {
  kind: 'start' | 'up' | 'down' | 'same' | 'maxed';
  reason: string;
}

export interface ActiveWorkout extends Workout {
  warmupDone: boolean;
  restTimer: Timer | null;
  /** Übungen dieses Trainings, nach Tausch, Wenig-Zeit-Modus oder Entlastung */
  slots: Slot[];
  hints: WorkoutHint[];
}

export type Theme = 'dark' | 'light' | 'auto';

export interface Times {
  trainingMoDo: string;
  trainingFr: string;
  cookMoDo: string;
  cookFr: string;
  wakeWeekday: string;
  wakeWeekend: string;
  oats: string;
  sleep: string;
  shopping: string;
}

export interface Profile {
  age: number | null;
  heightCm: number | null;
  startWeightKg: number | null;
}

export interface Settings {
  onboarded: boolean;
  profile: Profile;
  /** Montag der ersten Trainingswoche */
  startDate: DateKey | null;
  /** Hantelstufen in kg, leicht nach schwer */
  dumbbellSteps: number[];
  supersets: boolean;
  theme: Theme;
  times: Times;
  creatine: boolean;
  targetWeightKg: number;
  guidedWorkoutSeen: boolean;
  lastBackupAt: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  profile: { age: null, heightCm: null, startWeightKg: null },
  startDate: null,
  dumbbellSteps: [2.3, 4.5, 6.8, 9.1, 11.3],
  supersets: true,
  theme: 'dark',
  times: {
    trainingMoDo: '19:15',
    trainingFr: '17:15',
    cookMoDo: '18:30',
    cookFr: '16:15',
    wakeWeekday: '05:15',
    wakeWeekend: '08:00',
    oats: '21:15',
    sleep: '22:00',
    shopping: '10:00',
  },
  creatine: true,
  targetWeightKg: 60,
  guidedWorkoutSeen: false,
  lastBackupAt: null,
};

/** Ergänzt gespeicherte Einstellungen um neue Felder aus späteren App-Versionen. */
export function withDefaults(stored: Partial<Settings> | undefined | null): Settings {
  const base = structuredClone(DEFAULT_SETTINGS);
  if (!stored) return base;
  return {
    ...base,
    ...stored,
    profile: { ...base.profile, ...(stored.profile ?? {}) },
    times: { ...base.times, ...(stored.times ?? {}) },
    dumbbellSteps: stored.dumbbellSteps?.length ? [...stored.dumbbellSteps] : base.dumbbellSteps,
  };
}
