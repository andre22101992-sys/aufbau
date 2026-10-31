// Pause starten und beenden. Nach einer längeren Pause gibt es für diese Woche weniger Sätze.

import { todayKey } from '../dates';
import { endPause as endPauseOn, startPause as startPauseOn, type PauseReason } from '../pause';
import { app, saveSettingsNow, setOverride, showToast } from './app.svelte';
import { deloadKey } from './workout.svelte';

export async function startPause(reason: PauseReason): Promise<void> {
  app.settings.pauses = startPauseOn($state.snapshot(app.settings.pauses), reason, todayKey());
  await saveSettingsNow();
  showToast('Pause eingelegt. Gute Besserung und erhol dich.');
}

export async function endPause(): Promise<void> {
  const today = todayKey();
  const result = endPauseOn($state.snapshot(app.settings.pauses), today);
  app.settings.pauses = result.pauses;
  await saveSettingsNow();
  if (result.comeback) {
    await setOverride(deloadKey(today), true);
    showToast('Willkommen zurück. Diese Woche gibt es 40 % weniger Sätze zum Einsteigen.');
  } else {
    showToast('Willkommen zurück.');
  }
}
