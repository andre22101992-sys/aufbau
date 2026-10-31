<script lang="ts">
  // Kochmodus: ein Schritt nach dem anderen, Zeitstrahl für Topf, Crispi und dich, mehrere Timer parallel, Vorlesen auf Tipp.
  import { onDestroy, onMount } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import { DEVICE_LABELS, RECIPE_BY_ID, type Device } from '../data/recipes';
  import { formatDuration } from '../lib/dates';
  import { crispiRounds, stepText, totalMinutes } from '../lib/nutrition';
  import { beep, unlockSound } from '../lib/sound';
  import { canSpeak, speak, stopSpeaking } from '../lib/speech';
  import { clock, useClock } from '../lib/state/clock.svelte';
  import { setPortion, loadDay } from '../lib/state/meals.svelte';
  import { go } from '../lib/state/router.svelte';
  import { showToast } from '../lib/state/app.svelte';
  import { isFinished, remainingMs, startTimer, type Timer } from '../lib/timers';
  import { keepScreenOn } from '../lib/wakelock';
  import { todayKey } from '../lib/dates';

  interface Props {
    id: string;
    portions: number;
  }

  let { id, portions }: Props = $props();

  const recipe = $derived(RECIPE_BY_ID[id]);
  let index = $state(0);
  let timers = $state<Timer[]>([]);
  let finished = $state(false);

  const step = $derived(recipe?.steps[index]);
  const rounds = $derived(recipe ? crispiRounds(recipe, portions) : 1);
  const total = $derived(recipe ? totalMinutes(recipe, portions) : 1);
  const DEVICES: Device[] = ['topf', 'crispi', 'du'];
  const timerMinutes = (s: NonNullable<typeof step>) => (s.timer ?? 0) * (s.device === 'crispi' ? rounds : 1);

  onMount(() => {
    const release = useClock();
    void keepScreenOn(true);
    return release;
  });

  onDestroy(() => {
    void keepScreenOn(false);
    stopSpeaking();
  });

  // Ton, sobald ein Timer abläuft (auch wenn er gerade nicht der aktuelle Schritt ist)
  $effect(() => {
    const now = clock.now;
    for (const t of timers) {
      if (!t.alerted && isFinished(t, now)) {
        t.alerted = true;
        beep();
        showToast(`${t.label}: Zeit ist um`);
      }
    }
  });

  function startStepTimer(): void {
    if (!step?.timer) return;
    unlockSound();
    const label = `${DEVICE_LABELS[step.device]}, Schritt ${index + 1}`;
    timers = [...timers.filter((t) => t.id !== String(index)), startTimer(String(index), label, timerMinutes(step) * 60_000)];
  }

  function next(): void {
    if (!recipe) return;
    if (index < recipe.steps.length - 1) index += 1;
    else finished = true;
  }

  function finish(markEaten: boolean): void {
    if (markEaten) {
      void loadDay(todayKey()).then(() => setPortion('abend', 1));
      showToast('Abendessen abgehakt. Guten Appetit!');
    }
    go('/essen');
  }

  const running = $derived(timers.filter((t) => !t.alerted || remainingMs(t, clock.now) > -60_000));
  const x = (minute: number) => `${Math.min(100, (minute / total) * 100)}%`;
</script>

