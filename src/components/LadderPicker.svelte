<script lang="ts">
  // Die Stufen-Leiter: aufsteigende Balken wie im App-Symbol. Die gewählte Stufe leuchtet.
  import type { Rung } from '../lib/ladder';
  import { formatDecimal } from '../lib/numbers';

  interface Props {
    ladder: Rung[];
    value: number;
    suggested?: number;
    disabled?: boolean;
    onchange: (rung: number) => void;
  }

  let { ladder, value, suggested, disabled = false, onchange }: Props = $props();

  function shortLabel(rung: Rung, index: number): string {
    if (rung.load.kind === 'kg') {
      if (rung.load.tech === 'langsam') return 'langsam';
      if (rung.load.tech === 'pause') return 'Pause';
      if (rung.load.kg === 0) return 'ohne';
      return formatDecimal(rung.load.kg);
    }
    return String(index + 1);
  }

  const heightOf = (i: number) => 14 + (i / Math.max(1, ladder.length - 1)) * 30;
</script>

<div class="ladder" role="radiogroup" aria-label="Stufe">
  {#each ladder as rung, i (i)}
    <button
      type="button"
      role="radio"
      aria-checked={i === value}
      aria-label={rung.label}
      class:selected={i === value}
      class:suggested={i === suggested && i !== value}
      {disabled}
      onclick={() => onchange(i)}
    >
      <span class="bar" style:height="{heightOf(i)}px"></span>
      <span class="lbl num">{shortLabel(rung, i)}</span>
    </button>
  {/each}
</div>
<p class="current small">{ladder[value]?.label}</p>

<style>
  .ladder {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    overflow-x: auto;
    padding: 2px;
    scrollbar-width: none;
  }

  .ladder::-webkit-scrollbar {
    display: none;
  }

  button {
    flex: 1 0 38px;
    min-width: 38px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding-top: 4px;
  }

  button:disabled {
    opacity: 0.5;
  }

  .bar {
    width: 100%;
    max-width: 46px;
    border-radius: 6px 6px 3px 3px;
    background: var(--surface-3);
    transition: background-color 0.15s;
  }

  .selected .bar {
    background: var(--accent);
  }

  .suggested .bar {
    box-shadow: inset 0 0 0 2px var(--accent-ink);
  }

  .lbl {
    font-size: var(--fs-caption);
    color: var(--text-3);
    white-space: nowrap;
  }

  .selected .lbl {
    color: var(--text);
    font-weight: 600;
  }

  .current {
    margin-top: 6px;
    color: var(--text-2);
  }
</style>
