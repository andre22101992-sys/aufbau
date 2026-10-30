<script lang="ts" module>
  export type TipTarget = 'hint' | 'ladder' | 'reps' | 'check' | null;
</script>

<script lang="ts">
  import { getExercise } from '../data/exercises';
  import { setsSummary } from '../lib/format';
  import type { IconName } from '../lib/icons';
  import { rungIndexOf } from '../lib/ladder';
  import type { WorkoutHint } from '../lib/model';
  import { noteKey } from '../lib/plan';
  import { app } from '../lib/state/app.svelte';
  import { addSet, historyOf, ladderFor, setReps, setRung, toggleSet } from '../lib/state/workout.svelte';
  import Icon from './Icon.svelte';
  import LadderPicker from './LadderPicker.svelte';
  import Stepper from './Stepper.svelte';

  interface Props {
    index: number;
    tip?: TipTarget;
    onguide: () => void;
    onswap: () => void;
  }

  let { index, tip = null, onguide, onswap }: Props = $props();

  const hintIcon: Record<WorkoutHint['kind'], IconName> = {
    start: 'info-circle',
    up: 'chart-line',
    down: 'arrow-back-up',
    same: 'check',
    maxed: 'trophy',
  };

  const active = $derived(app.active!);
  const log = $derived(active.exercises[index]);
  const slot = $derived(active.slots[index]);
  const hint = $derived(active.hints[index]);
  const exercise = $derived(getExercise(log.exerciseId));
  const ladder = $derived(ladderFor(log.exerciseId));
  const currentLoad = $derived((log.sets.find((s) => !s.done) ?? log.sets[log.sets.length - 1]).load);
  const rung = $derived(rungIndexOf(ladder, currentLoad));
  const previous = $derived(historyOf(log.exerciseId)[0]?.log);
  const previousDone = $derived(previous ? previous.sets.filter((s) => s.done) : []);
  const note = $derived(app.overrides[noteKey(log.exerciseId)] as string | undefined);
  const isTime = $derived(exercise.kind === 'time');
  const allDone = $derived(log.sets.every((s) => s.done));
</script>

<article class="exercise" class:complete={allDone}>
  <header>
    <div class="titles">
      <h3>{exercise.name}</h3>
      <p class="small muted">
        {log.sets.length} Sätze, {slot.min}–{slot.max} {isTime ? 'Sekunden' : 'Wiederholungen'}{exercise.unilateral ? ' je Seite' : ''}
      </p>
    </div>
    <button class="icon-btn" aria-label="Anleitung: {exercise.name}" onclick={onguide}><Icon name="info-circle" /></button>
    <button class="icon-btn" aria-label="{exercise.name} tauschen" onclick={onswap}><Icon name="arrows-exchange" /></button>
  </header>

  <p class="hint small" class:tip={tip === 'hint'}>
    <Icon name={hintIcon[hint.kind]} size={18} /><span>{hint.reason}</span>
  </p>
  {#if previous}
    <p class="small muted">Letztes Mal: {setsSummary(previous, exercise)}</p>
  {/if}
  {#if note}
    <p class="note small"><Icon name="notes" size={16} /><span>{note}</span></p>
  {/if}

  <div class="ladder" class:tip={tip === 'ladder'}>
    <LadderPicker {ladder} value={rung} disabled={allDone} onchange={(r) => setRung(index, r)} />
  </div>

  <div class="sets">
    <div class="set head" aria-hidden="true">
      <span>Satz</span>
      <span>Zuletzt</span>
      <span>{isTime ? 'Sekunden' : 'Wiederholungen'}</span>
      <span></span>
    </div>
    {#each log.sets as set, si (si)}
      <div class="set" class:done={set.done}>
        <span class="n num">{si + 1}</span>
        <span class="prev num">{previousDone[si] ? `${previousDone[si].reps}${isTime ? ' s' : ''}` : '–'}</span>
        <span class:tip={tip === 'reps' && si === 0}>
          <Stepper
            value={set.reps}
            label="Satz {si + 1}"
            step={isTime ? 5 : 1}
            max={isTime ? 600 : 100}
            unit={isTime ? 's' : ''}
            disabled={set.done}
            onchange={(v) => setReps(index, si, v)}
          />
        </span>
        <span class:tip={tip === 'check' && si === 0}>
          <button
            class="check"
            class:on={set.done}
            aria-pressed={set.done}
            aria-label={set.done ? `Satz ${si + 1} zurücknehmen` : `Satz ${si + 1} abhaken`}
            onclick={() => toggleSet(index, si)}
          >
            <Icon name="check" size={24} />
          </button>
        </span>
      </div>
    {/each}
  </div>
  <button class="btn btn-ghost add" onclick={() => addSet(index)}><Icon name="plus" size={18} />Satz hinzufügen</button>
</article>

<style>
  .exercise {
    background: var(--surface-1);
    border-radius: var(--radius-card);
    padding: 14px 14px 6px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  header {
    display: flex;
    align-items: flex-start;
    gap: 2px;
  }

  .titles {
    flex: 1;
    min-width: 0;
    padding-top: 2px;
  }

  .hint,
  .note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--text-2);
  }

  .hint :global(.icon) {
    color: var(--accent-ink);
    margin-top: 1px;
  }

  .note {
    padding: 8px 10px;
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }

  .sets {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .set {
    display: grid;
    grid-template-columns: 2.4em 3.2em 1fr 52px;
    align-items: center;
    gap: 8px;
  }

  .set.head {
    font-size: var(--fs-caption);
    color: var(--text-3);
  }

  .n {
    font-weight: 600;
    color: var(--text-2);
    text-align: center;
  }

  .prev {
    color: var(--text-3);
  }

  .set.done {
    opacity: 0.75;
  }

  .check {
    width: 52px;
    height: 48px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--text-3);
    transition: background-color 0.15s, color 0.15s, transform 0.12s;
  }

  .check:active {
    transform: scale(0.95);
  }

  .check.on {
    background: var(--accent);
    color: var(--on-accent);
  }

  .add {
    align-self: flex-start;
    font-size: var(--fs-small);
  }

  .complete {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-ink) 40%, transparent);
  }

  .tip {
    border-radius: 12px;
    box-shadow: 0 0 0 2px var(--accent);
  }
</style>
