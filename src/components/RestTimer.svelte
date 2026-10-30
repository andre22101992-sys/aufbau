<script lang="ts">
  // Pausen-Timer unten im Daumenbereich. Der Balken läuft leer, am Ende kommt ein Ton.
  import { formatDuration } from '../lib/dates';
  import { beep } from '../lib/sound';
  import { app } from '../lib/state/app.svelte';
  import { clock, useClock } from '../lib/state/clock.svelte';
  import { extendRest, markRestAlerted, skipRest } from '../lib/state/workout.svelte';
  import { elapsedFraction, remainingMs } from '../lib/timers';

  const timer = $derived(app.active?.restTimer ?? null);
  const remaining = $derived(timer ? remainingMs(timer, clock.now) : 0);
  const left = $derived(timer ? 1 - elapsedFraction(timer, clock.now) : 0);

  $effect(() => {
    if (!timer) return;
    return useClock();
  });

  $effect(() => {
    if (timer && remaining === 0 && !timer.alerted) {
      beep();
      markRestAlerted();
    }
  });

  // Nach Ablauf noch ein paar Sekunden stehen lassen, dann ausblenden
  $effect(() => {
    if (!timer?.alerted) return;
    const t = setTimeout(skipRest, 8000);
    return () => clearTimeout(t);
  });
</script>

{#if timer}
  <div class="rest" class:done={remaining === 0} role="timer" aria-live="polite">
    <div class="drain" style:transform="scaleX({left})"></div>
    <div class="content">
      <div class="info">
        <span class="label">{remaining === 0 ? 'Weiter geht’s' : 'Pause'}</span>
        <span class="time num">{formatDuration(remaining)}</span>
      </div>
      <div class="actions">
        {#if remaining > 0}
          <button class="btn btn-secondary" onclick={() => extendRest(15)}>+15 s</button>
        {/if}
        <button class="btn btn-primary" onclick={skipRest}>{remaining === 0 ? 'Weiter' : 'Überspringen'}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .rest {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: calc(10px + var(--safe-bottom));
    z-index: 30;
    max-width: 620px;
    margin: 0 auto;
    background: var(--surface-2);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.35);
  }

  .drain {
    position: absolute;
    inset: 0 auto 0 0;
    width: 100%;
    background: var(--accent-soft);
    transform-origin: left center;
    transition: transform 0.25s linear;
  }

  .done .drain {
    background: var(--accent);
    opacity: 0.25;
  }

  .content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 12px 12px 18px;
  }

  .info {
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: var(--fs-small);
    color: var(--text-2);
  }

  .time {
    font-size: var(--fs-hero);
    font-weight: 700;
    line-height: 1.05;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
</style>
