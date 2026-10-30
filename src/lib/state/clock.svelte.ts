// Gemeinsame Uhr für Timer und Trainingsdauer. Läuft nur, solange jemand sie braucht.

export const clock = $state({ now: Date.now() });

let interval: ReturnType<typeof setInterval> | undefined;
let users = 0;

export function useClock(): () => void {
  users++;
  if (!interval) {
    clock.now = Date.now();
    interval = setInterval(() => {
      clock.now = Date.now();
    }, 250);
  }
  return () => {
    users = Math.max(0, users - 1);
    if (users === 0 && interval) {
      clearInterval(interval);
      interval = undefined;
    }
  };
}

if (typeof document !== 'undefined') {
  // Nach der Rückkehr aus dem Hintergrund sofort die richtige Zeit anzeigen
  document.addEventListener('visibilitychange', () => {
    clock.now = Date.now();
  });
}
