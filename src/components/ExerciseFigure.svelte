<script lang="ts">
  // Die Figur macht die Übung im Tempo der Stufe vor. Mit „Bewegung reduzieren“ zeigt sie Start und Ende als feste Bilder.
  import { onMount } from 'svelte';
  import { figureFor } from '../data/figures';
  import { VIEW_H, VIEW_W, drawFigure, poseAt, solve, type FigureDef, type Region } from '../lib/figure';
  import type { Technique } from '../lib/model';

  interface Props {
    exerciseId: string;
    name: string;
    primary: Region[];
    level?: number;
    tech?: Technique;
  }

  let { exerciseId, name, primary, level, tech }: Props = $props();

  const def = $derived(figureFor(exerciseId, level));

  let p = $state(0);
  let reduced = $state(false);
  let el = $state<HTMLDivElement>();

  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

  /** Sekunden: zum Ende, am Ende halten, zurück, am Start halten */
  function timing(d: FigureDef): [number, number, number, number] {
    const lower = tech === 'langsam' ? 3 : 2;
    const lift = 1;
    const atEnd = tech === 'pause' ? 1.5 : (d.levelHolds?.[level ?? 0] ?? (d.lowerFirst ? 0.3 : 0.4));
    return d.lowerFirst ? [lower, atEnd, lift, 0.6] : [lift, atEnd, lower, 0.6];
  }

  function phaseAt(t: number, [a, b, c, d]: [number, number, number, number]): number {
    const time = t % (a + b + c + d);
    if (time < a) return ease(time / a);
    if (time < a + b) return 1;
    if (time < a + b + c) return 1 - ease((time - a - b) / c);
    return 0;
  }

  onMount(() => {
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    if (el) observer.observe(el);
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      if (def && !def.hold && visible && !document.hidden) p = phaseAt((now - start) / 1000, timing(def));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  });

  const shapesAt = (d: FigureDef, at: number) => drawFigure(d, solve(d, poseAt(d, at)), primary);
  const live = $derived(def ? shapesAt(def, p) : []);
</script>

<div class="figure" bind:this={el}>
  {#if def}
    {#if reduced && !def.hold}
      <div class="pair">
        {#each [0, 1] as at (at)}
          <figure>
            <svg viewBox="0 0 {VIEW_W} {VIEW_H}" role="img" aria-label="{name}, {at === 0 ? 'Start' : 'Ende'}">
              {#each shapesAt(def, at) as shape, i (i)}<path class={shape.tone} d={shape.d} />{/each}
            </svg>
            <figcaption class="caption muted">{at === 0 ? 'Start' : 'Ende'}</figcaption>
          </figure>
        {/each}
      </div>
    {:else}
      <svg viewBox="0 0 {VIEW_W} {VIEW_H}" role="img" aria-label="So geht {name}">
        {#each live as shape, i (i)}<path class={shape.tone} d={shape.d} />{/each}
      </svg>
    {/if}
  {/if}
</div>

<style>
  .figure {
    background: var(--surface-2);
    border-radius: var(--radius-control);
    padding: 6px;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  figure {
    margin: 0;
    text-align: center;
  }

  .floor {
    fill: var(--line-strong);
  }

  .prop {
    fill: var(--surface-3);
  }

  .mat {
    fill: var(--surface-3);
  }

  .far {
    fill: color-mix(in srgb, var(--text-2) 45%, var(--surface-2));
  }

  .body {
    fill: var(--text-2);
  }

  .hi {
    fill: var(--accent-ink);
  }

  .eq {
    fill: var(--text);
  }

  .eqDark {
    fill: var(--surface-2);
  }
</style>
