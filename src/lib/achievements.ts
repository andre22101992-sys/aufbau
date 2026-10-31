// Erfolge: Meilensteine fürs Essen, fürs Training und für den Körper. Regelmäßig essen steht vorn.
// Sie werden aus deinen Daten berechnet und nur einmal gefeiert.

import { addDays, diffDays, weekStart, type DateKey } from './dates';
import type { WeightEntry, Workout } from './model';
import type { DayMeals } from './repo';
import { GOOD_DAY_MEALS, mealCount } from './rhythm';
import { trendSeries } from './trend';

export interface AchievementDef {
  id: string;
  title: string;
  /** So wird er freigeschaltet */
  detail: string;
  group: 'essen' | 'training' | 'koerper';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'essen-tag', group: 'essen', title: 'Guter Essens-Tag', detail: `Einen Tag lang mindestens ${GOOD_DAY_MEALS} Mahlzeiten abhaken.` },
  { id: 'essen-3-folge', group: 'essen', title: 'Drei Tage in Folge', detail: `Drei Tage hintereinander mindestens ${GOOD_DAY_MEALS} Mahlzeiten.` },
  { id: 'essen-woche', group: 'essen', title: 'Starke Essens-Woche', detail: `In einer Woche an 5 Tagen mindestens ${GOOD_DAY_MEALS} Mahlzeiten.` },
  { id: 'essen-leicht', group: 'essen', title: 'Gut auf dich geachtet', detail: 'Einen leichten Tag genutzt, statt gar nichts zu essen.' },
  { id: 'essen-bon', group: 'essen', title: 'Erster Bon', detail: 'Deinen ersten Kassenbon übernehmen.' },
  { id: 'training-1', group: 'training', title: 'Erstes Training', detail: 'Dein erstes Training beenden.' },
  { id: 'training-woche', group: 'training', title: 'Volle Woche', detail: 'In einer Woche alle 5 Trainings schaffen.' },
  { id: 'training-10', group: 'training', title: '10 Trainings', detail: '10 Trainings beenden.' },
  { id: 'training-25', group: 'training', title: '25 Trainings', detail: '25 Trainings beenden.' },
  { id: 'training-50', group: 'training', title: '50 Trainings', detail: '50 Trainings beenden.' },
  { id: 'liegestuetze-boden', group: 'training', title: 'Liegestütze vom Boden', detail: 'Liegestütze auf dem Boden statt auf dem Stuhl schaffen.' },
  { id: 'rudern-11', group: 'training', title: '11,3 kg Rudern', detail: 'Einarmiges Rudern mit der schwersten Stufe.' },
  { id: 'gewicht-1', group: 'koerper', title: '+1 kg', detail: 'Dein Trendgewicht liegt 1 kg über dem Start.' },
  { id: 'gewicht-2', group: 'koerper', title: '+2 kg', detail: 'Dein Trendgewicht liegt 2 kg über dem Start.' },
  { id: 'gewicht-4', group: 'koerper', title: '+4 kg', detail: 'Dein Trendgewicht liegt 4 kg über dem Start.' },
  { id: 'checkin-1', group: 'koerper', title: 'Erster Check-in', detail: 'Maße oder Fotos zum ersten Mal festhalten.' },
  { id: 'waage-1', group: 'koerper', title: 'Waagenwerte', detail: 'Die Werte deiner Körperwaage zum ersten Mal eintragen.' },
  { id: 'zwoelf-wochen', group: 'training', title: '12 Wochen geschafft', detail: 'Zwölf Wochen nach dem Start mindestens 30 Trainings.' },
];

export interface AchievementContext {
  today: DateKey;
  startDate: DateKey | null;
  workouts: Workout[];
  weights: WeightEntry[];
  mealDays: Pick<DayMeals, 'date' | 'done' | 'extras'>[];
  receipts: number;
  checkins: number;
  scale: number;
  lightDays: number;
}

const goodDays = (days: AchievementContext['mealDays']) => days.filter((d) => mealCount(d) >= GOOD_DAY_MEALS).map((d) => d.date).sort();

function longestRun(dates: DateKey[]): number {
  let best = 0;
  let run = 0;
  let previous: DateKey | null = null;
  for (const date of dates) {
    run = previous && diffDays(date, previous) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

export function unlockedAchievements(ctx: AchievementContext): Set<string> {
  const done = new Set<string>();
  const good = goodDays(ctx.mealDays);
  if (good.length >= 1) done.add('essen-tag');
  if (longestRun(good) >= 3) done.add('essen-3-folge');
  const perWeek = new Map<DateKey, number>();
  for (const date of good) perWeek.set(weekStart(date), (perWeek.get(weekStart(date)) ?? 0) + 1);
  if ([...perWeek.values()].some((n) => n >= 5)) done.add('essen-woche');
  if (ctx.lightDays >= 1) done.add('essen-leicht');
  if (ctx.receipts >= 1) done.add('essen-bon');

  const count = ctx.workouts.length;
  if (count >= 1) done.add('training-1');
  if (count >= 10) done.add('training-10');
  if (count >= 25) done.add('training-25');
  if (count >= 50) done.add('training-50');
  const days = new Map<DateKey, Set<string>>();
  for (const w of ctx.workouts) days.set(weekStart(w.date), (days.get(weekStart(w.date)) ?? new Set()).add(w.dayId));
  if ([...days.values()].some((s) => s.size >= 5)) done.add('training-woche');
  const sets = ctx.workouts.flatMap((w) => w.exercises.flatMap((e) => e.sets.filter((s) => s.done).map((s) => ({ id: e.exerciseId, load: s.load }))));
  if (sets.some((s) => s.id === 'liegestuetze' && s.load.kind === 'level' && s.load.level >= 1)) done.add('liegestuetze-boden');
  if (sets.some((s) => s.id === 'rudern' && s.load.kind === 'kg' && s.load.kg >= 11.25)) done.add('rudern-11');
  if (ctx.startDate && diffDays(ctx.today, ctx.startDate) >= 84 && count >= 30) done.add('zwoelf-wochen');

  if (ctx.weights.length >= 2) {
    const sorted = [...ctx.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
    const gain = (trendSeries(sorted).at(-1)?.trend ?? sorted[0].kg) - sorted[0].kg;
    if (gain >= 1) done.add('gewicht-1');
    if (gain >= 2) done.add('gewicht-2');
    if (gain >= 4) done.add('gewicht-4');
  }
  if (ctx.checkins >= 1) done.add('checkin-1');
  if (ctx.scale >= 1) done.add('waage-1');
  return done;
}

/** Wochenringe: wie weit die laufende Woche ist */
export interface WeekRings {
  trainings: number;
  proteinDays: number;
  sleepNights: number;
}

export function weekDates(today: DateKey): DateKey[] {
  const monday = weekStart(today);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => d <= today);
}
