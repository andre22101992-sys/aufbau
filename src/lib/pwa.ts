// Service Worker: Die App wird komplett gespeichert und läuft offline.
// Gibt es eine neue Version, erscheint ein Hinweis; neu geladen wird erst auf Wunsch.

import { registerSW } from 'virtual:pwa-register';
import { app } from './state/app.svelte';

let update: ((reload?: boolean) => Promise<void>) | null = null;

export function setupPwa(): void {
  update = registerSW({
    onNeedRefresh() {
      app.needRefresh = true;
    },
  });
}

export async function applyUpdate(): Promise<void> {
  if (update) await update(true);
  else location.reload();
}
