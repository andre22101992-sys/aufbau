<script lang="ts">
  import { onMount } from 'svelte';
  import { DAY_TITLES } from '../data/blocks';
  import { getExercise } from '../data/exercises';
  import { WARMUPS, WARMUP_SET_HINT } from '../data/warmups';
  import ExerciseCard, { type TipTarget } from '../components/ExerciseCard.svelte';
  import ExerciseGuide from '../components/ExerciseGuide.svelte';
  import Icon from '../components/Icon.svelte';
  import RestTimer from '../components/RestTimer.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { blockById } from '../lib/plan';
  import { formatDuration } from '../lib/dates';
  import { FEELINGS, performanceLabel } from '../lib/format';
  import { app, saveSettings } from '../lib/state/app.svelte';
  import { clock, useClock } from '../lib/state/clock.svelte';
  import { go } from '../lib/state/router.svelte';
  import { discardWorkout, finishWorkout, ladderFor, setWarmupDone, swapExercise, type FinishResult } from '../lib/state/workout.svelte';
  import { groupSlots } from '../lib/supersets';
  import { alternativesFor } from '../lib/swap';
  import { trainingStreak } from '../lib/streaks';
  import { keepScreenOn } from '../lib/wakelock';

  type Stage = 'workout' | 'saving' | 'summary';

  let stage = $state<Stage>('workout');
  let finishOpen = $state(false);
  let menuOpen = $state(false);
  let feeling = $state(4);
  let result = $state<FinishResult | null>(null);
  let guideIndex = $state<number | null>(null);
  let swapIndex = $state<number | null>(null);
  let tipStep = $state(app.settings.guidedWorkoutSeen ? -1 : 0);

  const TIPS: { target: Exclude<TipTarget, null>; title: string; text: string }[] = [
    { target: 'hint', title: 'Dein Vorschlag', text: 'Die App trägt Stufe und Wiederholungen schon ein. Beim ersten Training ist das eine Einstufung.' },
    { target: 'ladder', title: 'Stufe wählen', text: 'Passt das Gewicht nicht, tippst du auf einen anderen Balken der Stufen-Leiter.' },
    { target: 'reps', title: 'Wiederholungen eintragen', text: 'Mit − und + stellst du ein, wie viele saubere Wiederholungen du geschafft hast.' },
    { target: 'check', title: 'Satz abhaken', text: 'Der Haken speichert den Satz und startet die Pause. Am Ende der Pause kommt ein Ton.' },
  ];

  onMount(() => {
    void keepScreenOn(true);
    return () => void keepScreenOn(false);
  });

  $effect(() => useClock());

  $effect(() => {
    if (!app.active && stage === 'workout') go('/training', true);
  });

  const active = $derived(app.active);
  const groups = $derived(active ? groupSlots(active.slots, app.settings.supersets) : []);
  const elapsed = $derived(active ? clock.now - active.startedAt : 0);
  const allSets = $derived(active ? active.exercises.flatMap((e) => e.sets) : []);
  const doneSets = $derived(allSets.filter((s) => s.done).length);
  const warmup = $derived(active ? WARMUPS[blockById(active.blockId).days[active.dayId].warmup] : null);
  const tip = $derived(tipStep >= 0 && tipStep < TIPS.length ? TIPS[tipStep] : null);

  function endTips(): void {
    tipStep = -1;
    app.settings.guidedWorkoutSeen = true;
    saveSettings();
  }

  async function save(): Promise<void> {
    stage = 'saving';
    finishOpen = false;
    const r = await finishWorkout(feeling);
    if (!app.settings.guidedWorkoutSeen) endTips();
    result = r;
    stage = 'summary';
  }

  async function discard(): Promise<void> {
    menuOpen = false;
    await discardWorkout();
    go('/training', true);
  }

  const setCountLabel = (n: number) => `${n} ${n === 1 ? 'Satz' : 'Sätze'}`;

  const streak = $derived(
    result ? trainingStreak(app.workouts.map((w) => w.date), app.settings.startDate, result.workout.date) : { count: 0, jokerUsed: false },
  );
</script>

