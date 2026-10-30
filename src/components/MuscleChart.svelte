<script lang="ts">
  // Muskel-Übersicht als Bullet-Diagramm: erledigte Sätze (kräftig), noch geplante (hell),
  // dahinter der Zielbereich. Mitarbeitende Muskeln zählen halb.
  import { MUSCLES, MUSCLE_LABELS, type Muscle } from '../data/types';
  import { MUSCLE_RANGES } from '../lib/muscles';
  import { formatDecimal } from '../lib/numbers';

  interface Props {
    done: Record<Muscle, number>;
    planned: Record<Muscle, number>;
  }

  let { done, planned }: Props = $props();

  const scaleMax = $derived(Math.max(...MUSCLES.map((m) => Math.max(MUSCLE_RANGES[m][1], planned[m], done[m]))) * 1.04);
  const pct = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
</script>

<div class="chart" aria-hidden="true">
  {#each MUSCLES as m (m)}
    {@const range = MUSCLE_RANGES[m]}
    <div class="mrow">
      <span class="name">{MUSCLE_LABELS[m]}</span>
      <div class="track">
        <span class="band" style:left={pct(range[0])} style:width={pct(range[1] - range[0])}></span>
        <span class="plan" style:width={pct(Math.max(planned[m], done[m]))}></span>
        <span class="done" style:width={pct(done[m])}></span>
      </div>
      <span class="val num">{formatDecimal(done[m])}<span class="faint">/{formatDecimal(planned[m])}</span></span>
    </div>
  {/each}
</div>

<table class="sr-only">
  <caption>Sätze pro Muskelgruppe in dieser Woche</caption>
  <thead><tr><th>Muskel</th><th>Erledigt</th><th>Geplant</th><th>Ziel</th></tr></thead>
  <tbody>
    {#each MUSCLES as m (m)}
      <tr>
        <td>{MUSCLE_LABELS[m]}</td>
        <td>{formatDecimal(done[m])}</td>
        <td>{formatDecimal(planned[m])}</td>
        <td>{MUSCLE_RANGES[m][0]} bis {MUSCLE_RANGES[m][1]}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .chart {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mrow {
    display: grid;
    grid-template-columns: 5.2em minmax(0, 1fr) 4.4em;
    align-items: center;
    gap: 10px;
  }

  .name {
    font-size: var(--fs-small);
    color: var(--text-2);
  }

  .track {
    position: relative;
    height: 20px;
  }

  .band {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--surface-2);
    border-radius: 4px;
  }

  .plan,
  .done {
    position: absolute;
    left: 0;
    top: 5px;
    height: 10px;
    border-radius: 0 4px 4px 0;
  }

  .plan {
    background: color-mix(in srgb, var(--accent-ink) 30%, transparent);
  }

  .done {
    background: var(--accent-ink);
  }

  .val {
    text-align: right;
    font-size: var(--fs-small);
  }
</style>
