<script lang="ts">
  // Muskelkarte von vorn und hinten: Hauptmuskel kräftig, helfende Muskeln heller.
  import { capsule, type Region, type Vec } from '../lib/figure';

  interface Props {
    primary: Region[];
    secondary: Region[];
  }

  let { primary, secondary }: Props = $props();

  type Part = [Region | 'base', string];

  const seg = (...items: [Vec, Vec, number, number][]) => items.map(([p, q, r1, r2]) => capsule(p, q, r1, r2)).join('');
  const circles = (...items: [number, number, number][]) => items.map(([x, y, r]) => `M${x - r},${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`).join('');
  const rects = (...items: [number, number, number, number, number][]) =>
    items.map(([x, y, w, h, r]) => `M${x + r},${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`).join('');

  const COMMON: Part[] = [
    ['base', circles([45, 14, 10])],
    ['base', rects([40, 22, 10, 8, 3])],
    ['base', `M33,186a6 3 0 1 0 12 0a6 3 0 1 0 -12 0ZM45,186a6 3 0 1 0 12 0a6 3 0 1 0 -12 0Z`],
    ['forearms', seg([[17, 82], [14, 108], 5, 4], [[73, 82], [76, 108], 5, 4])],
    ['base', circles([13, 114, 4], [77, 114, 4])],
  ];

  const FRONT: Part[] = [
    ...COMMON,
    ['delts', circles([25, 40, 8], [65, 40, 8])],
    ['chest', rects([28, 33, 16.5, 17, 5], [45.5, 33, 16.5, 17, 5])],
    ['abs', rects([36, 52, 18, 32, 5])],
    ['obliques', rects([29, 54, 6, 26, 3], [55, 54, 6, 26, 3])],
    ['biceps', seg([[21, 48], [18, 76], 6, 5], [[69, 48], [72, 76], 6, 5])],
    ['base', rects([30, 86, 30, 14, 6])],
    ['quads', seg([[37, 106], [36, 146], 9, 7], [[53, 106], [54, 146], 9, 7])],
    ['base', seg([[36, 153], [36, 182], 6, 4], [[54, 153], [54, 182], 6, 4])],
  ];

  const BACK: Part[] = [
    ...COMMON,
    ['traps', 'M36,24L54,24L64,36L26,36Z'],
    ['rdelts', circles([25, 40, 8], [65, 40, 8])],
    ['upper', rects([34, 37, 22, 13, 4])],
    ['lats', 'M28,40L35,50L38,74L31,70ZM62,40L55,50L52,74L59,70Z'],
    ['lower', rects([38, 60, 14, 24, 4])],
    ['triceps', seg([[21, 48], [18, 76], 6, 5], [[69, 48], [72, 76], 6, 5])],
    ['glutes', circles([39, 96, 8.5], [51, 96, 8.5])],
    ['hams', seg([[38, 110], [37, 146], 8, 7], [[52, 110], [53, 146], 8, 7])],
    ['calves', seg([[37, 153], [37, 180], 7, 4], [[53, 153], [53, 180], 7, 4])],
  ];

  const toneOf = (region: Region | 'base') => (region === 'base' ? 'base' : primary.includes(region) ? 'primary' : secondary.includes(region) ? 'secondary' : 'base');
</script>

<div class="map">
  {#each [{ parts: FRONT, label: 'vorn' }, { parts: BACK, label: 'hinten' }] as side (side.label)}
    <figure>
      <svg viewBox="0 0 90 192" aria-hidden="true">
        {#each side.parts as [region, d], i (i)}<path class={toneOf(region)} {d} />{/each}
      </svg>
      <figcaption class="caption muted">{side.label}</figcaption>
    </figure>
  {/each}
</div>

<style>
  .map {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  figure {
    margin: 0;
    text-align: center;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 150px;
  }

  .base {
    fill: var(--surface-3);
  }

  .primary {
    fill: var(--accent-ink);
  }

  .secondary {
    fill: color-mix(in srgb, var(--accent-ink) 45%, var(--surface-3));
  }
</style>
