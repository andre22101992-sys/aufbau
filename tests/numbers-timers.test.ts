import { describe, expect, it } from 'vitest';
import { formatKg, parseDecimal } from '../src/lib/numbers';
import { extendTimer, isFinished, remainingMs, startTimer } from '../src/lib/timers';

describe('Zahlen', () => {
  it('liest Dezimalkomma und Punkt', () => {
    expect(parseDecimal('72,4')).toBe(72.4);
    expect(parseDecimal(' 57.1 ')).toBe(57.1);
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('')).toBeNull();
  });

  it('schreibt Kilogramm mit Komma', () => {
    expect(formatKg(6.8)).toBe('6,8 kg');
    expect(formatKg(11.3)).toBe('11,3 kg');
  });
});

describe('Timer', () => {
  it('stimmt auch, nachdem die App pausiert war', () => {
    const t0 = 1_000_000;
    const timer = startTimer('pause', 'Pause', 90_000, t0);
    expect(remainingMs(timer, t0 + 30_000)).toBe(60_000);
    // iOS hat die App 2 Minuten angehalten: Die Restzeit ergibt sich aus der Uhrzeit.
    expect(remainingMs(timer, t0 + 120_000)).toBe(0);
    expect(isFinished(timer, t0 + 120_000)).toBe(true);
  });

  it('verlängert ab jetzt, wenn der Timer schon abgelaufen ist', () => {
    const t0 = 0;
    const timer = startTimer('pause', 'Pause', 60_000, t0);
    const longer = extendTimer(timer, 15_000, 70_000);
    expect(remainingMs(longer, 70_000)).toBe(15_000);
    expect(longer.alerted).toBe(false);
  });
});
