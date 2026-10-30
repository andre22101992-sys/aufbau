// Erinnerungen als Kalendertermine, abgeleitet aus den Uhrzeiten in den Einstellungen.

import { DAY_TITLES } from '../data/blocks';
import type { DayId } from '../data/types';
import { addDays, nextWeekday, type DateKey } from './dates';
import type { IcsEvent } from './ics';
import type { Settings } from './model';

export type ReminderId = 'training' | 'kochen' | 'wiegen' | 'oats' | 'schlafen' | 'einkauf' | 'checkin';

export const REMINDERS: { id: ReminderId; label: string; detail: (s: Settings) => string }[] = [
  { id: 'training', label: 'Training', detail: (s) => `Mo–Do ${s.times.trainingMoDo}, Fr ${s.times.trainingFr}, 15 Min vorher` },
  { id: 'kochen', label: 'Kochen', detail: (s) => `Mo–Do ${s.times.cookMoDo}, Fr ${s.times.cookFr}` },
  { id: 'wiegen', label: 'Wiegen', detail: (s) => `Mo–Fr ${s.times.wakeWeekday}, Sa/So ${s.times.wakeWeekend}` },
  { id: 'oats', label: 'Oats für morgen ansetzen', detail: (s) => `So–Do ${s.times.oats}` },
  { id: 'schlafen', label: 'Schlafen gehen', detail: (s) => `täglich ${s.times.sleep}` },
  { id: 'einkauf', label: 'Einkauf und Samstags-Assistent', detail: (s) => `Sa ${s.times.shopping}` },
  { id: 'checkin', label: 'Check-in und Backup', detail: () => 'alle 4 Wochen, Sa 09:00' },
];

const ICS_DAY: Record<DayId, string> = { mo: 'MO', di: 'TU', mi: 'WE', do: 'TH', fr: 'FR' };
const WEEKDAY_INDEX: Record<DayId, number> = { mo: 0, di: 1, mi: 2, do: 3, fr: 4 };

export function reminderEvents(settings: Settings, selected: ReminderId[], today: DateKey): IcsEvent[] {
  const t = settings.times;
  // Ab dem Samstag vor dem Start (Einkauf), frühestens ab heute
  const from = settings.startDate && addDays(settings.startDate, -2) > today ? addDays(settings.startDate, -2) : today;
  const first = (weekdayIndex: number) => nextWeekday(from, weekdayIndex);
  const events: IcsEvent[] = [];
  const uid = (name: string) => `aufbau-${name}@aufbau.app`;

  if (selected.includes('training')) {
    for (const day of ['mo', 'di', 'mi', 'do', 'fr'] as DayId[]) {
      events.push({
        uid: uid(`training-${day}`),
        summary: `Training: ${DAY_TITLES[day]}`,
        description: 'Öffne Aufbau und starte das Training.',
        firstDate: first(WEEKDAY_INDEX[day]),
        time: day === 'fr' ? t.trainingFr : t.trainingMoDo,
        durationMin: 60,
        rrule: `FREQ=WEEKLY;BYDAY=${ICS_DAY[day]}`,
        alarmMinutesBefore: 15,
      });
    }
  }
  if (selected.includes('kochen')) {
    events.push(
      { uid: uid('kochen-mo-do'), summary: 'Kochen, doppelte Menge fürs Büro', firstDate: first(0), time: t.cookMoDo, durationMin: 30, rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH', alarmMinutesBefore: 0 },
      { uid: uid('kochen-fr'), summary: 'Kochen, doppelte Menge', firstDate: first(4), time: t.cookFr, durationMin: 30, rrule: 'FREQ=WEEKLY;BYDAY=FR', alarmMinutesBefore: 0 },
    );
  }
  if (selected.includes('wiegen')) {
    events.push(
      { uid: uid('wiegen-wochentags'), summary: 'Wiegen und Schlaf eintragen', firstDate: first(0), time: t.wakeWeekday, durationMin: 5, rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', alarmMinutesBefore: 0 },
      { uid: uid('wiegen-wochenende'), summary: 'Wiegen und Schlaf eintragen', firstDate: first(5), time: t.wakeWeekend, durationMin: 5, rrule: 'FREQ=WEEKLY;BYDAY=SA,SU', alarmMinutesBefore: 0 },
    );
  }
  if (selected.includes('oats')) {
    events.push({ uid: uid('oats'), summary: 'Overnight Oats für morgen ansetzen', firstDate: first(6), time: t.oats, durationMin: 5, rrule: 'FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH', alarmMinutesBefore: 0 });
  }
  if (selected.includes('schlafen')) {
    events.push({ uid: uid('schlafen'), summary: 'Schlafen gehen', description: 'Muskeln wachsen vor allem im Schlaf.', firstDate: from, time: t.sleep, durationMin: 5, rrule: 'FREQ=DAILY', alarmMinutesBefore: 0 });
  }
  if (selected.includes('einkauf')) {
    events.push({ uid: uid('einkauf'), summary: 'Einkauf und Samstags-Assistent', firstDate: first(5), time: t.shopping, durationMin: 60, rrule: 'FREQ=WEEKLY;BYDAY=SA', alarmMinutesBefore: 0 });
  }
  if (selected.includes('checkin')) {
    // Samstag am Ende der vierten Trainingswoche, danach alle 4 Wochen
    const firstCheckin = settings.startDate ? addDays(settings.startDate, 26) : first(5);
    events.push({ uid: uid('checkin'), summary: 'Check-in: Maße, Fotos und Backup', firstDate: firstCheckin < today ? first(5) : firstCheckin, time: '09:00', durationMin: 15, rrule: 'FREQ=WEEKLY;INTERVAL=4;BYDAY=SA', alarmMinutesBefore: 0 });
  }
  return events;
}
