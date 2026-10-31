// Gemeinsamer App-Zustand. Svelte-Zustände sind Proxys; vor dem Speichern immer $state.snapshot nutzen.

import { withDefaults, type ActiveWorkout, type Settings, type SleepEntry, type WeightEntry, type Workout } from '../model';
import { CUSTOM_FOODS_KEY, addCustomFoods, type Food } from '../../data/foods';
import { CUSTOM_KEY, addCustomRecipes, type Recipe } from '../../data/recipes';
import type { ScaleEntry } from '../scale';
import * as repo from '../repo';

interface Toast {
  id: number;
  text: string;
}

export const app = $state({
  ready: false,
  settings: withDefaults(null) as Settings,
  workouts: [] as Workout[],
  /** nach Datum sortiert */
  weights: [] as WeightEntry[],
  sleep: [] as SleepEntry[],
  /** Werte der Körperwaage, alle paar Wochen */
  scale: [] as ScaleEntry[],
  overrides: {} as Record<string, unknown>,
  active: null as ActiveWorkout | null,
  needRefresh: false,
  toast: null as Toast | null,
});

export async function loadApp(): Promise<void> {
  const [settings, workouts, weights, sleep, scale, overrides, active] = await Promise.all([
    repo.loadSettings(),
    repo.listWorkouts(),
    repo.listWeights(),
    repo.listSleep(),
    repo.listScale(),
    repo.listOverrides(),
    repo.loadActiveWorkout(),
  ]);
  app.settings = settings;
  app.workouts = workouts;
  app.weights = weights;
  app.sleep = sleep;
  app.scale = scale;
  app.overrides = overrides;
  if (Array.isArray(overrides[CUSTOM_FOODS_KEY])) addCustomFoods(overrides[CUSTOM_FOODS_KEY] as Food[]);
  if (Array.isArray(overrides[CUSTOM_KEY])) addCustomRecipes(overrides[CUSTOM_KEY] as Recipe[]);
  app.active = active;
  app.ready = true;
}

let settingsTimer: ReturnType<typeof setTimeout> | undefined;

/** Speichert die Einstellungen kurz verzögert, damit schnelles Tippen nicht jedes Mal schreibt. */
export function saveSettings(): void {
  clearTimeout(settingsTimer);
  settingsTimer = setTimeout(() => void repo.saveSettings($state.snapshot(app.settings) as Settings), 150);
}

export async function saveSettingsNow(): Promise<void> {
  clearTimeout(settingsTimer);
  await repo.saveSettings($state.snapshot(app.settings) as Settings);
}

export async function setOverride(key: string, value: unknown): Promise<void> {
  if (value === undefined || value === null || value === '') delete app.overrides[key];
  else app.overrides[key] = value;
  await repo.setOverride(key, value);
}

export async function reloadWorkouts(): Promise<void> {
  app.workouts = await repo.listWorkouts();
}

let toastId = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function showToast(text: string): void {
  app.toast = { id: ++toastId, text };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    app.toast = null;
  }, 3200);
}
