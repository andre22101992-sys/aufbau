<script lang="ts">
  import { DAY_TITLES } from '../data/blocks';
  import { getExercise } from '../data/exercises';
  import { DAY_IDS, type DayId } from '../data/types';
  import Icon from '../components/Icon.svelte';
  import MuscleChart from '../components/MuscleChart.svelte';
  import Sheet from '../components/Sheet.svelte';
  import TodayTraining from '../components/TodayTraining.svelte';
  import { WEEKDAYS, formatDate, formatDuration, todayKey } from '../lib/dates';
  import { feelingLabel, setsSummary } from '../lib/format';
  import type { Workout, WorkoutMode } from '../lib/model';
  import { doneMuscleSets, plannedMuscleSets } from '../lib/muscles';
  import { plannedDay, resolveSlots } from '../lib/plan';
  import { estimateMinutes } from '../lib/supersets';
  import { weekOverview, workoutsInWeek, type DayState } from '../lib/week';
  import { app } from '../lib/state/app.svelte';
  import { go } from '../lib/state/router.svelte';
  import { deleteSavedWorkout, slotsFor, startWorkout } from '../lib/state/workout.svelte';

  const today = todayKey();
  const planned = $derived(plannedDay(today, app.settings.startDate));
  const block = $derived(planned.block);
  const week = $derived(weekOverview(today, app.settings.startDate, app.workouts));
  const plannedSets = $derived(plannedMuscleSets(DAY_IDS.map((d) => resolveSlots(block.days[d], block.id, app.overrides))));
  const doneSets = $derived(doneMuscleSets(workoutsInWeek(app.workouts, today)));
  const history = $derived([...app.workouts].reverse().slice(0, 15));
  const exerciseIds = $derived([...new Set(DAY_IDS.flatMap((d) => resolveSlots(block.days[d], block.id, app.overrides).map((s) => s.exerciseId)))]);

  let sheetDay = $state<DayId | null>(null);
  let detail = $state<Workout | null>(null);
  let confirmDelete = $state(false);

  const minutesFor = (dayId: DayId) => estimateMinutes(slotsFor(block.id, dayId, 'normal'), getExercise, app.settings.supersets);

  const MODE_NOTES: Record<WorkoutMode, string> = {
    normal: '',
    kurz: ', Kurzversion',
    entlastung: ', leichte Woche',
    leicht: ', ein Satz weniger',
  };

  const stateText: Record<DayState, string> = {
    done: 'erledigt',
    today: 'heute',
    missed: 'verpasst',
    upcoming: '',
    beforeStart: 'vor dem Start',
  };

  function start(dayId: DayId, mode: WorkoutMode): void {
    sheetDay = null;
    startWorkout(dayId, mode);
    go('/training/aktiv');
  }

  async function remove(): Promise<void> {
    if (!detail) return;
    await deleteSavedWorkout(detail.id);
    detail = null;
    confirmDelete = false;
  }
</script>

