<script lang="ts">
  import { animationFor } from '../data/animations';
  import { START_LOADS } from '../data/exercises';
  import { musclesFor } from '../data/figures';
  import { MUSCLE_LABELS, type Exercise } from '../data/types';
  import type { Load } from '../lib/model';
  import { historyOf } from '../lib/state/workout.svelte';
  import ExerciseFigure from './ExerciseFigure.svelte';
  import Icon from './Icon.svelte';
  import MuscleMap from './MuscleMap.svelte';

  interface Props {
    exercise: Exercise;
    /** aktuelle Belastung; ohne Angabe die letzte aus dem Verlauf */
    load?: Load;
  }

  let { exercise, load }: Props = $props();

  const muscles = $derived(musclesFor(exercise));
  const current = $derived.by((): Load | undefined => {
    if (load) return load;
    const last = historyOf(exercise.id)[0]?.log.sets[0]?.load;
    if (last) return last;
    const start = START_LOADS[exercise.id];
    return start?.level !== undefined ? { kind: 'level', level: start.level } : undefined;
  });
  const level = $derived(current?.kind === 'level' ? current.level : undefined);
  const tech = $derived(current?.kind === 'kg' ? current.tech : undefined);
  const animation = $derived(animationFor(exercise.id, level));
  // Animierte Bilder lassen sich nicht anhalten; mit „Bewegung reduzieren“ zeigt die Figur Start und Ende
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const videoUrl = $derived(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} Übung richtige Ausführung`)}`);
</script>

<div class="guide">
  {#if animation && !reduced}
    <img class="anim" src={animation} alt="So geht {exercise.name}" />
    <div class="map-row">
      <MuscleMap primary={muscles.primary} secondary={muscles.secondary} />
    </div>
  {:else}
    <div class="visual">
      <ExerciseFigure exerciseId={exercise.id} name={exercise.name} primary={muscles.primary} {level} {tech} />
      <MuscleMap primary={muscles.primary} secondary={muscles.secondary} />
    </div>
  {/if}

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

  <a class="btn btn-ghost video" href={videoUrl} target="_blank" rel="noopener noreferrer">
    <Icon name="player-play" size={18} />Videos bei YouTube suchen
  </a>
  <p class="caption muted">Braucht Internet. Die Videos stammen von fremden Kanälen.</p>
</div>

<style>
  .guide {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .visual {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
    gap: 8px;
    align-items: center;
  }

  .anim {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--radius-control);
    background: var(--surface-2);
  }

  .map-row {
    width: 44%;
    margin: 0 auto;
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

  .video {
    align-self: flex-start;
  }

  .caption {
    margin-top: -10px;
  }
</style>
