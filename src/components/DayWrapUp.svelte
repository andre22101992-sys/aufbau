<script lang="ts">
  // Abends in „Heute“: ein ruhiger Rückblick auf den Essenstag und der Blick auf morgen.
  import { onMount } from 'svelte';
  import { mealsOf, mealTime } from '../data/mealplan';
  import { getRecipe } from '../data/recipes';
  import { addDays, todayKey } from '../lib/dates';
  import { eatenTotals } from '../lib/dayfood';
  import { mealCount, minutesOf } from '../lib/rhythm';
  import { app } from '../lib/state/app.svelte';
  import { clock, useClock } from '../lib/state/clock.svelte';
  import { loadWeek, meals } from '../lib/state/meals.svelte';
  import { planOptions } from '../lib/state/shop.svelte';
  import { WRAPUP_FROM_MINUTES, dayWrapUp } from '../lib/wrapup';

  const today = todayKey();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  onMount(() => {
    useClock();
    void loadWeek([yesterday]);
  });

  const options = $derived(planOptions());
  const plan = $derived(mealsOf(today, options));
  const day = $derived(meals.day);
  const first = $derived(mealsOf(tomorrow, options)[0]);
  const tomorrowFirst = $derived(first ? `${first.kind === 'dish' ? getRecipe(first.recipeId).name : first.name} um ${mealTime(first)}` : '');
  const visible = $derived(!!day && minutesOf(new Date(clock.now)) >= WRAPUP_FROM_MINUTES);
  const wrap = $derived(
    day
      ? dayWrapUp({
          today: mealCount(day),
          yesterday: meals.week[yesterday] ? mealCount(meals.week[yesterday]) : null,
          kcal: eatenTotals(plan, day.done, day.extras).kcal,
          kcalTarget: app.settings.kcalTarget,
          tomorrowFirst,
        })
      : null,
  );
</script>

{#if visible && wrap}
  <section class="card stack">
    <h2>{wrap.title}</h2>
    {#each wrap.lines as line (line)}<p class="small muted">{line}</p>{/each}
  </section>
{/if}
