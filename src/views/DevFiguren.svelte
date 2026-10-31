<script lang="ts">
  // Nur in der Entwicklung: alle Übungs-Figuren auf einen Blick, zum Prüfen der Bewegungen.
  import ExerciseFigure from '../components/ExerciseFigure.svelte';
  import { EXERCISES } from '../data/exercises';
  import { musclesFor } from '../data/figures';

  const items = [
    ...EXERCISES.map((e) => ({ id: e.id, name: e.name, level: undefined as number | undefined })),
    { id: 'liegestuetze', name: 'Liegestütze, Hände auf dem Stuhl', level: 0 },
    { id: 'liegestuetze', name: 'Liegestütze, Füße auf dem Stuhl', level: 3 },
  ];
</script>

<div class="screen">
  <h1>Figuren</h1>
  <div class="grid">
    {#each items as item, i (i)}
      {@const exercise = EXERCISES.find((e) => e.id === item.id)!}
      <div>
        <ExerciseFigure exerciseId={item.id} name={item.name} primary={musclesFor(exercise).primary} level={item.level} />
        <p class="caption">{item.name}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
</style>
