<script lang="ts">
  // Ruhetag-Programm mit Timer: eine Übung nach der anderen, Ton am Ende jeder Übung.
  import { onDestroy } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import { MOBILITY, MOBILITY_MINUTES } from '../data/mobility';
  import { beep, unlockSound } from '../lib/sound';
  import { goBack } from '../lib/state/router.svelte';
  import { keepScreenOn } from '../lib/wakelock';

  let index = $state(0);
  let running = $state(false);
  let finished = $state(false);
  let endsAt = $state(0);
  let left = $state(MOBILITY[0].seconds);
  let timer: ReturnType<typeof setInterval> | undefined;

  const step = $derived(MOBILITY[index]);
  const progress = $derived(1 - left / step.seconds);

  function tick(): void {
    // Rechnet mit der Uhrzeit, damit die Restzeit auch nach einer Pause der App stimmt
    left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    if (left === 0) {
      beep();
      next();
    }
  }

  function startStep(): void {
    endsAt = Date.now() + step.seconds * 1000;
    left = step.seconds;
    clearInterval(timer);
    timer = setInterval(tick, 250);
    running = true;
  }

  function start(): void {
    unlockSound();
    void keepScreenOn(true);
    startStep();
  }

  function pause(): void {
    clearInterval(timer);
    running = false;
  }

  function resume(): void {
    endsAt = Date.now() + left * 1000;
    timer = setInterval(tick, 250);
    running = true;
  }

  function next(): void {
    if (index >= MOBILITY.length - 1) {
      clearInterval(timer);
      running = false;
      finished = true;
      void keepScreenOn(false);
      return;
    }
    index += 1;
    if (running) startStep();
    else left = MOBILITY[index].seconds;
  }

  function previous(): void {
    if (index === 0) return;
    index -= 1;
    if (running) startStep();
    else left = MOBILITY[index].seconds;
  }

  onDestroy(() => {
    clearInterval(timer);
    void keepScreenOn(false);
  });

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/heute')}><Icon name="chevron-left" /></button>
  </header>
  <h1>Ruhetag-Programm</h1>
  <p class="muted">Etwa {MOBILITY_MINUTES} Minuten Beweglichkeit, ganz locker. Freiwillig: Erholung zählt auch ohne.</p>

  {#if finished}
    <section class="card-hero stack">
      <h2>Geschafft</h2>
      <p class="muted">Gut für Rücken, Hüfte und Schultern. Genieß den Rest des Tages.</p>
      <button class="btn btn-secondary" onclick={() => goBack('/heute')}>Zurück zu Heute</button>
    </section>
  {:else}
    <section class="card-hero stack">
      <p class="small muted num">Übung {index + 1} von {MOBILITY.length}</p>
      <h2>{step.name}{#if step.side}<span class="side">, {step.side}</span>{/if}</h2>
      <p class="clock num" aria-live="off">{mmss(left)}</p>
      <div class="bar" aria-hidden="true"><span style:width="{progress * 100}%"></span></div>
      <ol>
        {#each step.cues as cue (cue)}<li>{cue}</li>{/each}
      </ol>
      {#if !running && left === step.seconds && index === 0}
        <button class="btn btn-primary btn-block" onclick={start}><Icon name="player-play" size={20} />Starten</button>
      {:else if running}
        <button class="btn btn-secondary btn-block" onclick={pause}><Icon name="player-pause" size={20} />Pause</button>
      {:else}
        <button class="btn btn-primary btn-block" onclick={left === step.seconds ? start : resume}><Icon name="player-play" size={20} />Weiter</button>
      {/if}
      <div class="nav">
        <button class="btn btn-ghost" onclick={previous} disabled={index === 0}>Zurück</button>
        <button class="btn btn-ghost" onclick={next}><Icon name="player-skip-forward" size={18} />Überspringen</button>
      </div>
    </section>

    <h2 class="section-title">Ablauf</h2>
    <div class="list">
      {#each MOBILITY as item, i (i)}
        <div class="row" class:current={i === index} class:done={i < index}>
          <span class="row-grow">{item.name}{item.side ? `, ${item.side}` : ''}</span>
          <span class="small muted num">{mmss(item.seconds)}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .side {
    color: var(--text-2);
    font-weight: 500;
  }

  .clock {
    font-family: var(--font-num);
    font-size: 56px;
    font-weight: 700;
    line-height: 1;
  }

  .bar {
    height: 6px;
    background: var(--surface-3);
    border-radius: 3px;
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--accent-ink);
  }

  ol {
    margin: 0;
    padding-left: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--text-2);
  }

  .nav {
    display: flex;
    justify-content: space-between;
  }

  .current {
    box-shadow: inset 3px 0 0 var(--accent-ink);
  }

  .done span:first-child {
    color: var(--text-3);
  }
</style>