<div class="screen">
  <header class="screen-head">
    <div>
      <p class="small muted">{block.name}, Woche {planned.week}</p>
      <h1>Training</h1>
    </div>
  </header>

  <TodayTraining />

  <h2 class="section-title">Wochenplan</h2>
  <div class="list">
    {#each week as day, i (day.dayId)}
      <button class="row" onclick={() => (sheetDay = day.dayId)}>
        <span class="state {day.state}" aria-hidden="true">
          {#if day.state === 'done'}<Icon name="check" size={16} />{/if}
        </span>
        <span class="row-grow">
          <span class="small muted">{WEEKDAYS[i]}{stateText[day.state] ? `, ${stateText[day.state]}` : ''}</span><br />
          {DAY_TITLES[day.dayId]}
        </span>
        <span class="small muted num">ca. {minutesFor(day.dayId)} Min</span>
        <Icon name="chevron-right" />
      </button>
    {/each}
  </div>

  <h2 class="section-title">Muskel-Übersicht</h2>
  <section class="card stack">
    <MuscleChart done={doneSets} planned={plannedSets} />
    <p class="caption muted">
      Sätze diese Woche. Kräftig: erledigt, hell: noch geplant, grauer Bereich: Ziel. Muskeln, die nur mitarbeiten, zählen halb.
    </p>
  </section>

  <h2 class="section-title">Übungen in {block.name}</h2>
  <div class="list">
    {#each exerciseIds as id (id)}
      <a class="row" href="#/training/uebung/{id}">
        <span class="row-grow">{getExercise(id).name}</span>
        <Icon name="chevron-right" />
      </a>
    {/each}
  </div>

  <h2 class="section-title">Letzte Trainings</h2>
  {#if history.length}
    <div class="list">
      {#each history as w (w.id)}
        <button class="row" onclick={() => (detail = w)}>
          <span class="row-grow">
            <span class="small muted">{formatDate(w.date, 'short')}{MODE_NOTES[w.mode]}</span><br />
            {DAY_TITLES[w.dayId]}
          </span>
          <span class="small muted num">{formatDuration((w.finishedAt ?? w.startedAt) - w.startedAt)}</span>
          <Icon name="chevron-right" />
        </button>
      {/each}
    </div>
  {:else}
    <p class="muted small">Noch keine Trainings. Dein erstes Training ist eine Einstufung: Die App merkt sich, was du schaffst, und schlägt danach die Steigerung vor.</p>
  {/if}
</div>

<Sheet open={sheetDay !== null} title={sheetDay ? DAY_TITLES[sheetDay] : ''} onclose={() => (sheetDay = null)}>
  {#if sheetDay}
    <div class="list plain">
      {#each slotsFor(block.id, sheetDay, 'normal') as slot, i (i)}
        {@const exercise = getExercise(slot.exerciseId)}
        <div class="row">
          <span class="row-grow">{exercise.name}{#if slot.superset}<span class="pill">Supersatz {slot.superset}</span>{/if}</span>
          <span class="small muted num">{slot.sets} × {slot.min}–{slot.max}{exercise.kind === 'time' ? ' s' : ''}</span>
        </div>
      {/each}
    </div>
    {#if app.active}
      <p class="small muted">Es läuft schon ein Training. Beende es zuerst.</p>
    {:else}
      <button class="btn btn-primary btn-block" onclick={() => start(sheetDay!, 'normal')}><Icon name="player-play" size={20} />Jetzt trainieren</button>
      <button class="btn btn-secondary btn-block" onclick={() => start(sheetDay!, 'kurz')}>
        <Icon name="bolt" size={18} />Kurzversion, ca. {estimateMinutes(slotsFor(block.id, sheetDay, 'kurz'), getExercise, app.settings.supersets)} Minuten
      </button>
    {/if}
  {/if}
</Sheet>

<Sheet open={detail !== null} title={detail ? `${DAY_TITLES[detail.dayId]}, ${formatDate(detail.date, 'short')}` : ''} onclose={() => { detail = null; confirmDelete = false; }}>
  {#if detail}
    {#if detail.feeling}<p class="muted">Gefühl: {feelingLabel(detail.feeling)}</p>{/if}
    <div class="list plain">
      {#each detail.exercises as log (log.slotIndex + log.exerciseId)}
        {@const exercise = getExercise(log.exerciseId)}
        <a class="row" href="#/training/uebung/{log.exerciseId}">
          <span class="row-grow">{exercise.name}<br /><span class="small muted">{setsSummary(log, exercise)}</span></span>
        </a>
      {/each}
    </div>
    {#if confirmDelete}
      <p class="small">Das Training wird endgültig gelöscht.</p>
      <div class="cluster">
        <button class="btn btn-danger" onclick={remove}>Ja, löschen</button>
        <button class="btn btn-ghost" onclick={() => (confirmDelete = false)}>Behalten</button>
      </div>
    {:else}
      <button class="btn btn-ghost" onclick={() => (confirmDelete = true)}>Training löschen</button>
    {/if}
  {/if}
</Sheet>

<style>
  .state {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--on-accent);
  }

  .state.done {
    background: var(--accent);
  }

  .state.today {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--accent-ink);
  }

  .state.missed {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--surface-3);
  }

  .plain {
    background: var(--surface-2);
  }

  .pill {
    margin-left: 8px;
  }
</style>
