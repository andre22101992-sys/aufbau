// Wochenübersicht der Trainingstage: erledigt, heute, verpasst, kommt noch.

import { DAY_IDS, type DayId } from '../data/types';
import { addDays, weekStart, type DateKey } from './dates';
import type { Workout } from './model';

export type DayState = 'done' | 'today' | 'missed' | 'upcoming' | 'beforeStart' | 'paused';

export interface DayStatus {
  dayId: DayId;
  date: DateKey;
  state: DayState;
  workout?: Workout;
}

export function workoutsInWeek(workouts: Workout[], date: DateKey): Workout[] {
  const start = weekStart(date);
  const end = addDays(start, 6);
  return workouts.filter((w) => w.date >= start && w.date <= end);
}

/** Ein nachgeholtes Training zählt für den geplanten Tag (dayId), egal an welchem Tag es stattfand. */
export function weekOverview(today: DateKey, startDate: DateKey | null, workouts: Workout[], isPaused: (date: DateKey) => boolean = () => false): DayStatus[] {
  const monday = weekStart(today);
  const thisWeek = workoutsInWeek(workouts, today);
  return DAY_IDS.map((dayId, i) => {
    const date = addDays(monday, i);
    const workout = thisWeek.find((w) => w.dayId === dayId);
    let state: DayState;
    if (workout) state = 'done';
    else if (startDate && date < startDate) state = 'beforeStart';
    else if (isPaused(date)) state = 'paused';
    else if (date === today) state = 'today';
    else if (date < today) state = 'missed';
    else state = 'upcoming';
    return { dayId, date, state, workout };
  });
}
