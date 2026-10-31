<script lang="ts">
  import { getExercise } from '../data/exercises';
  import Icon from '../components/Icon.svelte';
  import MorningCheck from '../components/MorningCheck.svelte';
  import NextMeal from '../components/NextMeal.svelte';
  import Rhythm from '../components/Rhythm.svelte';
  import TodayTraining from '../components/TodayTraining.svelte';
  import WeekStrip from '../components/WeekStrip.svelte';
  import { deloadAdvice, isStagnating } from '../lib/blocks';
  import { formatDate, todayKey, weekStart, weekday } from '../lib/dates';
  import { plannedDay } from '../lib/plan';
  import { trainingStreak } from '../lib/streaks';
  import { weekOverview } from '../lib/week';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { deloadKey, historyOf, isDeloadWeek, ladderFor } from '../lib/state/workout.svelte';

  const today = todayKey();
  const skipKey = `deload-skip:${weekStart(today)}`;

  const planned = $derived(plannedDay(today, app.settings.startDate));
  const week = $derived(weekOverview(today, app.settings.startDate, app.workouts));
  const streak = $derived(trainingStreak(app.workouts.map((w) => w.date), app.settings.startDate, today));
  const exerciseIds = $derived([...new Set(app.workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId)))]);
  const stagnating = $derived(exerciseIds.filter((id) => isStagnating(historyOf(id).map((h) => h.log), ladderFor(id))));
  const feelings = $derived([...app.workouts].reverse().map((w) => w.feeling ?? 3));
  const advice = $derived(
    app.workouts.length >= 3 && !isDeloadWeek(today) && app.overrides[skipKey] !== true
      ? deloadAdvice({ stagnatingCount: stagnating.length, feelings, week: planned.week, block: planned.block })
      : { suggest: false, reason: '' },
  );
  const backupDue = $derived(
    app.workouts.length >= 3 && (!app.settings.lastBackupAt || Date.now() - app.settings.lastBackupAt > 28 * 86_400_000),
  );

  async function startDeload(): Promise<void> {
    await setOverride(deloadKey(today), true);
    showToast('Diese Woche trainierst du mit weniger Sätzen.');
  }
</script>

<div class="screen">
  <header class="screen-head">
    <div>
      <p class="small muted">{formatDate(today)}</p>
      <h1>Heute</h1>
    </div>
    <a class="icon-btn" href="#/einstellungen" aria-label="Einstellungen"><Icon name="settings" /></a>
  </header>

  {#if weekday(today) === 5}
    <a class="card saturday" href="#/einkauf/samstag">
      <span class="row-grow"><strong>Samstags-Assistent</strong><br /><span class="small muted">Rückblick, Gerichte für die Woche, Einkaufsliste und Bon</span></span>
      <Icon name="chevron-right" />
    </a>
  {/if}

  <NextMeal />
  <Rhythm />
  <MorningCheck />

  <TodayTraining />

  {#if app.settings.startDate && !planned.beforeStart}
    <section class="card stack">
      <div class="week-head">
        <h2>Diese Woche</h2>
        {#if streak.count > 0}
          <span class="streak"><Icon name="flame" size={18} /><span class="num">{streak.count}</span> in Folge</span>
        {/if}
      </div>
      <WeekStrip days={week} />
      {#if streak.jokerUsed}
        <p class="small muted">Dein Joker für diese Woche ist verbraucht. Ein weiteres verpasstes Training beendet die Serie.</p>
      {:else if streak.count > 0}
        <p class="small muted">Ein verpasstes Training pro Woche ist okay, dafür hast du einen Joker. Ruhetage zählen nie dagegen.</p>
      {/if}
    </section>
  {/if}

  {#if advice.suggest}
    <section class="card stack">
      <h2>Eine leichtere Woche?</h2>
      <p class="muted">{advice.reason} Du machst dann 40 % weniger Sätze bei gleicher Technik.</p>
      <div class="cluster">
        <button class="btn btn-primary" onclick={startDeload}>Entlastungswoche starten</button>
        <button class="btn btn-ghost" onclick={() => setOverride(skipKey, true)}>Nicht jetzt</button>
      </div>
    </section>
  {:else if stagnating.length > 0}
    <section class="card stack">
      <h2>Hier geht es gerade nicht voran</h2>
      <p class="muted small">Seit 3 Trainings keine Steigerung. Probier eine andere Variante oder mach etwas längere Pausen.</p>
      <div class="list inner">
        {#each stagnating as id (id)}
          <a class="row" href="#/training/uebung/{id}"><span class="row-grow">{getExercise(id).name}</span><Icon name="chevron-right" /></a>
        {/each}
      </div>
    </section>
  {/if}

  {#if backupDue}
    <section class="card stack">
      <h2>Sichere deine Daten</h2>
      <p class="muted small">Alles liegt nur auf deinem iPhone. Löschst du das App-Symbol, sind die Daten weg. Ein Backup dauert ein paar Sekunden.</p>
      <a class="btn btn-secondary" href="#/einstellungen">Backup erstellen</a>
    </section>
  {/if}

  <section class="card soon">
    <p class="small muted">Dein Tagesablauf mit Mahlzeiten, Abend-Retter und Tipp des Tages kommt mit dem nächsten Update in diese Übersicht.</p>
  </section>
</div>

<style>
  .week-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .streak {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    color: var(--text);
  }

  .streak :global(.icon) {
    color: var(--kcal);
  }

  .inner {
    background: var(--surface-2);
  }

  .saturday {
    display: flex;
    align-items: center;
    gap: 10px;
    color: inherit;
    text-decoration: none;
    box-shadow: inset 3px 0 0 var(--accent-ink);
  }

  .soon {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }
</style>
