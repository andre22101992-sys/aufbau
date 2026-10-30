<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { addDays, formatDate, nextWeekday, todayKey, weekStart } from '../lib/dates';
  import { parseDecimal } from '../lib/numbers';
  import { isIOS, isStandalone, requestPersistentStorage } from '../lib/platform';
  import { app, saveSettingsNow } from '../lib/state/app.svelte';
  import { go } from '../lib/state/router.svelte';

  let step = $state(0);
  let understood = $state(false);
  let weight = $state('');
  let height = $state('');
  let age = $state('');
  let start = $state(nextWeekday(todayKey(), 0, false));

  const installed = isStandalone();
  const ios = isIOS();
  const startMonday = $derived(start ? weekStart(start) : nextWeekday(todayKey(), 0, false));

  async function finish(): Promise<void> {
    app.settings.profile = {
      startWeightKg: parseDecimal(weight),
      heightCm: Number(height) || null,
      age: Number(age) || null,
    };
    app.settings.startDate = startMonday;
    app.settings.onboarded = true;
    await saveSettingsNow();
    await requestPersistentStorage();
    go('/heute', true);
  }
</script>

<div class="screen onboarding">
  <div class="brand" aria-hidden="true">
    <span style:height="22px"></span><span style:height="34px"></span><span style:height="48px"></span>
  </div>

  {#if step === 0}
    <h1>Willkommen bei Aufbau</h1>
    <p class="muted">Dein Plan für Training, Essen und Fortschritt. Alles bleibt auf deinem iPhone, ohne Konto.</p>
    {#if ios && !installed}
      <section class="card stack">
        <h2>Zuerst auf den Home-Bildschirm</h2>
        <ol class="steps">
          <li>Tippe in Safari unten auf <Icon name="share" size={18} label="Teilen" />.</li>
          <li>Wähle „Zum Home-Bildschirm“ und dann „Hinzufügen“.</li>
          <li>Öffne Aufbau über das neue Symbol.</li>
        </ol>
        <p class="small muted">Wichtig: Was du hier in Safari einträgst, kommt in die installierte App nicht mit.</p>
      </section>
      <button class="btn btn-ghost" onclick={() => (step = 1)}>Erst mal im Browser ausprobieren</button>
    {:else}
      <button class="btn btn-primary btn-block" onclick={() => (step = 1)}>Los geht’s</button>
    {/if}
  {:else if step === 1}
    <h1>Kurz zur Sicherheit</h1>
    <section class="card stack">
      <p>Die App ersetzt keinen ärztlichen Rat.</p>
      <p class="muted">Hast du beim Training Schmerzen oder wird dir schwindelig, brich die Übung ab. Die Anleitungen enthalten Hinweise wie „Stuhl an die Wand stellen“, damit nichts wegrutscht.</p>
      <label class="check">
        <input type="checkbox" bind:checked={understood} />
        <span>Verstanden</span>
      </label>
    </section>
    <button class="btn btn-primary btn-block" disabled={!understood} onclick={() => (step = 2)}>Weiter</button>
  {:else if step === 2}
    <h1>Deine Startwerte</h1>
    <p class="muted">Damit siehst du später, was sich verändert hat. Du kannst die Felder auch leer lassen.</p>
    <section class="card grid">
      <label class="field">
        <span>Gewicht (kg)</span>
        <input class="input" inputmode="decimal" bind:value={weight} placeholder="z. B. 70,5" />
      </label>
      <label class="field">
        <span>Größe (cm)</span>
        <input class="input" inputmode="numeric" bind:value={height} placeholder="z. B. 175" />
      </label>
      <label class="field">
        <span>Alter</span>
        <input class="input" inputmode="numeric" bind:value={age} placeholder="z. B. 30" />
      </label>
    </section>
    <button class="btn btn-primary btn-block" onclick={() => (step = 3)}>Weiter</button>
  {:else}
    <h1>Dein Start</h1>
    <section class="card stack">
      <p>Am Samstag vor dem Start kaufst du ein und kochst zum ersten Mal. Das erste Training ist am Montag.</p>
      <label class="field">
        <span>Erste Trainingswoche</span>
        <input class="input" type="date" bind:value={start} />
      </label>
      <p class="small muted">Einkauf am {formatDate(addDays(startMonday, -2))}, erstes Training am {formatDate(startMonday)}.</p>
    </section>
    <p class="small muted">Erinnerungen fürs Training, Wiegen und Kochen kannst du danach in den Einstellungen in deinen Kalender übernehmen.</p>
    <button class="btn btn-primary btn-block" onclick={finish}>Plan starten</button>
  {/if}
</div>

<style>
  .onboarding {
    padding-top: calc(var(--safe-top) + 40px);
    padding-bottom: calc(var(--safe-bottom) + 32px);
    min-height: 100dvh;
  }

  .brand {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 52px;
    margin-bottom: 12px;
  }

  .brand span {
    width: 14px;
    border-radius: 4px;
    background: var(--accent);
  }

  .steps {
    margin: 0;
    padding-left: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .steps :global(.icon) {
    vertical-align: -3px;
    color: var(--accent-ink);
  }

  .check {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--tap);
    font-weight: 600;
  }

  .check input {
    width: 24px;
    height: 24px;
    accent-color: var(--accent-ink);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
</style>
