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

export async function keepScreenOn(on: boolean): Promise<void> {
  wanted = on;
  if (on) {
    await acquire();
  } else if (sentinel) {
    await sentinel.release().catch(() => undefined);
    sentinel = null;
  }
}

// iOS gibt die Sperre beim Wechsel in den Hintergrund frei; beim Zurückkommen neu anfordern.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') void acquire();
  });
}
