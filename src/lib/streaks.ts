// Serien mit Joker: Pro Woche darf ein Training bzw. ein Wiege-Tag fehlen, ohne dass die Serie reißt.
// Ruhetage (Sa/So) zählen nie dagegen, pausierte Tage auch nicht.

import { addDays, weekStart, type DateKey } from './dates';

export interface TrainingStreak {
  /** Trainings in Folge */
  count: number;
  /** In der laufenden Woche schon ein Training verpasst (Joker verbraucht) */
  jokerUsed: boolean;
}

export function trainingStreak(
  workoutDates: DateKey[],
  startDate: DateKey | null,
  today: DateKey,
  isPaused: (date: DateKey) => boolean = () => false,
): TrainingStreak {
  if (!startDate || workoutDates.length === 0) return { count: 0, jokerUsed: false };
  const done = new Map<DateKey, number>();
  for (const d of workoutDates) done.set(d, (done.get(d) ?? 0) + 1);

  let count = 0;
  let jokerUsed = false;
  const firstWeek = weekStart(startDate);
  for (let week = weekStart(today); week >= firstWeek; week = addDays(week, -7)) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
    const completed = days.reduce((n, d) => n + (done.get(d) ?? 0), 0);
    // Geplante Tage, die schon vorbei sind (heute zählt erst, wenn trainiert wurde)
    const planned = days.slice(0, 5).filter((d) => d >= startDate && (d < today || (d === today && done.has(d))) && !isPaused(d));
    const missedDays = planned.filter((d) => !done.has(d));
    const missed = Math.max(0, planned.length - completed);

    if (week === weekStart(today)) jokerUsed = missed >= 1;
    if (missed <= 1) {
      count += completed;
      continue;
    }
    // Serie reißt in dieser Woche: nur Trainings nach dem letzten verpassten Tag zählen
    const lastMissed = missedDays[missedDays.length - 1] ?? week;
    count += days.filter((d) => d > lastMissed).reduce((n, d) => n + (done.get(d) ?? 0), 0);
    break;
  }
  return { count, jokerUsed };
}

/** Tage in Folge mit Eintrag (z. B. Wiegen); heute ohne Eintrag ist noch nicht verpasst. */
export function dailyStreak(dates: Iterable<DateKey>, today: DateKey, isPaused: (date: DateKey) => boolean = () => false): number {
  const set = new Set(dates);
  if (set.size === 0) return 0;
  const earliest = [...set].sort()[0];
  const jokerWeeks = new Set<DateKey>();
  let count = 0;
  let day = set.has(today) ? today : addDays(today, -1);
  while (day >= earliest) {
    if (set.has(day)) count++;
    else if (!isPaused(day)) {
      const week = weekStart(day);
      if (jokerWeeks.has(week)) break;
      jokerWeeks.add(week);
    }
    day = addDays(day, -1);
  }
  return count;
}
