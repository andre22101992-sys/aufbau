<script lang="ts">
  // Dein Rhythmus: Punkte für die Mahlzeiten von heute und eine Wochenübersicht. Ohne Vorwürfe.
  import { onMount } from 'svelte';
  import { mealsOf } from '../data/mealplan';
  import { WEEKDAYS_SHORT, addDays, todayKey, weekStart } from '../lib/dates';
  import { eatenTotals } from '../lib/dayfood';
  import { GOOD_DAY_MEALS, dots, weekRhythm } from '../lib/rhythm';
  import { app } from '../lib/state/app.svelte';
  import { loadWeek, meals } from '../lib/state/meals.svelte';
  import { planOptions } from '../lib/state/shop.svelte';

  const today = todayKey();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i));
  onMount(() => void loadWeek(dates.filter((d) => d <= today)));

  const options = $derived(planOptions());
  const plan = $derived(mealsOf(today, options));
  const done = $derived(meals.day?.done ?? {});
  const extras = $derived(meals.day?.extras ?? []);
  const dotList = $derived(dots(plan, done, extras));
  const finished = $derived(dotList.filter((d) => d.state === 'done').length);
  const eaten = $derived(eatenTotals(plan, done, extras));
  const week = $derived(weekRhythm(dates, { ...meals.week, ...(meals.day ? { [today]: meals.day } : {}) }));
  const goodDays = $derived(week.filter((d) => d.date <= today && d.level === 'good').length);
</script>

<section class="card stack">
  <div class="head">
    <h2>Dein Rhythmus</h2>
    <span class="small muted num">{finished} von {plan.length} heute</span>
  </div>
  <div class="dots" role="img" aria-label="{finished} von {plan.length} Mahlzeiten heute">
    {#each dotList as d (d.id)}<span class="dot {d.state}"></span>{/each}
  </div>
  <p class="small muted num">
    <span class="kcal">●</span> {Math.round(eaten.kcal).toLocaleString('de-DE')} / {app.settings.kcalTarget.toLocaleString('de-DE')} kcal
    &nbsp; <span class="protein">●</span> {Math.round(eaten.protein)} / {app.settings.proteinTarget} g
  </p>
  <div class="week">
    {#each week as d, i (d.date)}
      <div class="day">
        <span class="caption muted">{WEEKDAYS_SHORT[i]}</span>
        <span class="mark {d.date > today ? 'future' : d.level}" class:today={d.date === today}></span>
        <span class="caption muted num">{d.date <= today ? d.count : ''}</span>
      </div>
    {/each}
  </div>
  <p class="small muted">
    {goodDays === 0
      ? `Ein Tag mit mindestens ${GOOD_DAY_MEALS} Mahlzeiten ist ein guter Anfang.`
      : `${goodDays} ${goodDays === 1 ? 'Tag' : 'Tage'} mit mindestens ${GOOD_DAY_MEALS} Mahlzeiten diese Woche.`}
  </p>
</section>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .dots {
    display: flex;
    gap: 6px;
  }

  .dot {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: var(--surface-3);
  }

  .dot.done {
    background: var(--accent-ink);
  }

  .dot.next {
    box-shadow: inset 0 0 0 1.5px var(--accent-ink);
  }

  .kcal {
    color: var(--kcal);
  }

  .protein {
    color: var(--protein);
  }

  .week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    text-align: center;
  }

  .day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .mark {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--surface-3);
  }

  .mark.good {
    background: var(--accent-ink);
  }

  .mark.some {
    background: color-mix(in srgb, var(--accent-ink) 40%, var(--surface-3));
  }

  .mark.future {
    background: transparent;
    box-shadow: inset 0 0 0 1.5px var(--surface-3);
  }

  .mark.today {
    outline: 2px solid var(--text-3);
    outline-offset: 2px;
  }
</style>
