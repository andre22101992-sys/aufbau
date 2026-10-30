// Hält den Bildschirm im Training und im Kochmodus an.

let sentinel: WakeLockSentinel | null = null;
let wanted = false;

async function acquire(): Promise<void> {
  if (!('wakeLock' in navigator) || sentinel) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch {
    sentinel = null;
  }
}

/** Gibt true zurück, wenn der Bildschirm jetzt an bleibt. */
export async function keepScreenOn(on: boolean): Promise<boolean> {
  wanted = on;
  if (on) {
    await acquire();
    return sentinel !== null;
  }
  if (sentinel) {
    await sentinel.release().catch(() => undefined);
    sentinel = null;
  }
  return false;
}

// iOS gibt die Sperre beim Wechsel in den Hintergrund frei; beim Zurückkommen neu anfordern.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') void acquire();
  });
}
