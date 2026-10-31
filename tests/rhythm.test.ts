import { describe, expect, it } from 'vitest';
import { lightKey, mealsOf } from '../src/data/mealplan';
import { dayPlanNutrients } from '../src/lib/nutrition';
import { buildIcs } from '../src/lib/ics';
import { DEFAULT_SETTINGS } from '../src/lib/model';
import { reminderEvents } from '../src/lib/reminders';
import { dots, eveningRescue, gapNotice, inTime, mealCount, weekRhythm } from '../src/lib/rhythm';

const MONDAY = '2026-11-02';
const at = (h: number, m = 0) => new Date(2026, 10, 2, h, m);

describe('Leichter Tag', () => {
  const light = (start: string) => ({ overrides: { [lightKey(MONDAY)]: start } });

  it('besteht aus Shakes und Milch und liegt bei etwa 2.100 kcal und 85 g Protein', () => {
    const meals = mealsOf(MONDAY, light('8:00'));
    expect(meals.map((m) => m.id)).toEqual(['l1', 'l2', 'l3', 'l4', 'l5']);
    const n = dayPlanNutrients(MONDAY, light('8:00'));
    expect(n.kcal).toBeGreaterThan(2000);
    expect(n.kcal).toBeLessThan(2200);
    expect(n.protein).toBeGreaterThan(80);
  });

  it('behält ab der Startzeit nur noch die anstehenden Mahlzeiten, am späten Abend eine', () => {
    expect(mealsOf(MONDAY, light('15:00')).map((m) => m.id)).toEqual(['l4', 'l5']);
    const late = mealsOf(MONDAY, light('21:30'));
    expect(late.map((m) => m.id)).toEqual(['l5']);
    expect(late[0].kind === 'fixed' && late[0].time[0]).toBe('21:30');
  });

  it('gilt nur für diesen Tag', () => {
    expect(mealsOf('2026-11-03', light('8:00')).some((m) => m.id === 'l1')).toBe(false);
  });
});

describe('Rhythmus', () => {
  const plan = mealsOf(MONDAY);

  it('zählt Mahlzeiten und Extras und stuft die Woche ein', () => {
    const day = { done: { frueh: 1, oats: 1 }, extras: [{ id: 'x', label: 'Müsli', kcal: 370, protein: 15 }] };
    expect(mealCount(day)).toBe(3);
    expect(mealCount(undefined)).toBe(0);
    const levels = weekRhythm(['a', 'b', 'c'], { a: { done: {}, extras: [] }, b: day, c: { done: { 1: 1, 2: 1, 3: 1, 4: 1 }, extras: [] } }).map((d) => d.level);
    expect(levels).toEqual(['none', 'some', 'good']);
  });

  it('zeigt erledigte, nächste und offene Mahlzeiten und zählt Ersetztes als erledigt', () => {
    const states = dots(plan, { oats: 1 }, [{ id: 'x', label: 'Müsli', kcal: 370, protein: 15, replaces: 'frueh' }]).map((d) => d.state);
    expect(states).toEqual(['done', 'done', 'next', 'open', 'open', 'open']);
  });

  it('formuliert Zeiten freundlich', () => {
    expect(inTime(25)).toBe('in 25 Minuten');
    expect(inTime(60)).toBe('in 1 Stunde');
    expect(inTime(130)).toBe('in 2 Stunden');
    expect(inTime(-5)).toBe('jetzt');
  });
});

describe('Hinweis nach langer Pause', () => {
  const plan = mealsOf(MONDAY);
  const day = (doneAt: Record<string, number>) => ({ date: MONDAY, done: Object.fromEntries(Object.keys(doneAt).map((k) => [k, 1])), doneAt, extras: [] });

  it('meldet sich, wenn zwei Stunden nach der ersten Mahlzeit noch nichts abgehakt ist', () => {
    expect(gapNotice(at(6, 30), plan, day({}))).toBeNull();
    expect(gapNotice(at(7, 10), plan, day({}))).toEqual({ kind: 'none-yet' });
  });

  it('schweigt bei Einträgen ohne Zeitpunkt, etwa aus einer älteren App-Version', () => {
    const old = { date: MONDAY, done: {}, extras: [{ id: 'x', label: 'Müsli', kcal: 370, protein: 15 }] };
    expect(gapNotice(at(14, 0), plan, old)).toBeNull();
  });

  it('meldet sich nach vier Stunden ohne Mahlzeit, aber nicht davor, nachts oder wenn alles gegessen ist', () => {
    const eaten = day({ frueh: at(5, 40).getTime() });
    expect(gapNotice(at(8, 0), plan, eaten)).toBeNull();
    expect(gapNotice(at(10, 0), plan, eaten)).toEqual({ kind: 'gap', hours: 4 });
    expect(gapNotice(at(22, 0), plan, eaten)).toBeNull();
    const all = { date: MONDAY, done: Object.fromEntries(plan.map((m) => [m.id, 1])), doneAt: {}, extras: [] };
    expect(gapNotice(at(14, 0), plan, all)).toBeNull();
  });
});

describe('Abend-Retter', () => {
  const target = { kcal: 2800, protein: 120 };

  it('schlägt Milch vor, wenn nach dem Geplanten noch viel fehlt', () => {
    const rescue = eveningRescue(at(21, 0), { kcal: 1500, protein: 60 }, { kcal: 400, protein: 20 }, target);
    expect(rescue).not.toBeNull();
    expect(rescue!.ml).toBeGreaterThanOrEqual(500);
    expect(rescue!.protein).toBeGreaterThan(15);
  });

  it('bleibt still, wenn es passt oder noch zu früh ist', () => {
    expect(eveningRescue(at(21, 0), { kcal: 2500, protein: 110 }, { kcal: 160, protein: 8 }, target)).toBeNull();
    expect(eveningRescue(at(15, 0), { kcal: 500, protein: 20 }, { kcal: 400, protein: 20 }, target)).toBeNull();
  });
});

describe('Erinnerungen an Mahlzeiten', () => {
  it('erzeugt Kalendertermine zu allen Mahlzeiten mit gültigen Uhrzeiten und Alarm', () => {
    const events = reminderEvents({ ...DEFAULT_SETTINGS, startDate: MONDAY }, ['essen'], '2026-10-31');
    expect(events.length).toBeGreaterThanOrEqual(10);
    expect(events.every((e) => e.summary.startsWith('Essen: ') && /^\d\d:\d\d$/.test(e.time) && e.alarmMinutesBefore === 0)).toBe(true);
    expect(events.find((e) => e.uid.includes('frueh-woche'))?.time).toBe('05:30');
    const ics = buildIcs(events, new Date('2026-10-31T10:00:00Z'));
    expect(ics).toContain('T053000');
    expect(ics).not.toMatch(/T\d{5}\r?\n/);
  });
});