<div class="screen cook">
  {#if !recipe || !step}
    <p class="muted">Dieses Rezept gibt es nicht.</p>
  {:else if finished}
    <section class="card-hero stack">
      <h1>Fertig</h1>
      <p class="muted">Denk daran: Die Büro-Box offen abkühlen lassen, dann in den Kühlschrank.</p>
      <button class="btn btn-primary btn-block" onclick={() => finish(true)}>Abendessen abhaken</button>
      <button class="btn btn-ghost btn-block" onclick={() => finish(false)}>Zurück zum Essen</button>
    </section>
  {:else}
    <header class="head">
      <button class="icon-btn" aria-label="Kochmodus beenden" onclick={() => go('/essen')}><Icon name="x" /></button>
      <div class="row-grow">
        <p class="small muted">{recipe.name}, {portions} Portionen</p>
        <p class="small muted num">Schritt {index + 1} von {recipe.steps.length}, insgesamt etwa {total} Min</p>
      </div>
    </header>

    <div class="timeline" aria-hidden="true">
      {#each DEVICES as device (device)}
        {#if recipe.steps.some((s) => s.device === device)}
          <span class="lane-label small">{DEVICE_LABELS[device]}</span>
          <div class="lane">
            {#each recipe.steps as s, i (i)}
              {#if s.device === device}
                <span
                  class="bar {device}"
                  class:current={i === index}
                  style:left={x(s.at)}
                  style:width={x(Math.max(0.8, s.minutes * (s.device === 'crispi' ? rounds : 1)))}
                ></span>
              {/if}
            {/each}
            <span class="now" style:left={x(step.at)}></span>
          </div>
        {/if}
      {/each}
    </div>

    <section class="card step-card">
      <p class="device {step.device}">{DEVICE_LABELS[step.device]}</p>
      <p class="step-text">{stepText(step, recipe, portions)}</p>
      {#if step.device === 'crispi' && step.timer && rounds > 1}
        <p class="small muted">Zu viel für einmal: in {rounds} Durchgängen garen, der Timer rechnet das mit ein.</p>
      {/if}
      {#if step.timer}
        <button class="btn btn-primary btn-block" onclick={startStepTimer}>
          <Icon name="clock" size={20} />Timer {timerMinutes(step)} Min starten
        </button>
      {/if}
    </section>

    {#if running.length}
      <div class="timers">
        {#each running as t (t.id)}
          {@const left = remainingMs(t, clock.now)}
          <div class="timer" class:done={left === 0}>
            <span class="small muted">{t.label}</span>
            <span class="num big">{left === 0 ? 'Fertig' : formatDuration(left)}</span>
          </div>
        {/each}
      </div>
    {/if}

    <div class="nav">
      <button class="btn btn-ghost" disabled={index === 0} onclick={() => (index -= 1)}><Icon name="chevron-left" size={18} />Zurück</button>
      {#if canSpeak()}
        <button class="btn btn-ghost" onclick={() => speak(stepText(step, recipe, portions))}>Vorlesen</button>
      {/if}
      <button class="btn btn-secondary" onclick={next}>{index === recipe.steps.length - 1 ? 'Fertig' : 'Weiter'}<Icon name="chevron-right" size={18} /></button>
    </div>
  {/if}
</div>

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 -8px;
  }

  .timeline {
    display: grid;
    grid-template-columns: 3.6em 1fr;
    gap: 6px 8px;
    align-items: center;
  }

  .lane-label {
    color: var(--text-2);
  }

  .lane {
    position: relative;
    height: 10px;
    background: var(--surface-2);
    border-radius: 5px;
  }

  .bar {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 5px;
    opacity: 0.45;
  }

  .bar.current {
    opacity: 1;
  }

  .bar.topf {
    background: var(--protein);
  }

  .bar.crispi {
    background: var(--kcal);
  }

  .bar.du {
    background: var(--text-2);
  }

  .now {
    position: absolute;
    top: -3px;
    bottom: -3px;
    width: 2px;
    background: var(--accent-ink);
  }

  .step-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .device {
    font-size: var(--fs-small);
    font-weight: 600;
  }

  .device.topf {
    color: var(--protein);
  }

  .device.crispi {
    color: var(--kcal);
  }

  .device.du {
    color: var(--text-2);
  }

  .step-text {
    font-size: calc(var(--fs-title) * 1.05);
    line-height: 1.4;
  }

  .timers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  .timer {
    display: flex;
    flex-direction: column;
    padding: 10px 12px;
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }

  .timer.done {
    box-shadow: inset 0 0 0 2px var(--accent-ink);
  }

  .big {
    font-size: var(--fs-title);
    font-weight: 700;
  }

  .nav {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
</style>
