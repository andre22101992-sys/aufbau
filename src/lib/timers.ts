// Timer rechnen mit Uhrzeiten statt mit Zählern.
// iOS pausiert Web-Apps im Hintergrund; beim Zurückkommen stimmt die Restzeit trotzdem.

export interface Timer {
  id: string;
  label: string;
  startedAt: number;
  durationMs: number;
  endsAt: number;
  /** Ton wurde für diesen Ablauf schon gespielt */
  alerted: boolean;
}

export function startTimer(id: string, label: string, durationMs: number, now = Date.now()): Timer {
  return { id, label, startedAt: now, durationMs, endsAt: now + durationMs, alerted: false };
}

export function remainingMs(t: Timer, now = Date.now()): number {
  return Math.max(0, t.endsAt - now);
}

export function isFinished(t: Timer, now = Date.now()): boolean {
  return now >= t.endsAt;
}

/** Anteil der abgelaufenen Zeit, 0 bis 1 */
export function elapsedFraction(t: Timer, now = Date.now()): number {
  if (t.durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, (now - t.startedAt) / t.durationMs));
}

export function extendTimer(t: Timer, ms: number, now = Date.now()): Timer {
  const base = Math.max(t.endsAt, now);
  return { ...t, durationMs: t.durationMs + ms, endsAt: base + ms, alerted: false };
}
