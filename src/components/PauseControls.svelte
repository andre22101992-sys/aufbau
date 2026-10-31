<script lang="ts">
  // Krank oder im Urlaub: Pause einlegen und wieder beenden.
  import { formatDate, todayKey } from '../lib/dates';
  import { PAUSE_LABELS, activePause, pauseDays } from '../lib/pause';
  import { app } from '../lib/state/app.svelte';
  import { endPause, startPause } from '../lib/state/pause.svelte';
  import Sheet from './Sheet.svelte';

  const today = todayKey();
  const pause = $derived(activePause(app.settings.pauses));
  let open = $state(false);

  async function start(reason: 'krank' | 'urlaub'): Promise<void> {
    await startPause(reason);
    open = false;
  }
</script>

{#if pause}
  <section class="card-hero stack">
    <p class="small muted">Pause, Tag {pauseDays(pause, today)}</p>
    <h2>{PAUSE_LABELS[pause.reason]} seit {formatDate(pause.from, 'short')}</h2>
    <p class="muted">
      Training, Serie und Kalorien-Steuerung ruhen, und verpasste Tage zählen nicht. Essen und Trinken bleiben wichtig, auch bei wenig Appetit. Bei längerer
      Krankheit gehört der Besuch in eine Arztpraxis dazu.
    </p>
    <button class="btn btn-primary btn-block" onclick={endPause}>Pause beenden</button>
  </section>
{:else}
  <button class="link" onclick={() => (open = true)}>Krank oder im Urlaub? Pause einlegen</button>
{/if}

<Sheet open={open} title="Pause einlegen" onclose={() => (open = false)}>
  <p>Während der Pause ruhen Training, Serie und die Kalorien-Steuerung. Verpasste Tage zählen nicht gegen dich.</p>
  <p class="small muted">Dauert die Pause länger als eine Woche, gibt es beim Wiedereinstieg eine Woche mit 40 % weniger Sätzen.</p>
  <button class="btn btn-primary btn-block" onclick={() => start('krank')}>Ich bin krank</button>
  <button class="btn btn-secondary btn-block" onclick={() => start('urlaub')}>Ich bin im Urlaub</button>
</Sheet>

<style>
  .link {
    align-self: center;
    color: var(--text-2);
    font-size: var(--fs-small);
    text-decoration: underline;
    padding: 6px 0;
  }
</style>
