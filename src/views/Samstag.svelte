<script lang="ts">
  // Samstags-Assistent: Rückblick → Wochen-Coach → Gerichte mit Rezept der Woche → Vorrat und Liste → Bon.
  import { onMount } from 'svelte';
  import AiBridge from '../components/AiBridge.svelte';
  import Icon from '../components/Icon.svelte';
  import { BASE_RECIPES, getRecipe } from '../data/recipes';
  import { dinnerKey, dinnerOf } from '../data/mealplan';
  import { WEEKDAYS_SHORT, addDays, diffDays, todayKey, weekday } from '../lib/dates';
  import { coachPrompt, type WeekSummary } from '../lib/ai/prompts';
  import { intakeSummary } from '../lib/intake';
  import { formatDecimal } from '../lib/numbers';
  import { shoppingDay } from '../lib/shopping';
  import { formatSleep } from '../lib/sleep';
  import { ratingKey, suggestFor } from '../lib/suggest';
  import { trendSeries, weeklyAverages } from '../lib/trend';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { loadWeek, meals } from '../lib/state/meals.svelte';
  import { goBack } from '../lib/state/router.svelte';
  import { planOptions } from '../lib/state/shop.svelte';

  const today = todayKey();
  const day = shoppingDay(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(day, i));

  // Die letzten 7 Tage vor heute: Was du wirklich gegessen hast
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -(i + 1)));
  onMount(() => void loadWeek(last7));
  const intake = $derived(intakeSummary(last7, meals.week, planOptions()));

  const summary = $derived.by((): WeekSummary => {
    const recent = app.workouts.filter((w) => diffDays(today, w.date) < 7);
    const weeks = weeklyAverages(app.weights);
    const last = weeks.at(-1);
    const previous = weeks.at(-2);
    const nights = app.sleep.filter((s) => diffDays(today, s.date) < 7);
    return {
      trainings: recent.length,
      planned: 5,
      weightChange: last && previous ? last.avg - previous.avg : null,
      trend: trendSeries(app.weights).at(-1)?.trend ?? null,
      sleepAvg: nights.length ? nights.reduce((s, n) => s + n.hours, 0) / nights.length : null,
      kcalTarget: app.settings.kcalTarget,
      feelings: recent.map((w) => w.feeling).filter((f): f is number => !!f),
      intakeKcal: intake.avgKcal,
      intakeProtein: intake.avgProtein,
      goodDays: intake.goodDays,
    };
  });

  let coach = $state('');

  // Rezept der Woche: ein Gericht aus der Sammlung, das du noch nicht bewertet hast, am Mittwoch
  const tryDay = $derived(days.find((d) => weekday(d) === 2) ?? days[4]);
  const recipeOfWeek = $derived(
    suggestFor(tryDay, app.overrides).find((s) => !BASE_RECIPES.includes(s.recipe.id) && app.overrides[ratingKey(s.recipe.id)] === undefined)?.recipe,
  );
  const planned = $derived(days.some((d) => recipeOfWeek && dinnerOf(d, app.overrides) === recipeOfWeek.id));

  async function tryIt(): Promise<void> {
    if (!recipeOfWeek) return;
    await setOverride(dinnerKey(tryDay), recipeOfWeek.id);
    showToast(`${recipeOfWeek.name} am Mittwoch eingeplant`);
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/heute')}><Icon name="chevron-left" /></button>
  </header>
  <h1>Samstags-Assistent</h1>
  <p class="muted">In fünf Schritten durch die Woche: zurückblicken, planen, einkaufen.</p>

  <h2 class="section-title">1. Deine Woche</h2>
  <section class="card stats">
    <div><span class="small muted">Trainings</span><p class="num strong">{summary.trainings} von 5</p></div>
    <div>
      <span class="small muted">Gewicht</span>
      <p class="num strong">{summary.weightChange !== null ? `${summary.weightChange >= 0 ? '+' : '−'}${formatDecimal(Math.abs(summary.weightChange), 1, 1)} kg` : '–'}</p>
    </div>
    <div><span class="small muted">Schlaf</span><p class="num strong">{summary.sleepAvg !== null ? formatSleep(summary.sleepAvg) : '–'}</p></div>
    <div>
      <span class="small muted">Essen pro Tag</span>
      <p class="num strong">{intake.avgKcal !== null ? `${Math.round(intake.avgKcal).toLocaleString('de-DE')} kcal` : '–'}</p>
    </div>
  </section>

  <h2 class="section-title">2. Wochen-Coach</h2>
  <section class="card stack">
    <p class="small muted">Kurze Tipps über Apple Intelligence oder eine ausführliche Auswertung über Claude. Mitgeschickt werden nur die Zahlen oben.</p>
    <AiBridge prompt={coachPrompt(summary)} shortPrompt={coachPrompt(summary, true)} onanswer={(t) => (coach = t.trim())} />
    {#if coach}<p class="coach">{coach}</p>{/if}
  </section>

  <h2 class="section-title">3. Gerichte für die neue Woche</h2>
  <div class="list">
    {#each days as d (d)}
      <a class="row" href="#/essen/rezept/{dinnerOf(d, app.overrides)}">
        <span class="day small num">{WEEKDAYS_SHORT[weekday(d)]}</span>
        <span class="row-grow">{getRecipe(dinnerOf(d, app.overrides)).name}</span>
        <Icon name="chevron-right" />
      </a>
    {/each}
  </div>
  <p class="small muted">Tauschen kannst du im Essen-Tab mit einem Tipp auf den Tag.</p>
  {#if recipeOfWeek}
    <section class="card stack">
      <p class="small muted">Rezept der Woche</p>
      <h3>{recipeOfWeek.name}</h3>
      {#if planned}
        <p class="small">Ist eingeplant. Bewerte es nach dem Kochen mit „Schmeckt mir“, dann kommt es öfter.</p>
      {:else}
        <div class="cluster">
          <button class="btn btn-primary" onclick={tryIt}>Am Mittwoch ausprobieren</button>
          <a class="btn btn-ghost" href="#/essen/rezept/{recipeOfWeek.id}">Ansehen</a>
        </div>
      {/if}
    </section>
  {/if}

  <h2 class="section-title">4. Vorrat und Einkaufsliste</h2>
  <a class="btn btn-secondary btn-block" href="#/einkauf"><Icon name="shopping-cart" size={20} />Zur Einkaufsliste</a>

  <h2 class="section-title">5. Nach dem Einkauf</h2>
  <a class="btn btn-secondary btn-block" href="#/einkauf/bon"><Icon name="list-check" size={20} />Bon übernehmen</a>
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 8px;
  }

  .strong {
    font-weight: 600;
    font-size: var(--fs-title);
  }

  .coach {
    white-space: pre-wrap;
    padding: 10px 12px;
    background: var(--surface-2);
    border-radius: var(--radius-control);
  }

  .day {
    width: 1.8em;
    color: var(--text-2);
    font-weight: 600;
  }
</style>
