// Das laufende Training: starten, Sätze abhaken, Pausen-Timer, Übung tauschen, speichern.
// Der Entwurf wird laufend gespeichert, damit nichts verloren geht, wenn iOS die App beendet.

import { START_LOADS, getExercise } from '../../data/exercises';
import type { DayId, Slot } from '../../data/types';
import { todayKey, weekStart } from '../dates';
import { buildLadder, startRung, type Rung } from '../ladder';
import type { ActiveWorkout, ExerciseLog, Workout, WorkoutMode } from '../model';
import { blockById, deloadVersion, plannedDay, resolveSlots, shortVersion, swapKey } from '../plan';
import { uid } from '../platform';
import { suggestNext, type Suggestion } from '../progression';
import { findRecords, type NewRecord } from '../records';
import * as repo from '../repo';
import { restAfterSet } from '../supersets';
import { extendTimer, startTimer } from '../timers';
import { app, setOverride } from './app.svelte';

export function ladderFor(exerciseId: string): Rung[] {
  return buildLadder(getExercise(exerciseId), app.settings.dumbbellSteps);
}

/** Frühere Einträge einer Übung, neuester zuerst */
export function historyOf(exerciseId: string, workouts: Workout[] = app.workouts): { date: string; log: ExerciseLog }[] {
  const result: { date: string; log: ExerciseLog }[] = [];
  for (let i = workouts.length - 1; i >= 0; i--) {
    for (const log of workouts[i].exercises) if (log.exerciseId === exerciseId) result.push({ date: workouts[i].date, log });
  }
  return result;
}

export function deloadKey(date: string): string {
  return `deload:${weekStart(date)}`;
}

export function isDeloadWeek(date: string = todayKey()): boolean {
  return app.overrides[deloadKey(date)] === true;
}

export function slotsFor(blockId: string, dayId: DayId, mode: WorkoutMode): Slot[] {
  const block = blockById(blockId);
  const base = resolveSlots(block.days[dayId], blockId, app.overrides);
  if (mode === 'kurz') return shortVersion(base);
  if (mode === 'entlastung') return deloadVersion(base);
  return base;
}

function buildLog(slot: Slot, slotIndex: number): { log: ExerciseLog; suggestion: Suggestion } {
  const exercise = getExercise(slot.exerciseId);
  const ladder = ladderFor(exercise.id);
  const suggestion = suggestNext(
    exercise,
    slot,
    ladder,
    historyOf(exercise.id).map((h) => h.log),
    startRung(ladder, START_LOADS[exercise.id]),
  );
  const load = ladder[suggestion.rung].load;
  return {
    log: {
      slotIndex,
      exerciseId: exercise.id,
      target: { min: slot.min, max: slot.max },
      sets: suggestion.targets.map((reps) => ({ load: { ...load }, reps, done: false })),
    },
    suggestion,
  };
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;

export function persistActive(): void {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void repo.saveActiveWorkout(app.active ? ($state.snapshot(app.active) as ActiveWorkout) : null);
  }, 250);
}

export function startWorkout(dayId: DayId, requestedMode: WorkoutMode = 'normal'): void {
  const today = todayKey();
  const block = plannedDay(today, app.settings.startDate).block;
  const mode: WorkoutMode = requestedMode === 'normal' && isDeloadWeek(today) ? 'entlastung' : requestedMode;
  const slots = slotsFor(block.id, dayId, mode);
  const built = slots.map((slot, i) => buildLog(slot, i));
  app.active = {
    id: uid(),
    date: today,
    dayId,
    blockId: block.id,
    startedAt: Date.now(),
    mode,
    exercises: built.map((b) => b.log),
    warmupDone: false,
    restTimer: null,
    slots,
    hints: built.map((b) => ({ kind: b.suggestion.kind, reason: b.suggestion.reason })),
  };
  persistActive();
}

export function toggleSet(exerciseIndex: number, setIndex: number): void {
  const a = app.active;
  if (!a) return;
  const set = a.exercises[exerciseIndex].sets[setIndex];
  set.done = !set.done;
  if (set.done) {
    const rest = restAfterSet(a.slots, exerciseIndex, app.settings.supersets);
    if (rest > 0) a.restTimer = startTimer('rest', 'Pause', rest * 1000);
  }
  persistActive();
}

export function setReps(exerciseIndex: number, setIndex: number, reps: number): void {
  const a = app.active;
  if (!a) return;
  a.exercises[exerciseIndex].sets[setIndex].reps = Math.max(0, reps);
  persistActive();
}

/** Neue Stufe für alle Sätze, die noch nicht abgehakt sind */
export function setRung(exerciseIndex: number, rung: number): void {
  const a = app.active;
  if (!a) return;
  const log = a.exercises[exerciseIndex];
  const load = ladderFor(log.exerciseId)[rung].load;
  for (const s of log.sets) if (!s.done) s.load = { ...load };
  persistActive();
}

export function addSet(exerciseIndex: number): void {
  const a = app.active;
  if (!a) return;
  const sets = a.exercises[exerciseIndex].sets;
  const last = sets[sets.length - 1];
  sets.push({ load: { ...last.load }, reps: last.reps, done: false });
  persistActive();
}

export function swapExercise(exerciseIndex: number, exerciseId: string, remember: boolean): void {
  const a = app.active;
  if (!a) return;
  const slot = { ...a.slots[exerciseIndex], exerciseId };
  a.slots[exerciseIndex] = slot;
  const { log, suggestion } = buildLog(slot, exerciseIndex);
  a.exercises[exerciseIndex] = log;
  a.hints[exerciseIndex] = { kind: suggestion.kind, reason: suggestion.reason };
  if (remember) void setOverride(swapKey(a.blockId, a.dayId, exerciseIndex), exerciseId);
  persistActive();
}

export function extendRest(seconds: number): void {
  const a = app.active;
  if (!a?.restTimer) return;
  a.restTimer = extendTimer(a.restTimer, seconds * 1000);
  persistActive();
}

export function skipRest(): void {
  if (!app.active) return;
  app.active.restTimer = null;
  persistActive();
}

export function markRestAlerted(): void {
  if (!app.active?.restTimer) return;
  app.active.restTimer.alerted = true;
  persistActive();
}

export function setWarmupDone(done: boolean): void {
  if (!app.active) return;
  app.active.warmupDone = done;
  persistActive();
}

export interface FinishResult {
  workout: Workout;
  records: NewRecord[];
}

export async function finishWorkout(feeling: number): Promise<FinishResult | null> {
  if (!app.active) return null;
  const a = $state.snapshot(app.active) as ActiveWorkout;
  const workout: Workout = {
    id: a.id,
    date: a.date,
    dayId: a.dayId,
    blockId: a.blockId,
    startedAt: a.startedAt,
    finishedAt: Date.now(),
    mode: a.mode,
    feeling,
    exercises: a.exercises.filter((e) => e.sets.some((s) => s.done)),
  };
  const records = findRecords(workout, $state.snapshot(app.workouts) as Workout[], (e) => buildLadder(e, app.settings.dumbbellSteps), getExercise);
  await repo.saveWorkout(workout);
  clearTimeout(persistTimer);
  await repo.saveActiveWorkout(null);
  app.workouts = [...app.workouts, workout];
  app.active = null;
  return { workout, records };
}

export async function discardWorkout(): Promise<void> {
  clearTimeout(persistTimer);
  app.active = null;
  await repo.saveActiveWorkout(null);
}

export async function deleteSavedWorkout(id: string): Promise<void> {
  await repo.deleteWorkout(id);
  app.workouts = app.workouts.filter((w) => w.id !== id);
}
