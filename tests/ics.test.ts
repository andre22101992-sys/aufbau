import { describe, expect, it } from 'vitest';
import { buildIcs, escapeText, foldLine } from '../src/lib/ics';
import { DEFAULT_SETTINGS } from '../src/lib/model';
import { REMINDERS, reminderEvents } from '../src/lib/reminders';

const settings = { ...structuredClone(DEFAULT_SETTINGS), startDate: '2026-11-02' };
const all = REMINDERS.map((r) => r.id);

describe('Kalenderdatei', () => {
  it('enthält Zeitzone, Wiederholungen und Erinnerungen', () => {
    const ics = buildIcs(reminderEvents(settings, all, '2026-10-30'), new Date('2026-10-30T18:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('TZID:Europe/Berlin');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20261102T191500');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20261106T171500');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(12 + 5 + 2 + 2 + 1 + 1 + 1 + 1);
  });

  it('setzt den ersten Einkauf auf den Samstag vor dem Start', () => {
    const ics = buildIcs(reminderEvents(settings, ['einkauf', 'checkin'], '2026-10-30'));
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20261031T100000');
    expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20261128T090000');
  });

  it('bricht lange Zeilen nach 75 Byte um und maskiert Sonderzeichen', () => {
    const ics = buildIcs(reminderEvents(settings, all, '2026-10-30'));
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(escapeText('Brust, Schulter; Trizeps')).toBe('Brust\\, Schulter\\; Trizeps');
    expect(foldLine('x'.repeat(160)).split('\r\n ').join('')).toBe('x'.repeat(160));
  });
});
