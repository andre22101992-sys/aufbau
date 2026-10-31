<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import Stepper from '../components/Stepper.svelte';
  import { BackupError, backupFileName, createBackup, parseBackup, restoreBackup, type BackupFile } from '../lib/backup';
  import { formatDate, todayKey, weekStart } from '../lib/dates';
  import { getDB } from '../lib/db';
  import { buildIcs } from '../lib/ics';
  import type { Settings, Theme, Times } from '../lib/model';
  import { formatDecimal, parseDecimal } from '../lib/numbers';
  import { requestPersistentStorage, shareOrDownload } from '../lib/platform';
  import { REMINDERS, reminderEvents, type ReminderId } from '../lib/reminders';
  import { clearAllData } from '../lib/repo';
  import { app, loadApp, saveSettings, showToast } from '../lib/state/app.svelte';
  import { setKcalTarget } from '../lib/state/body.svelte';
  import { goBack } from '../lib/state/router.svelte';
  import { APP_VERSION } from '../lib/version';

  const themes: { id: Theme; label: string }[] = [
    { id: 'dark', label: 'Dunkel' },
    { id: 'light', label: 'Hell' },
    { id: 'auto', label: 'Wie das iPhone' },
  ];

  const timeFields: { key: keyof Times; label: string }[] = [
    { key: 'trainingMoDo', label: 'Training Mo–Do' },
    { key: 'trainingFr', label: 'Training Fr' },
    { key: 'cookMoDo', label: 'Kochen Mo–Do' },
    { key: 'cookFr', label: 'Kochen Fr' },
    { key: 'wakeWeekday', label: 'Wiegen Mo–Fr' },
    { key: 'wakeWeekend', label: 'Wiegen Sa/So' },
    { key: 'oats', label: 'Oats ansetzen' },
    { key: 'sleep', label: 'Schlafen gehen' },
    { key: 'shopping', label: 'Einkauf Sa' },
  ];

  const mealRows: { label: string; read: () => string; write: (v: string) => void }[] = [
    { label: 'Frühstück Mo–Fr', read: () => app.settings.mealTimes.frueh[0], write: (v) => (app.settings.mealTimes.frueh[0] = v) },
    { label: 'Frühstück Sa/So', read: () => app.settings.mealTimes.frueh[1], write: (v) => (app.settings.mealTimes.frueh[1] = v) },
    { label: 'Oats Mo–Fr', read: () => app.settings.mealTimes.oats[0], write: (v) => (app.settings.mealTimes.oats[0] = v) },
    { label: 'Haferbrei Sa/So', read: () => app.settings.mealTimes.oats[1], write: (v) => (app.settings.mealTimes.oats[1] = v) },
    { label: 'Mittag Mo–Fr', read: () => app.settings.mealTimes.mittag[0], write: (v) => (app.settings.mealTimes.mittag[0] = v) },
    { label: 'Mittag Sa/So', read: () => app.settings.mealTimes.mittag[1], write: (v) => (app.settings.mealTimes.mittag[1] = v) },
    { label: 'Snack Mo–Fr', read: () => app.settings.mealTimes.snack[0], write: (v) => (app.settings.mealTimes.snack[0] = v) },
    { label: 'Snack Sa/So', read: () => app.settings.mealTimes.snack[1], write: (v) => (app.settings.mealTimes.snack[1] = v) },
    { label: 'Abendessen Mo–Do', read: () => app.settings.mealTimes.abendMoDo, write: (v) => (app.settings.mealTimes.abendMoDo = v) },
    { label: 'Abendessen Fr', read: () => app.settings.mealTimes.abendFr, write: (v) => (app.settings.mealTimes.abendFr = v) },
    { label: 'Abendessen Sa/So', read: () => app.settings.mealTimes.abendWe, write: (v) => (app.settings.mealTimes.abendWe = v) },
    { label: 'Milch am Abend Mo–Fr', read: () => app.settings.mealTimes.spaet, write: (v) => (app.settings.mealTimes.spaet = v) },
  ];

  let reminders = $state<ReminderId[]>(REMINDERS.map((r) => r.id));
  let stepsText = $state(app.settings.dumbbellSteps.map((s) => formatDecimal(s)).join('  '));
  let weightText = $state(app.settings.profile.startWeightKg ? formatDecimal(app.settings.profile.startWeightKg) : '');
  let persisted = $state<boolean | null>(null);
  let pendingRestore = $state<BackupFile | null>(null);
  let confirmDeleteOpen = $state(false);
  let fileInput = $state<HTMLInputElement>();

  onMount(async () => {
    persisted = (await navigator.storage?.persisted?.()) ?? null;
  });

  function update<K extends keyof Settings>(key: K, value: Settings[K]): void {
    app.settings[key] = value;
    saveSettings();
  }

  function saveSteps(): void {
    const values = stepsText
      .split(/[\s;/]+/)
      .map((v) => parseDecimal(v))
      .filter((v): v is number => v !== null && v > 0)
      .sort((a, b) => a - b);
    if (values.length < 2) {
      showToast('Trag mindestens zwei Stufen ein, z. B. 2,3 und 4,5');
      stepsText = app.settings.dumbbellSteps.map((s) => formatDecimal(s)).join('  ');
      return;
    }
    update('dumbbellSteps', [...new Set(values)]);
    stepsText = app.settings.dumbbellSteps.map((s) => formatDecimal(s)).join('  ');
    showToast('Hantelstufen gespeichert');
  }

  function saveWeight(): void {
    const kg = parseDecimal(weightText);
    app.settings.profile.startWeightKg = kg;
    saveSettings();
  }

  function saveStart(value: string): void {
    if (!value) return;
    update('startDate', weekStart(value));
    showToast(`Start: ${formatDate(weekStart(value))}`);
  }

  async function exportCalendar(): Promise<void> {
    if (reminders.length === 0) {
      showToast('Wähl mindestens eine Erinnerung aus');
      return;
    }
    const ics = buildIcs(reminderEvents($state.snapshot(app.settings) as Settings, reminders, todayKey()));
    const result = await shareOrDownload(new File([ics], 'aufbau-erinnerungen.ics', { type: 'text/calendar' }));
    if (result !== 'cancelled') showToast('Kalenderdatei erstellt');
  }

  async function exportBackup(withPhotos: boolean): Promise<void> {
    const backup = await createBackup(await getDB(), { withPhotos });
    const file = new File([JSON.stringify(backup)], backupFileName(new Date(), withPhotos), { type: 'application/json' });
    const result = await shareOrDownload(file);
    if (result === 'cancelled') return;
    update('lastBackupAt', Date.now());
    showToast('Backup erstellt');
  }

  async function pickBackup(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      pendingRestore = parseBackup(await file.text());
    } catch (err) {
      showToast(err instanceof BackupError ? err.message : 'Die Datei konnte nicht gelesen werden.');
    }
  }

  async function restore(): Promise<void> {
    if (!pendingRestore) return;
    await restoreBackup(await getDB(), $state.snapshot(pendingRestore) as BackupFile);
    pendingRestore = null;
    await loadApp();
    showToast('Backup eingespielt');
  }

  async function deleteEverything(): Promise<void> {
    await clearAllData();
    location.hash = '/start';
    location.reload();
  }

  async function askPersist(): Promise<void> {
    persisted = await requestPersistentStorage();
    showToast(persisted ? 'Dauerhafter Speicher ist aktiv' : 'Der Browser hat abgelehnt. Mach regelmäßig ein Backup.');
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/heute')}><Icon name="chevron-left" /></button>
  </header>
  <h1>Einstellungen</h1>

  <h2 class="section-title">Start und Startwerte</h2>
  <section class="card stack">
    <label class="field">
      <span>Erste Trainingswoche ab Montag</span>
      <input class="input" type="date" value={app.settings.startDate ?? ''} onchange={(e) => saveStart(e.currentTarget.value)} />
    </label>
    <div class="grid3">
      <label class="field">
        <span>Gewicht (kg)</span>
        <input class="input" inputmode="decimal" bind:value={weightText} onblur={saveWeight} placeholder="z. B. 70,5" />
      </label>
      <label class="field">
        <span>Größe (cm)</span>
        <input
          class="input"
          inputmode="numeric"
          value={app.settings.profile.heightCm ?? ''}
          onchange={(e) => { app.settings.profile.heightCm = Number(e.currentTarget.value) || null; saveSettings(); }}
          placeholder="z. B. 175"
        />
      </label>
      <label class="field">
        <span>Alter</span>
        <input
          class="input"
          inputmode="numeric"
          value={app.settings.profile.age ?? ''}
          onchange={(e) => { app.settings.profile.age = Number(e.currentTarget.value) || null; saveSettings(); }}
          placeholder="z. B. 30"
        />
      </label>
    </div>
  </section>

  <h2 class="section-title">Ziele</h2>
  <section class="card stack">
    <div class="goal">
      <span class="row-grow">Kalorien pro Tag<br /><span class="small muted">Der Plan passt die Oats an</span></span>
      <Stepper value={app.settings.kcalTarget} label="Kalorienziel" step={50} min={2500} max={3400} unit="kcal" onchange={(v) => setKcalTarget(todayKey(), v)} />
    </div>
    <p class="small muted">
      Fällt dir das Essen am Anfang schwer, starte bei 2.500 und steigere dich alle zwei Wochen um 150 bis 250 kcal. Das Protein-Ziel bleibt bei mindestens
      {app.settings.proteinTarget} g.
    </p>
  </section>

  <h2 class="section-title">Training</h2>
  <section class="card stack">
    <label class="field">
      <span>Hantelstufen in kg</span>
      <input class="input" inputmode="decimal" bind:value={stepsText} onblur={saveSteps} />
      <span class="caption muted">Mit Leerzeichen getrennt, z. B. 2,3 4,5 6,8 9,1 11,3</span>
    </label>
    <label class="switch">
      <span class="row-grow">Supersätze<br /><span class="small muted">Zwei Übungen im Wechsel, Pause erst nach beiden</span></span>
      <input type="checkbox" checked={app.settings.supersets} onchange={(e) => update('supersets', e.currentTarget.checked)} />
    </label>
    <label class="switch">
      <span class="row-grow">Kreatin im Plan<br /><span class="small muted">3–5 g täglich in die Oats</span></span>
      <input type="checkbox" checked={app.settings.creatine} onchange={(e) => update('creatine', e.currentTarget.checked)} />
    </label>
  </section>

  <h2 class="section-title">Uhrzeiten</h2>
  <section class="card times">
    {#each timeFields as field (field.key)}
      <label class="time-row">
        <span>{field.label}</span>
        <input
          class="input time"
          type="time"
          value={app.settings.times[field.key]}
          onchange={(e) => { app.settings.times[field.key] = e.currentTarget.value; saveSettings(); }}
        />
      </label>
    {/each}
  </section>

  <h2 class="section-title">Mahlzeiten</h2>
  <section class="card times">
    <p class="small muted">Wann du isst. Plan, Anzeige in „Heute“ und die Kalender-Erinnerungen richten sich danach. Nach einer Änderung lädst du die Kalenderdatei unten noch einmal herunter.</p>
    {#each mealRows as row (row.label)}
      <label class="time-row">
        <span>{row.label}</span>
        <input
          class="input time"
          type="time"
          value={row.read()}
          onchange={(e) => {
            if (!e.currentTarget.value) return;
            row.write(e.currentTarget.value);
            saveSettings();
          }}
        />
      </label>
    {/each}
  </section>

  <h2 class="section-title">Erinnerungen im Kalender</h2>
  <section class="card stack">
    <p class="small muted">Die App erstellt eine Kalenderdatei. Das iPhone fragt dann „Alle hinzufügen“. Klappt das nicht, öffne die Datei in Safari.</p>
    {#each REMINDERS as r (r.id)}
      <label class="switch">
        <span class="row-grow">{r.label}<br /><span class="small muted">{r.detail(app.settings)}</span></span>
        <input type="checkbox" value={r.id} bind:group={reminders} />
      </label>
    {/each}
    <button class="btn btn-primary" onclick={exportCalendar}><Icon name="calendar" size={20} />Zum Kalender hinzufügen</button>
  </section>

  <h2 class="section-title">Darstellung</h2>
  <div class="segmented" role="radiogroup" aria-label="Design">
    {#each themes as t (t.id)}
      <button role="radio" aria-checked={app.settings.theme === t.id} class:selected={app.settings.theme === t.id} onclick={() => update('theme', t.id)}>{t.label}</button>
    {/each}
  </div>

  <h2 class="section-title">iPhone</h2>
  <div class="list">
    <a class="row" href="#/einstellungen/test">
      <Icon name="device-mobile" />
      <span class="row-grow">iPhone-Test<br /><span class="small muted">Ton, Bildschirm, Kamera, Teilen, Kurzbefehl, Kalender</span></span>
      <Icon name="chevron-right" />
    </a>
  </div>

  <h2 class="section-title">Daten</h2>
  <section class="card stack">
    <p class="small muted">
      Alles liegt nur auf diesem iPhone. Löschst du das App-Symbol vom Home-Bildschirm, sind alle Daten weg. Mach deshalb regelmäßig ein Backup und speicher es
      in „Dateien“ oder iCloud Drive.
    </p>
    {#if app.settings.lastBackupAt}
      <p class="small">Letztes Backup: {new Date(app.settings.lastBackupAt).toLocaleDateString('de-DE')}</p>
    {/if}
    <button class="btn btn-primary" onclick={() => exportBackup(false)}><Icon name="download" size={20} />Backup erstellen</button>
    <button class="btn btn-secondary" onclick={() => exportBackup(true)}>Backup mit Fotos</button>
    <button class="btn btn-secondary" onclick={() => fileInput?.click()}><Icon name="upload" size={20} />Backup einspielen</button>
    <input bind:this={fileInput} class="sr-only" type="file" accept="application/json,.json" onchange={pickBackup} />
    {#if persisted === false}
      <button class="btn btn-ghost" onclick={askPersist}>Dauerhaften Speicher anfragen</button>
    {:else if persisted}
      <p class="small muted"><Icon name="shield-check" size={16} /> Dauerhafter Speicher ist aktiv.</p>
    {/if}
  </section>

  <section class="card stack">
    <h3>Sicherheit</h3>
    <p class="small muted">
      Die App ersetzt keinen ärztlichen Rat. Hast du Schmerzen oder wird dir schwindelig, brich die Übung ab. Bei Vorerkrankungen klär Training und Kreatin vorher
      ärztlich ab.
    </p>
  </section>

  <button class="btn btn-danger" onclick={() => (confirmDeleteOpen = true)}>Alle Daten löschen</button>
  <p class="caption faint">Aufbau {APP_VERSION}</p>
</div>

<Sheet open={pendingRestore !== null} title="Backup einspielen?" onclose={() => (pendingRestore = null)}>
  {#if pendingRestore}
    <p>Backup vom {new Date(pendingRestore.exportedAt).toLocaleDateString('de-DE')}{pendingRestore.withPhotos ? ', mit Fotos' : ''}.</p>
    <p class="small muted">Deine aktuellen Daten werden durch das Backup ersetzt.{pendingRestore.withPhotos ? '' : ' Vorhandene Fotos bleiben erhalten.'}</p>
  {/if}
  {#snippet footer()}
    <button class="btn btn-ghost" onclick={() => (pendingRestore = null)}>Abbrechen</button>
    <button class="btn btn-primary btn-block" onclick={restore}>Einspielen</button>
  {/snippet}
</Sheet>

<Sheet open={confirmDeleteOpen} title="Alle Daten löschen?" onclose={() => (confirmDeleteOpen = false)}>
  <p>Trainings, Einstellungen und Notizen werden auf diesem iPhone endgültig gelöscht.</p>
  <p class="small muted">Mach vorher ein Backup, wenn du die Daten behalten willst.</p>
  {#snippet footer()}
    <button class="btn btn-ghost" onclick={() => (confirmDeleteOpen = false)}>Behalten</button>
    <button class="btn btn-danger btn-block" onclick={deleteEverything}>Endgültig löschen</button>
  {/snippet}
</Sheet>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .goal {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .grid3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .switch {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--tap);
  }

  .switch input {
    width: 24px;
    height: 24px;
    accent-color: var(--accent-ink);
    flex: none;
  }

  .times {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .time-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .time {
    width: 8.5em;
    min-height: 42px;
  }

  .segmented {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 4px;
    background: var(--surface-1);
    border-radius: var(--radius-control);
  }

  .segmented button {
    min-height: 40px;
    border-radius: 8px;
    color: var(--text-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }

  .segmented button.selected {
    background: var(--surface-3);
    color: var(--text);
  }
</style>
