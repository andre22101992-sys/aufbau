<script lang="ts" module>
  export interface ProgressPoint {
    date: string;
    value: number;
    label: string;
    detail: string;
  }
</script>

<script lang="ts">
  // Verlauf einer Übung: Die Linie klettert die Stufen-Leiter hoch.
  // Jede ganze Zahl auf der y-Achse ist eine Stufe, dazwischen zählen die Wiederholungen.

  interface Props {
    points: ProgressPoint[];
    tickLabel: (rung: number) => string;
  }

  let { points, tickLabel }: Props = $props();

  let width = $state(320);
  let selected = $state<number | null>(null);
  const height = 190;
  const pad = { top: 16, right: 18, bottom: 26, left: 58 };

  const lo = $derived(points.length ? Math.floor(Math.min(...points.map((p) => p.value))) : 0);
  const hi = $derived(points.length ? Math.max(lo + 1, Math.ceil(Math.max(...points.map((p) => p.value)) + 0.15)) : 1);
  const ticks = $derived(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));

  const x = (i: number) => pad.left + (points.length <= 1 ? (width - pad.left - pad.right) / 2 : (i / (points.length - 1)) * (width - pad.left - pad.right));
  const y = (v: number) => pad.top + (1 - (v - lo) / (hi - lo)) * (height - pad.top - pad.bottom);

  const path = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' '));
  const shown = $derived(selected ?? points.length - 1);

  function pick(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const px = event.clientX - rect.left;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    selected = best;
  }

  const shortDate = (key: string) => {
    const [, m, d] = key.split('-');
    return `${Number(d)}.${Number(m)}.`;
  };
</script>

<div class="wrap" bind:clientWidth={width}>
  {#if points.length > 0}
    <svg {width} {height} role="img" aria-label="Verlauf: {points.at(-1)?.label}" onpointerdown={pick} onpointermove={(e) => e.buttons && pick(e)}>
      {#each ticks as t (t)}
        <line class="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={pad.left - 8} y={y(t) + 4} text-anchor="end">{tickLabel(t)}</text>
      {/each}
      {#if points.length > 1}
        <path class="line" d={path} />
      {/if}
      {#each points as p, i (i)}
        {#if i === shown}
          <line class="cursor" x1={x(i)} x2={x(i)} y1={pad.top} y2={height - pad.bottom} />
        {/if}
        <circle class="dot" class:active={i === shown} cx={x(i)} cy={y(p.value)} r={i === shown || i === points.length - 1 ? 5 : 3.5} />
      {/each}
      <text class="axis" x={pad.left} y={height - 6}>{shortDate(points[0].date)}</text>
      {#if points.length > 1}
        <text class="axis" x={width - pad.right} y={height - 6} text-anchor="end">{shortDate(points[points.length - 1].date)}</text>
      {/if}
    </svg>
    <div class="readout">
      <span class="num strong">{points[shown].label}</span>
      <span class="muted small">{shortDate(points[shown].date)}, {points[shown].detail}</span>
    </div>
  {/if}
</div>

<style>
  .wrap {
    width: 100%;
  }

  svg {
    display: block;
    touch-action: pan-y;
    overflow: visible;
  }

  .grid {
    stroke: var(--line);
    stroke-width: 1;
  }

  .tick,
  .axis {
    fill: var(--text-3);
    font-size: 11px;
    font-family: var(--font-num);
  }

  .line {
    fill: none;
    stroke: var(--accent-ink);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .dot {
    fill: var(--accent-ink);
    stroke: var(--surface-1);
    stroke-width: 2;
  }

  .cursor {
    stroke: var(--line-strong);
    stroke-width: 1;
  }

  .readout {
    display: flex;
    flex-direction: column;
    margin-top: 6px;
  }

  .strong {
    font-weight: 600;
  }
</style>