{#if stage === 'summary' && result}
  <div class="screen summary">
    <div class="trophy"><Icon name={result.records.length ? 'trophy' : 'circle-check'} size={44} /></div>
    <h1>Geschafft</h1>
    <p class="muted">
      {DAY_TITLES[result.workout.dayId]} in <span class="num">{formatDuration((result.workout.finishedAt ?? 0) - result.workout.startedAt)}</span>,
      {setCountLabel(result.workout.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0))}.
      {#if streak.count > 1}Das war Training Nummer {streak.count} in Folge.{/if}
    </p>
    {#if result.records.length}
      <h2 class="section-title">Neue Rekorde</h2>
      <div class="list">
        {#each result.records as record (record.exerciseId)}
          {@const exercise = getExercise(record.exerciseId)}
          <div class="row">
            <Icon name="trophy" />
            <span class="row-grow">{exercise.name}</span>
            <span class="num">{performanceLabel(record.performance, ladderFor(record.exerciseId), exercise)}</span>
          </div>
        {/each}
      </div>
    {:else}
      <p class="muted">Jedes Training zählt. Beim nächsten Mal schlägt die App dir die nächste Steigerung vor.</p>
    {/if}
    <button class="btn btn-primary btn-block" onclick={() => go('/heute')}>Zur Übersicht</button>
  </div>
{:else if active}
  <div class="screen workout">
    <header class="top">
      <button class="icon-btn" aria-label="Training im Hintergrund lassen" onclick={() => go('/training')}><Icon name="chevron-left" /></button>
      <div class="heading">
        <h1 class="title">{DAY_TITLES[active.dayId]}</h1>
        <p class="small muted"><span class="num">{formatDuration(elapsed)}</span>, {doneSets} von {allSets.length} Sätzen</p>
      </div>
      <button class="icon-btn" aria-label="Trainingsmenü" onclick={() => (menuOpen = true)}><Icon name="list-check" /></button>
    </header>

    {#if active.mode !== 'normal'}
      <p class="pill pill-accent mode">
        {active.mode === 'kurz' ? 'Wenig-Zeit-Modus: 3 Übungen mit je 2 Sätzen' : 'Entlastungswoche: weniger Sätze, gleiche Technik'}
      </p>
    {/if}

    {#if warmup}
      {#if !active.warmupDone}
        <section class="card warmup">
          <div>
            <h2>{warmup.title}</h2>
            <p class="small muted">etwa 5 Minuten</p>
          </div>
          <ul>
            {#each warmup.items as item (item.name)}
              <li>
                <span>{item.name}{#if item.detail}<br /><span class="muted small">{item.detail}</span>{/if}</span>
                <span class="num muted secs">{item.seconds} s</span>
              </li>
            {/each}
          </ul>
          <p class="small muted">{WARMUP_SET_HINT}</p>
          <button class="btn btn-secondary btn-block" onclick={() => setWarmupDone(true)}><Icon name="check" size={20} />Aufwärmen erledigt</button>
        </section>
      {:else}
        <button class="row warmup-done card" onclick={() => setWarmupDone(false)}>
          <Icon name="circle-check" /><span class="row-grow">Aufgewärmt</span><span class="small muted">anzeigen</span>
        </button>
      {/if}
    {/if}

    {#if tip}
      <div class="coach" role="status">
        <p><strong>{tip.title}</strong> <span class="muted small">{tipStep + 1} von {TIPS.length}</span></p>
        <p class="small">{tip.text}</p>
        <div class="coach-actions">
          <button class="btn btn-ghost" onclick={endTips}>Überspringen</button>
          <button class="btn btn-primary" onclick={() => (tipStep + 1 < TIPS.length ? (tipStep += 1) : endTips())}>
            {tipStep + 1 < TIPS.length ? 'Weiter' : 'Verstanden'}
          </button>
        </div>
      </div>
    {/if}

    {#each groups as group, gi (gi)}
      <div class="group" class:superset={group.superset}>
        {#if group.superset}
          <p class="ss-label small">Supersatz: im Wechsel, Pause erst nach beiden Übungen</p>
        {/if}
        {#each group.indices as index (index)}
          <ExerciseCard
            {index}
            tip={gi === 0 && index === group.indices[0] ? (tip?.target ?? null) : null}
            onguide={() => (guideIndex = index)}
            onswap={() => (swapIndex = index)}
          />
        {/each}
      </div>
    {/each}

    <button class="btn btn-primary btn-block finish" onclick={() => (finishOpen = true)} disabled={stage === 'saving'}>Training beenden</button>
  </div>

  <RestTimer />

  <Sheet open={guideIndex !== null} title={guideIndex !== null ? getExercise(active.exercises[guideIndex].exerciseId).name : ''} onclose={() => (guideIndex = null)}>
    {#if guideIndex !== null}
      {@const log = active.exercises[guideIndex]}
      <ExerciseGuide exercise={getExercise(log.exerciseId)} load={(log.sets.find((s) => !s.done) ?? log.sets[0])?.load} />
      <a class="btn btn-secondary" href="#/training/uebung/{active.exercises[guideIndex].exerciseId}">Verlauf und Notiz</a>
    {/if}
  </Sheet>

  <Sheet open={swapIndex !== null} title="Übung tauschen" onclose={() => (swapIndex = null)}>
    {#if swapIndex !== null}
      {@const current = getExercise(active.exercises[swapIndex].exerciseId)}
      <p class="muted small">Statt {current.name}. Gleicher Muskel, deine Ausrüstung. „Dauerhaft“ gilt für diesen Trainingstag im ganzen Block.</p>
      <div class="list">
        {#each alternativesFor(current.id) as alt (alt.id)}
          <div class="alt">
            <p>
              {alt.name}
              {#if alt.id === current.harder}<span class="pill pill-accent">schwerer</span>{/if}
            </p>
            <div class="alt-actions">
              <button class="btn btn-secondary" onclick={() => { swapExercise(swapIndex!, alt.id, false); swapIndex = null; }}>Nur heute</button>
              <button class="btn btn-secondary" onclick={() => { swapExercise(swapIndex!, alt.id, true); swapIndex = null; }}>Dauerhaft</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Sheet>

  <Sheet open={finishOpen} title="Wie war das Training?" onclose={() => (finishOpen = false)}>
    <div class="feelings" role="radiogroup" aria-label="Gefühl">
      {#each FEELINGS as label, i (label)}
        <button role="radio" aria-checked={feeling === i + 1} class:selected={feeling === i + 1} onclick={() => (feeling = i + 1)}>
          <span class="num big">{i + 1}</span><span class="small">{label}</span>
        </button>
      {/each}
    </div>
    {#if doneSets < allSets.length}
      <p class="small muted">{allSets.length - doneSets} Sätze sind nicht abgehakt. Die zählen nicht.</p>
    {/if}
    {#snippet footer()}
      <button class="btn btn-primary btn-block" onclick={save} disabled={doneSets === 0}>Training speichern</button>
    {/snippet}
  </Sheet>

  <Sheet open={menuOpen} title="Training" onclose={() => (menuOpen = false)}>
    <p class="small muted">Brichst du ab, wird dieses Training nicht gespeichert.</p>
    <button class="btn btn-danger btn-block" onclick={discard}>Training abbrechen</button>
  </Sheet>
{/if}

<style>
  .workout {
    padding-bottom: calc(120px + var(--safe-bottom));
  }

  .top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 -8px;
  }

  .heading {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: var(--fs-large);
  }

  .mode {
    align-self: flex-start;
  }

  .warmup {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .warmup ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .warmup li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .secs {
    white-space: nowrap;
    flex: none;
  }

  .warmup-done {
    border-radius: var(--radius-card);
  }

  .warmup-done :global(.icon) {
    color: var(--accent-ink);
  }

  .coach {
    background: var(--surface-2);
    border-radius: var(--radius-card);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: inset 0 0 0 1px var(--accent-ink);
  }

  .coach-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .superset {
    padding-left: 12px;
    border-left: 3px solid var(--accent-ink);
  }

  .ss-label {
    color: var(--text-2);
  }

  .finish {
    margin-top: 8px;
  }

  .alt {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
  }

  .alt .pill {
    margin-left: 6px;
  }

  .alt-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .alt-actions .btn {
    min-height: 42px;
    background: var(--surface-3);
  }

  .feelings {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }

  .feelings button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 2px;
    border-radius: 12px;
    background: var(--surface-2);
    color: var(--text-2);
    text-align: center;
  }

  .feelings button.selected {
    background: var(--accent);
    color: var(--on-accent);
  }

  .big {
    font-size: var(--fs-large);
    font-weight: 700;
  }

  .summary {
    align-items: stretch;
    text-align: left;
  }

  .trophy {
    width: 76px;
    height: 76px;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: var(--on-accent);
    margin-top: 24px;
    animation: pop 0.5s var(--ease-out);
  }

  @keyframes pop {
    0% {
      transform: scale(0.6);
      opacity: 0;
    }
    60% {
      transform: scale(1.08);
    }
  }
</style>
