<script lang="ts">
  import { getExercise } from '../data/exercises';
  import Icon from '../components/Icon.svelte';
  import { formatDate, todayKey } from '../lib/dates';
  import { performanceLabel } from '../lib/format';
  import { plannedDay } from '../lib/plan';
  import { bestOfLog, compare, type Performance } from '../lib/records';
  import { trainingStreak } from '../lib/streaks';
  import { app } from '../lib/state/app.svelte';
  import { ladderFor } from '../lib/state/workout.svelte';

  const today = todayKey();
  const streak = $derived(trainingStreak(app.workouts.map((w) => w.date), app.settings.startDate, today));
  const planned = $derived(plannedDay(today, app.settings.startDate));

  const records = $derived.by(() => {
    const best = new Map<string, { p: Performance; date: string }>();
    for (const w of app.workouts) {
      for (const log of w.exercises) {
        const p = bestOfLog(log, ladderFor(log.exerciseId));
        const current = best.get(log.exerciseId);
        if (p && (!current || compare(p, current.p) > 0)) best.set(log.exerciseId, { p, date: w.date });
      }
    }
    return [...best.entries()].map(([id, v]) => ({ id, ...v }));
  });
</script>

<div class="screen">
  <header class="screen-head">
    <h1>Fortschritt</h1>
  </header>

  <div class="stats">
    <div class="card stat">
      <span class="label small muted">Trainings</span>
      <span class="value">{app.workouts.length}</span>
    </div>
    <div class="card stat">
      <span class="label small muted">In Folge</span>
      <span class="value">{streak.count}</span>
    </div>
    <div class="card stat">
      <span class="label small muted">Woche</span>
      <span class="value">{planned.beforeStart ? 0 : planned.week}</span>
    </div>
  </div>

  <h2 class="section-title">Bestwerte je Übung</h2>
  {#if records.length}
    <div class="list">
      {#each records as r (r.id)}
        {@const exercise = getExercise(r.id)}
        <a class="row" href="#/training/uebung/{r.id}">
          <span class="row-grow">{exercise.name}<br /><span class="small muted">am {formatDate(r.date, 'short')}</span></span>
          <span class="num">{performanceLabel(r.p, ladderFor(r.id), exercise)}</span>
          <Icon name="chevron-right" />
        </a>
      {/each}
    </div>
  {:else}
    <p class="muted small">Nach deinem ersten Training stehen hier deine Bestwerte.</p>
  {/if}

  <section class="card soon">
    <p class="small muted">Gewicht mit Trendlinie, Check-ins mit Fotos, Erfolge und Wochenringe kommen mit den nächsten Updates.</p>
  </section>
</div>

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .value {
    font-family: var(--font-num);
    font-size: var(--fs-hero);
    font-weight: 700;
    line-height: 1.1;
  }

  .soon {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }
</style>
