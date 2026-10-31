<script lang="ts">
  // Karte für das heutige Training: starten, fortsetzen, erledigt, Ruhetag oder Start steht noch bevor.
  import { DAY_TITLES } from '../data/blocks';
  import { getExercise } from '../data/exercises';
  import type { DayId } from '../data/types';
  import { WEEKDAYS, diffDays, formatDate, todayKey, weekday } from '../lib/dates';
  import { feelingLabel } from '../lib/format';
  import type { WorkoutMode } from '../lib/model';
  import { plannedDay } from '../lib/plan';
  import { readiness } from '../lib/readiness';
  import { app } from '../lib/state/app.svelte';
  import { go } from '../lib/state/router.svelte';
  import { isDeloadWeek, slotsFor, startWorkout } from '../lib/state/workout.svelte';
  import { estimateMinutes } from '../lib/supersets';
  import { weekOverview } from '../lib/week';
  import Icon from './Icon.svelte';

  const today = todayKey();
  const planned = $derived(plannedDay(today, app.settings.startDate));
  const week = $derived(weekOverview(today, app.settings.startDate, app.workouts));
  const todayDone = $derived(week.find((d) => d.date === today && d.state === 'done'));
  const missed = $derived(week.filter((d) => d.state === 'missed'));
  const deload = $derived(isDeloadWeek(today));
  const slots = $derived(planned.dayId ? slotsFor(planned.block.id, planned.dayId, deload ? 'entlastung' : 'normal') : []);
  const minutes = $derived(estimateMinutes(slots, getExercise, app.settings.supersets));
  const shortMinutes = $derived(planned.dayId ? estimateMinutes(slotsFor(planned.block.id, planned.dayId, 'kurz'), getExercise, app.settings.supersets) : 0);
  const time = $derived(planned.dayId === 'fr' ? app.settings.times.trainingFr : app.settings.times.trainingMoDo);
  const daysToStart = $derived(app.settings.startDate ? diffDays(app.settings.startDate, today) : 0);
  const form = $derived(readiness(app.sleep.find((s) => s.date === today)?.hours ?? null, app.workouts.at(-1)?.feeling ?? null));
  const lighterMinutes = $derived(planned.dayId ? estimateMinutes(slotsFor(planned.block.id, planned.dayId, 'leicht'), getExercise, app.settings.supersets) : 0);

  function start(dayId: DayId, mode: WorkoutMode = 'normal'): void {
    startWorkout(dayId, mode);
    go('/training/aktiv');
  }

  const dayName = (dayId: DayId) => WEEKDAYS[['mo', 'di', 'mi', 'do', 'fr'].indexOf(dayId)];
</script>

{#if app.active}
  <div class="card-hero">
    <p class="small muted">Training läuft</p>
    <h2>{DAY_TITLES[app.active.dayId]}</h2>
    <a class="btn btn-primary btn-block go" href="#/training/aktiv">Weiter trainieren</a>
  </div>
{:else if planned.beforeStart && app.settings.startDate}
  <div class="card-hero">
    <p class="small muted">Dein Start</p>
    <h2>{daysToStart === 1 ? 'Morgen' : `In ${daysToStart} Tagen`} geht es los</h2>
    <p class="muted">Am Samstag kaufst du ein und kochst zum ersten Mal. Das erste Training ist am {formatDate(app.settings.startDate)}.</p>
  </div>
{:else if planned.dayId && !todayDone}
  <div class="card-hero">
    <p class="small muted">{WEEKDAYS[weekday(today)]}, {planned.block.name}, Woche {planned.week}</p>
    <h2 class="title">{DAY_TITLES[planned.dayId]}</h2>
    <p class="muted">{slots.length} Übungen, ca. {minutes} Minuten, geplant um {time}</p>
    {#if deload}
      <p class="pill pill-accent">Entlastungswoche: weniger Sätze</p>
    {/if}
    {#if form.suggest && !deload}
      <p class="form small"><Icon name="moon" size={18} /><span>{form.reason} Heute lieber die Kurzversion oder ein Satz weniger pro Übung? Du entscheidest.</span></p>
    {/if}
    <button class="btn btn-primary btn-block go" onclick={() => start(planned.dayId!)}>
      <Icon name="player-play" size={20} />Training starten
    </button>
    {#if form.suggest && !deload}
      <button class="btn btn-secondary btn-block" onclick={() => start(planned.dayId!, 'leicht')}>
        Ein Satz weniger, ca. {lighterMinutes} Min
      </button>
    {/if}
    <button class="btn btn-ghost btn-block" onclick={() => start(planned.dayId!, 'kurz')}>
      <Icon name="bolt" size={18} />Wenig Zeit? Kurzversion, ca. {shortMinutes} Min
    </button>
  </div>
{:else if todayDone}
  <div class="card-hero">
    <p class="small muted">Heute erledigt</p>
    <h2>{DAY_TITLES[todayDone.dayId]}</h2>
    {#if todayDone.workout?.feeling}
      <p class="muted">Gefühl: {feelingLabel(todayDone.workout.feeling)}. Erholung gehört jetzt dazu.</p>
    {/if}
  </div>
{:else}
  <div class="card-hero">
    <p class="small muted">{WEEKDAYS[weekday(today)]}</p>
    <h2>Ruhetag</h2>
    <p class="muted">Deine Muskeln wachsen in der Erholung. Genieß den freien Tag.</p>
  </div>
{/if}

{#if !app.active && missed.length > 0 && !planned.beforeStart}
  <div class="list">
    {#each missed as day (day.dayId)}
      <button class="row" onclick={() => start(day.dayId)}>
        <Icon name="arrow-back-up" />
        <span class="row-grow">
          <span class="small muted">Nachholen: {dayName(day.dayId)}</span><br />
          {DAY_TITLES[day.dayId]}
        </span>
        <Icon name="chevron-right" />
      </button>
    {/each}
  </div>
{/if}

<style>
  .card-hero {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .title {
    font-size: var(--fs-large);
  }

  .go {
    margin-top: 8px;
  }

  .pill {
    align-self: flex-start;
  }

  .form {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    background: var(--surface-2);
    border-radius: var(--radius-control);
    color: var(--text-2);
  }
</style>
