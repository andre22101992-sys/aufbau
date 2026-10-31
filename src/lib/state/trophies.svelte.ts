// Erfolge prüfen und feiern. Wird nach dem Abhaken, nach dem Training und beim Öffnen von „Heute“ aufgerufen.

import { ACHIEVEMENTS, unlockedAchievements } from '../achievements';
import { todayKey } from '../dates';
import * as repo from '../repo';
import { app, showToast } from './app.svelte';

let timer: ReturnType<typeof setTimeout> | undefined;

async function run(): Promise<void> {
  const [mealDays, receipts] = await Promise.all([repo.listAllMealDays(), repo.listReceipts()]);
  const unlocked = unlockedAchievements({
    today: todayKey(),
    startDate: app.settings.startDate,
    workouts: app.workouts,
    weights: app.weights,
    mealDays,
    receipts: receipts.length,
    checkins: app.checkins.length,
    scale: app.scale.length,
    lightDays: Object.keys(app.overrides).filter((k) => k.startsWith('light:')).length,
  });
  const fresh = [...unlocked].filter((id) => !(id in app.achievements));
  if (!fresh.length) return;
  const today = todayKey();
  for (const id of fresh) {
    await repo.saveAchievement(id, today);
    app.achievements[id] = today;
  }
  // Wurden beim ersten Mal viele auf einmal freigeschaltet, gibt es keine Flut an Meldungen
  if (fresh.length <= 2) {
    for (const id of fresh) showToast(`Erfolg: ${ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id}`);
  } else {
    showToast(`${fresh.length} neue Erfolge`);
  }
}

/** Kurz verzögert, damit mehrere Änderungen hintereinander nur eine Prüfung auslösen */
export function checkAchievements(): void {
  clearTimeout(timer);
  timer = setTimeout(() => void run(), 600);
}
