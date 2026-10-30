<script lang="ts">
  import { MUSCLE_LABELS, type Exercise } from '../data/types';
  import Icon from './Icon.svelte';

  interface Props {
    exercise: Exercise;
  }

  let { exercise }: Props = $props();
</script>

<div class="guide">
  <p class="muscles small muted">
    Trainiert vor allem {MUSCLE_LABELS[exercise.primary]}{#if exercise.secondary.length}, hilft mit: {exercise.secondary.map((m) => MUSCLE_LABELS[m]).join(', ')}{/if}.
    {#if exercise.unilateral}Wiederholungen zählen je Seite.{/if}
  </p>

  <section>
    <h3>So geht’s</h3>
    <ol>
      {#each exercise.cues as cue (cue)}<li>{cue}</li>{/each}
    </ol>
  </section>

  <section>
    <h3>Typische Fehler</h3>
    <ul>
      {#each exercise.mistakes as mistake (mistake)}<li>{mistake}</li>{/each}
    </ul>
  </section>

  {#if exercise.safety}
    <p class="safety small"><Icon name="shield-check" size={18} /><span>{exercise.safety}</span></p>
  {/if}
</div>

<style>
  .guide {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  h3 {
    margin-bottom: 6px;
  }

  ol,
  ul {
    margin: 0;
    padding-left: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  li::marker {
    color: var(--text-3);
  }

  .safety {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px 12px;
    background: var(--surface-2);
    border-radius: var(--radius-control);
    color: var(--text-2);
  }
</style>
