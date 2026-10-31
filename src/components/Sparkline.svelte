<script lang="ts">
  // Kleine Verlaufslinie ohne Achsen, zum Vergleichen mehrerer Werte untereinander.

  interface Props {
    points: { date: string; value: number }[];
    width?: number;
    height?: number;
  }

  let { points, width = 84, height = 28 }: Props = $props();

  const pad = 4;
  const lo = $derived(Math.min(...points.map((p) => p.value)));
  const hi = $derived(Math.max(...points.map((p) => p.value)));
  const x = (i: number) => pad + (points.length <= 1 ? (width - 2 * pad) / 2 : (i / (points.length - 1)) * (width - 2 * pad));
  // Kleine Schwankungen sollen klein aussehen: mindestens 6 % des Wertes als Spannweite
  const mid = $derived((lo + hi) / 2);
  const span = $derived(Math.max(hi - lo, Math.abs(mid) * 0.06, 0.0001));
  const y = (v: number) => height / 2 - ((v - mid) / span) * (height - 2 * pad);
  const path = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' '));
</script>

<svg {width} {height} viewBox="0 0 {width} {height}" aria-hidden="true">
  {#if points.length > 1}<path d={path} />{/if}
  {#if points.length}<circle cx={x(points.length - 1)} cy={y(points[points.length - 1].value)} r="3.5" />{/if}
</svg>

<style>
  svg {
    flex: none;
    overflow: visible;
  }

  path {
    fill: none;
    stroke: var(--accent-ink);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  circle {
    fill: var(--accent-ink);
  }
</style>
