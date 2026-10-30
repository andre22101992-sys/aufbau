<script lang="ts">
  // Läuft ein Training und du schaust woanders hin, bleibt diese Leiste über der Tab-Leiste.
  import { DAY_TITLES } from '../data/blocks';
  import { formatDuration } from '../lib/dates';
  import { app } from '../lib/state/app.svelte';
  import { clock, useClock } from '../lib/state/clock.svelte';
  import { remainingMs } from '../lib/timers';
  import Icon from './Icon.svelte';

  $effect(() => useClock());

  const elapsed = $derived(app.active ? clock.now - app.active.startedAt : 0);
  const rest = $derived(app.active?.restTimer ? remainingMs(app.active.restTimer, clock.now) : 0);
</script>

{#if app.active}
  <a class="mini" href="#/training/aktiv">
    <span class="dot" aria-hidden="true"></span>
    <span class="text">
      <strong>{DAY_TITLES[app.active.dayId]}</strong>
      <span class="muted small">
        Training läuft seit <span class="num">{formatDuration(elapsed)}</span>{#if rest > 0}, Pause noch <span class="num">{formatDuration(rest)}</span>{/if}
      </span>
    </span>
    <Icon name="chevron-right" />
  </a>
{/if}

<style>
  .mini {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: calc(var(--tabbar-h) + var(--safe-bottom) + 10px);
    z-index: 19;
    max-width: 620px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px 10px 14px;
    background: var(--surface-2);
    border-radius: 14px;
    color: var(--text);
    text-decoration: none;
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.3);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    flex: none;
  }

  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: var(--fs-small);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
