import { describe, expect, it } from 'vitest';
import { addDays } from '../src/lib/dates';
import { lighterVersion } from '../src/lib/plan';
import { readiness } from '../src/lib/readiness';
import { defaultSleep, formatSleep, shiftTime, sleepHours } from '../src/lib/sleep';
import { steeringAdvice } from '../src/lib/steering';
import { forecastDate, tempoPerWeek, trendSeries, weeklyAverages, type WeekAverage } from '../src/lib/trend';
import { DEFAULT_SETTINGS } from '../src/lib/model';

const START = '2026-11-02'; // Montag

/** Tägliche Werte mit festem Zuwachs pro Woche, ab einem Montag */
function daily(days: number, startKg: number, perWeek: number, from = START) {
  return Array.from({ length: days }, (_, i) => ({ date: addDays(from, i), kg: startKg + (perWeek / 7) * i }));
}

/** Wochenschnitte direkt vorgeben */
const weeksOf = (avgs: number[], from = START): WeekAverage[] => avgs.map((avg, i) => ({ week: addDays(from, i * 7), avg, count: 7 }));

describe('Trendgewicht', () => {
  it('startet beim ersten Wert und nimmt jeden neuen Wert zu 10 % auf', () => {
    const s = trendSeries([
      { date: '2026-11-03', kg: 57 },
      { date: '2026-11-02', kg: 56 },
    ]);
    expect(s[0].trend).toBe(56);
    expect(s[1].trend).toBeCloseTo(56.1);
  });

  it('misst das Tempo pro Woche aus den letzten 14 Tagen', () => {
    const s = trendSeries(daily(60, 56, 0.35));
    expect(tempoPerWeek(s)).toBeCloseTo(0.35, 1);
    expect(tempoPerWeek(trendSeries(daily(5, 56, 0.35)))).toBeNull();
  });

  it('sagt das Datum für das Zielgewicht voraus', () => {
    expect(forecastDate(58, 0.5, 60, '2026-11-02')).toBe('2026-11-30');
    expect(forecastDate(58, 0, 60, '2026-11-02')).toBeNull();
    expect(forecastDate(60.2, 0.4, 60, '2026-11-02')).toBeNull();
  });

  it('bildet Wochenschnitte Mo–So nur aus Wochen mit mindestens 3 Werten', () => {
    const entries = [
      { date: '2026-11-02', kg: 56 },
      { date: '2026-11-04', kg: 56.4 },
      { date: '2026-11-08', kg: 56.2 },
      { date: '2026-11-09', kg: 57 },
      { date: '2026-11-10', kg: 57 },
    ];
    const weeks = weeklyAverages(entries);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]).toMatchObject({ week: '2026-11-02', count: 3 });
    expect(weeks[0].avg).toBeCloseTo(56.2);
  });
});

describe('Kalorien-Steuerung', () => {
  const today = addDays(START, 7 * 3 + 1);

  it('schlägt +250 kcal vor, wenn der Schnitt zwei Wochen in Folge unter +0,2 kg steigt', () => {
    const advice = steeringAdvice({ weeks: weeksOf([56, 56.1, 56.2]), startDate: START, lastChange: null, today });
    expect(advice.kind).toBe('more');
    expect(advice.kind === 'more' && advice.kcal).toBe(250);
  });

  it('macht keinen Vorschlag im Zielbereich', () => {
    expect(steeringAdvice({ weeks: weeksOf([56, 56.3, 56.6]), startDate: START, lastChange: null, today }).kind).toBe('none');
  });

  it('schlägt −150 kcal vor, wenn es im Schnitt über 0,5 kg pro Woche sind, aber nicht ab der ersten Woche', () => {
    const fromWeek1 = steeringAdvice({ weeks: weeksOf([56, 56.8, 57.6]), startDate: START, lastChange: null, today });
    expect(fromWeek1.kind).toBe('none');
    const later = steeringAdvice({ weeks: weeksOf([56, 56.3, 57, 57.7]), startDate: START, lastChange: null, today: addDays(START, 29) });
    expect(later.kind).toBe('less');
  });

  it('wartet nach einer Anpassung 2 Wochen und zählt nur abgeschlossene Wochen', () => {
    const weeks = weeksOf([56, 56.1, 56.2]);
    expect(steeringAdvice({ weeks, startDate: START, lastChange: addDays(today, -5), today }).kind).toBe('none');
    expect(steeringAdvice({ weeks, startDate: START, lastChange: null, today: addDays(START, 20) }).kind).toBe('none');
  });
});

describe('Schlaf und Tagesform', () => {
  it('rechnet Schlafstunden über Mitternacht', () => {
    expect(sleepHours('22:00', '05:15')).toBe(7.25);
    expect(sleepHours('00:30', '07:00')).toBe(6.5);
    expect(shiftTime('23:50', 15)).toBe('00:05');
    expect(shiftTime('00:10', -15)).toBe('23:55');
    expect(formatSleep(7.25)).toBe('7 h 15 min');
  });

  it('nimmt Uhrzeiten aus den Einstellungen, am Wochenende die spätere Aufstehzeit', () => {
    expect(defaultSleep(DEFAULT_SETTINGS.times, '2026-11-02')).toEqual({ bed: '22:00', wake: '05:15' });
    expect(defaultSleep(DEFAULT_SETTINGS.times, '2026-11-07').wake).toBe('08:00');
  });

  it('schlägt nach kurzer Nacht ein leichteres Training vor', () => {
    expect(readiness(5, 4).suggest).toBe(true);
    expect(readiness(6, 2).suggest).toBe(true);
    expect(readiness(6, 3).suggest).toBe(false);
    expect(readiness(7.5, 1).suggest).toBe(false);
    expect(readiness(null, 1).suggest).toBe(false);
  });

  it('streicht im leichten Training einen Satz pro Übung, aber nie den letzten', () => {
    const slots = lighterVersion([
      { exerciseId: 'a', sets: 3, min: 8, max: 12, restSec: 60 },
      { exerciseId: 'b', sets: 1, min: 8, max: 12, restSec: 60 },
    ]);
    expect(slots.map((s) => s.sets)).toEqual([2, 1]);
  });
});

describe('Steuerung prüft, was du wirklich gegessen hast', () => {
  const today = addDays(START, 7 * 3 + 1);
  const weeks = weeksOf([56, 56.1, 56.2]);
  const input = { weeks, startDate: START, lastChange: null, today, kcalTarget: 2800 };

  it('verlangt nicht mehr, wenn der Plan nicht gegessen wird, sondern sagt: erst den Plan schaffen', () => {
    const advice = steeringAdvice({ ...input, intake: { days: 10, goodDays: 3, avgKcal: 2100, avgProtein: 80 } });
    expect(advice.kind).toBe('plan');
    expect(advice.kind === 'plan' && advice.reason).toContain('2.100');
  });

  it('schlägt weiter +250 kcal vor, wenn der Plan gegessen wird', () => {
    expect(steeringAdvice({ ...input, intake: { days: 12, goodDays: 10, avgKcal: 2750, avgProtein: 125 } }).kind).toBe('more');
  });

  it('weist auf fehlende Einträge hin, statt etwas zu behaupten', () => {
    const advice = steeringAdvice({ ...input, intake: { days: 3, goodDays: 1, avgKcal: 1500, avgProtein: 60 } });
    expect(advice.kind).toBe('more');
    expect(advice.kind === 'more' && advice.reason).toContain('wenig eingetragen');
    expect(steeringAdvice(input).kind).toBe('more');
  });
});
