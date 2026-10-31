// Was du wirklich gegessen hast: Schnitt pro Tag über mehrere Tage, nur aus Tagen mit Einträgen.
// Die Kalorien-Steuerung braucht das, weil mehr Kalorien im Plan nichts bringen, wenn der Plan nicht gegessen wird.

import { mealsOf, type PlanOptions } from '../data/mealplan';
import type { DateKey } from './dates';
import { eatenTotals } from './dayfood';
import type { DayMeals } from './repo';
import { GOOD_DAY_MEALS, mealCount } from './rhythm';

export interface IntakeSummary {
  /** Tage mit mindestens einem Eintrag */
  days: number;
  /** Tage mit mindestens 4 Mahlzeiten */
  goodDays: number;
  avgKcal: number | null;
  avgProtein: number | null;
}

export function intakeSummary(dates: DateKey[], days: Record<DateKey, DayMeals | undefined>, options: PlanOptions = {}): IntakeSummary {
  let kcal = 0;
  let protein = 0;
  let logged = 0;
  let good = 0;
  for (const date of dates) {
    const day = days[date];
    if (!day || mealCount(day) === 0) continue;
    const eaten = eatenTotals(mealsOf(date, options), day.done, day.extras);
    kcal += eaten.kcal;
    protein += eaten.protein;
    logged += 1;
    if (mealCount(day) >= GOOD_DAY_MEALS) good += 1;
  }
  return { days: logged, goodDays: good, avgKcal: logged ? kcal / logged : null, avgProtein: logged ? protein / logged : null };
}
