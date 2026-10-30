<script lang="ts">
  import { EXERCISE_BY_ID } from '../data/exercises';
  import ExerciseGuide from '../components/ExerciseGuide.svelte';
  import Icon from '../components/Icon.svelte';
  import ProgressChart, { type ProgressPoint } from '../components/ProgressChart.svelte';
  import { formatDate } from '../lib/dates';
  import { performanceLabel, progressValue, setsSummary } from '../lib/format';
  import type { Rung } from '../lib/ladder';
  import { formatDecimal } from '../lib/numbers';
  import { noteKey } from '../lib/plan';
  import { bestOfLog, compare, type Performance } from '../lib/records';
  import { alternativesFor } from '../lib/swap';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { goBack } from '../lib/state/router.svelte';
  import { historyOf, ladderFor } from '../lib/state/workout.svelte';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  const exercise = $derived(EXERCISE_BY_ID[id]);
  const ladder = $derived<Rung[]>(exercise ? ladderFor(id) : []);
  const history = $derived(exercise ? historyOf(id) : []);

  const points = $derived.by<ProgressPoint[]>(() => {
    if (!exercise) return [];
    const result: ProgressPoint[] = [];
    for (const { date, log } of [...history].reverse()) {
      const value = progressValue(log, ladder);
      const best = bestOfLog(log, ladder);
      if (value === null || !best) continue;
      result.push({ date, value, label: performanceLabel(best, ladder, exercise), detail: setsSummary(log, exercise) });
    }
    return result;
  });

  const best = $derived.by<{ p: Performance; date: string } | null>(() => {
    let top: { p: Performance; date: string } | null = null;
    for (const { date, log } of history) {
      const p = bestOfLog(log, ladder);
      if (p && (!top || compare(p, top.p) > 0)) top = { p, date };
    }
    return top;
  });

  let note = $state('');
  let noteLoadedFor = '';
  $effect(() => {
    if (noteLoadedFor !== id) {
      noteLoadedFor = id;
      note = (app.overrides[noteKey(id)] as string | undefined) ?? '';
    }
  });

  async function saveNote(): Promise<void> {
    await setOverride(noteKey(id), note.trim());
    showToast(note.trim() ? 'Notiz gespeichert' : 'Notiz gelöscht');
  }

  function tickLabel(rung: number): string {
    const r = ladder[rung];
    if (!r) return '';
    if (r.load.kind === 'kg') {
      if (r.load.tech === 'langsam') return 'langsam';
      if (r.load.tech === 'pause') return 'Pause';
      return r.load.kg === 0 ? 'ohne' : `${formatDecimal(r.load.kg)} kg`;
    }
    return `Stufe ${rung + 1}`;
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/training')}><Icon name="chevron-left" /></button>
  </header>

  {#if !exercise}
    <h1>Übung nicht gefunden</h1>
    <a class="btn btn-secondary" href="#/training">Zum Training</a>
  {:else}
    <h1 class="name">{exercise.name}</h1>

    {#if best}
      <p class="muted">Bestwert: <strong class="num">{performanceLabel(best.p, ladder, exercise)}</strong>, am {formatDate(best.date, 'short')}</p>
    {/if}

    <section class="card">
      <h2 class="chart-title">Verlauf</h2>
      {#if points.length >= 2}
        <ProgressChart {points} {tickLabel} />
      {:else if points.length === 1}
        <p class="muted small">Ein Training eingetragen: {points[0].label}. Ab dem zweiten Training siehst du hier, wie du die Stufen-Leiter hochkletterst.</p>
      {:else}
        <p class="muted small">Noch keine Einträge. Nach dem ersten Training siehst du hier deinen Verlauf.</p>
      {/if}
    </section>

    <section class="card">
      <ExerciseGuide {exercise} />
    </section>

    <section class="card stack">
      <label class="field">
        <span class="small muted">Deine Notiz, erscheint bei jedem Training</span>
        <textarea class="input note" rows="2" bind:value={note} placeholder="Stuhl an die Wand stellen"></textarea>
      </label>
      <button class="btn btn-secondary" onclick={saveNote}>Notiz speichern</button>
    </section>

    {#if history.length}
      <h2 class="section-title">Alle Einträge</h2>
      <div class="list">
        {#each history as entry, i (i)}
          <div class="row">
            <span class="small muted date">{formatDate(entry.date, 'short')}</span>
            <span class="row-grow small">{setsSummary(entry.log, exercise)}</span>
          </div>
        {/each}
      </div>
    {/if}

    <h2 class="section-title">Alternativen</h2>
    <div class="list">
      {#each alternativesFor(exercise.id) as alt (alt.id)}
        <a class="row" href="#/training/uebung/{alt.id}">
          <span class="row-grow">{alt.name}{#if alt.id === exercise.harder}<span class="pill pill-accent">schwerer</span>{/if}</span>
          <Icon name="chevron-right" />
        </a>
      {/each}
    </div>
    <p class="caption muted">Tauschen kannst du direkt im Training über das Tausch-Symbol an der Übung.</p>
  {/if}
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .name {
    font-size: var(--fs-large);
  }

  .chart-title {
    margin-bottom: 8px;
  }

  .note {
    min-height: 72px;
    padding: 12px 14px;
    resize: vertical;
  }

  .date {
    width: 5.6em;
    flex: none;
  }

  .pill {
    margin-left: 8px;
  }
</style>
