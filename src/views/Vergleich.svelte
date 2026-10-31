<script lang="ts">
  // Zwei Check-ins vergleichen: Foto per Schieberegler, dazu die Maße im Vergleich.
  import { onDestroy } from 'svelte';
  import CompareSlider from '../components/CompareSlider.svelte';
  import Icon from '../components/Icon.svelte';
  import { MEASURES, POSES, withPhoto, type Pose } from '../lib/checkin';
  import { formatDate } from '../lib/dates';
  import { formatDecimal } from '../lib/numbers';
  import { getPhoto } from '../lib/repo';
  import { app } from '../lib/state/app.svelte';
  import { goBack } from '../lib/state/router.svelte';

  let pose = $state<Pose>('vorne');
  const options = $derived(withPhoto(app.checkins, pose));
  let beforeId = $state('');
  let afterId = $state('');
  let urls = $state<{ before: string; after: string } | null>(null);
  const owned: string[] = [];

  const before = $derived(app.checkins.find((e) => e.id === beforeId));
  const after = $derived(app.checkins.find((e) => e.id === afterId));

  // Standard: ältester und neuester Check-in mit Foto in dieser Pose
  $effect(() => {
    const list = options;
    if (list.length >= 2) {
      if (!list.some((e) => e.id === beforeId)) beforeId = list[list.length - 1].id;
      if (!list.some((e) => e.id === afterId)) afterId = list[0].id;
    }
  });

  $effect(() => {
    const b = before?.photos[pose];
    const a = after?.photos[pose];
    if (!b || !a) {
      urls = null;
      return;
    }
    let cancelled = false;
    void Promise.all([getPhoto(b), getPhoto(a)]).then(([bb, ab]) => {
      if (cancelled || !bb || !ab) return;
      const next = { before: URL.createObjectURL(bb), after: URL.createObjectURL(ab) };
      owned.push(next.before, next.after);
      urls = next;
    });
    return () => {
      cancelled = true;
    };
  });

  onDestroy(() => owned.forEach((u) => URL.revokeObjectURL(u)));

  const fmt = (v: number) => formatDecimal(v, 1, 1);
  const delta = (a: number, b: number) => `${b - a >= 0 ? '+' : '−'}${fmt(Math.abs(b - a))}`;
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/fortschritt')}><Icon name="chevron-left" /></button>
  </header>
  <h1>Fotos vergleichen</h1>

  <div class="poses" role="radiogroup" aria-label="Pose">
    {#each POSES as p (p.id)}
      <button role="radio" aria-checked={pose === p.id} class:selected={pose === p.id} onclick={() => (pose = p.id)}>{p.label}</button>
    {/each}
  </div>

  {#if options.length < 2}
    <p class="muted">Für den Vergleich brauchst du zwei Check-ins mit einem Foto in dieser Pose. Beim nächsten Check-in ist es so weit.</p>
  {:else}
    <div class="pick">
      <label class="field">
        <span>Vorher</span>
        <select class="input" bind:value={beforeId}>
          {#each options as e (e.id)}<option value={e.id}>{formatDate(e.date, 'short')}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Nachher</span>
        <select class="input" bind:value={afterId}>
          {#each options as e (e.id)}<option value={e.id}>{formatDate(e.date, 'short')}</option>{/each}
        </select>
      </label>
    </div>

    {#if urls && before && after}
      <CompareSlider before={urls.before} after={urls.after} beforeLabel={formatDate(before.date, 'short')} afterLabel={formatDate(after.date, 'short')} />
    {:else}
      <p class="small muted">Fotos werden geladen …</p>
    {/if}

    {#if before && after}
      <section class="card stack">
        <h2>Maße</h2>
        {#each MEASURES as m (m.key)}
          {@const a = before[m.key]}
          {@const b = after[m.key]}
          {#if a !== undefined && b !== undefined}
            <div class="line"><span>{m.label}</span><span class="num">{fmt(a)} → {fmt(b)} cm <span class="muted">({delta(a, b)})</span></span></div>
          {/if}
        {/each}
      </section>
    {/if}
  {/if}
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .poses {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 4px;
    background: var(--surface-1);
    border-radius: var(--radius-control);
  }

  .poses button {
    min-height: 40px;
    border-radius: 8px;
    color: var(--text-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }

  .poses button.selected {
    background: var(--surface-3);
    color: var(--text);
  }

  .pick {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
</style>
