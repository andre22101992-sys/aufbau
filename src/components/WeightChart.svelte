<script lang="ts">
  // Gewichtsverlauf: Tageswerte als Punkte, Trend als Linie, dahinter der Zielkorridor (+0,2 bis +0,5 kg pro Woche).
  import { addDays, diffDays, formatDate } from '../lib/dates';
  import { formatDecimal } from '../lib/numbers';
  import { MAX_GAIN, MIN_GAIN } from '../lib/steering';
  import type { TrendPoint } from '../lib/trend';

  interface Props {
    series: TrendPoint[];
    /** sichtbarer Zeitraum in Tagen; null = alles */
    days: number | null;
  }

  let { series, days }: Props = $props();

  let width = $state(320);
  let selected = $state<number | null>(null);
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 24, left: 40 };

  const last = $derived(series[series.length - 1]);
  const from = $derived(days && last ? addDays(last.date, -days) : series[0]?.date);
  const points = $derived(series.filter((p) => p.date >= from));
  const span = $derived(points.length ? Math.max(1, diffDays(last.date, points[0].date)) : 1);

  // Korridor ab dem ersten sichtbaren Trendwert
  const corridor = $derived.by(() => {
    if (points.length < 2) return null;
    const t0 = points[0].trend;
    return { lowEnd: t0 + (MIN_GAIN / 7) * span, highEnd: t0 + (MAX_GAIN / 7) * span, t0 };
  });

  const range = $derived.by(() => {
    const values = points.flatMap((p) => [p.kg, p.trend]);
    if (corridor) values.push(corridor.highEnd, corridor.t0);
    const lo = Math.min(...values) - 0.3;
    const hi = Math.max(...values) + 0.3;
    return { lo, hi };
  });

  const tickStep = $derived(range.hi - range.lo > 4 ? 1 : 0.5);
  const ticks = $derived.by(() => {
    const result: number[] = [];
    for (let v = Math.ceil(range.lo / tickStep) * tickStep; v <= range.hi; v += tickStep) result.push(Math.round(v * 10) / 10);
    return result;
  });

  const x = (date: string) => pad.left + (diffDays(date, points[0].date) / span) * (width - pad.left - pad.right);
  const y = (kg: number) => pad.top + (1 - (kg - range.lo) / (range.hi - range.lo)) * (height - pad.top - pad.bottom);

  const trendPath = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.trend).toFixed(1)}`).join(' '));
  const shown = $derived(selected !== null && selected < points.length ? selected : points.length - 1);

  function pick(event: PointerEvent): void {
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = event.clientX - rect.left;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.date) - px) < Math.abs(x(points[best].date) - px)) best = i;
    });
    selected = best;
  }

  const shortDate = (key: string) => {
    const [, m, d] = key.split('-');
    return `${Number(d)}.${Number(m)}.`;
  };
</script>

<div class="wrap" bind:clientWidth={width}>
  {#if points.length >= 2}
    <svg {width} {height} role="img" aria-label="Gewichtsverlauf mit Trend" onpointerdown={pick} onpointermove={(e) => e.buttons && pick(e)}>
      {#if corridor}
        <polygon
          class="band"
          points="{x(points[0].date)},{y(corridor.t0)} {x(last.date)},{y(corridor.highEnd)} {x(last.date)},{y(corridor.lowEnd)}"
        />
      {/if}
      {#each ticks as t (t)}
        <line class="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={pad.left - 8} y={y(t) + 4} text-anchor="end">{formatDecimal(t, 1)}</text>
      {/each}
      {#each points as p, i (p.date)}
        <circle class="dot" class:active={i === shown} cx={x(p.date)} cy={y(p.kg)} r={i === shown ? 4.5 : 3} />
      {/each}
      <path class="trend" d={trendPath} />
      <circle class="end" cx={x(points[shown].date)} cy={y(points[shown].trend)} r="5" />
      <text class="axis" x={pad.left} y={height - 6}>{shortDate(points[0].date)}</text>
      <text class="axis" x={width - pad.right} y={height - 6} text-anchor="end">{shortDate(last.date)}</text>
    </svg>
    <p class="readout small">
      <span class="strong">{formatDate(points[shown].date, 'short')}</span>
      <span class="num">{formatDecimal(points[shown].kg, 1, 1)} kg</span>,
      <span class="muted">Trend <span class="num">{formatDecimal(points[shown].trend, 1, 1)} kg</span></span>
    </p>
  {:else}
    <p class="small muted">Ab dem zweiten Wert siehst du hier deinen Verlauf.</p>
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

  .band {
    fill: var(--surface-2);
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

  .dot {
    fill: var(--text-3);
  }

  .dot.active {
    fill: var(--text);
  }

  .trend {
    fill: none;
    stroke: var(--accent-ink);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .end {
    fill: var(--accent-ink);
    stroke: var(--surface-1);
    stroke-width: 2;
  }

  .readout {
    margin-top: 6px;
  }

  .strong {
    font-weight: 600;
    margin-right: 4px;
  }
</style>
