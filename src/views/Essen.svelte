<script lang="ts">
  // Essen: oben heute mit Ringen und Mahlzeiten zum Abhaken, darunter Wochenplan und Rezepte.
  import Icon from '../components/Icon.svelte';
  import Rings from '../components/Rings.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { dinnerOf, mealsOf, mealTime, type PlanMeal } from '../data/mealplan';
  import { RECIPES, getRecipe } from '../data/recipes';
  import { WEEKDAYS_SHORT, addDays, formatDate, todayKey, weekStart } from '../lib/dates';
  import { dayPlanNutrients, mealNutrients, portionOf, totalMinutes } from '../lib/nutrition';
  import { formatDecimal, parseDecimal } from '../lib/numbers';
  import { app, showToast } from '../lib/state/app.svelte';
  import { addExtra, loadDay, meals, removeExtra, setPortion } from '../lib/state/meals.svelte';

  const today = todayKey();
  void loadDay(today);

  const plan = $derived(mealsOf(today));
  const done = $derived(meals.day?.done ?? {});
  const extras = $derived(meals.day?.extras ?? []);

  const eaten = $derived.by(() => {
    let kcal = 0;
    let protein = 0;
    for (const meal of plan) {
      const portion = done[meal.id];
      if (!portion) continue;
      const n = mealNutrients(meal);
      kcal += n.kcal * portion;
      protein += n.protein * portion;
    }
    for (const e of extras) {
      kcal += e.kcal;
      protein += e.protein;
    }
    return { kcal, protein };
  });

  const planned = $derived(dayPlanNutrients(today));
  const week = $derived(Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i)));
  const weekCost = $derived(week.reduce((sum, d) => sum + dayPlanNutrients(d).euro, 0));

  const title = (meal: PlanMeal) => (meal.kind === 'dish' ? getRecipe(meal.recipeId).name : meal.name);
  const note = (meal: PlanMeal) => {
    if (meal.kind === 'dish') return meal.leftover ? 'Zweite Portion von gestern, dampfend heiß aufwärmen' : 'Doppelte Menge kochen, eine Portion für morgen';
    if (meal.id === 'oats' && app.settings.creatine) return 'Mit 3–5 g Kreatin';
    return '';
  };

  // Extras
  let extraOpen = $state(false);
  let extraKcal = $state('');
  let extraProtein = $state('');
  const QUICK = [
    { label: '250 ml Milch', kcal: 160, protein: 8 },
    { label: 'Banane', kcal: 115, protein: 1 },
    { label: '2 Eier', kcal: 170, protein: 15 },
    { label: 'Kleiner Snack', kcal: 200, protein: 3 },
    { label: 'Süßes', kcal: 250, protein: 3 },
    { label: 'Döner', kcal: 700, protein: 35 },
  ];

  function quick(item: { label: string; kcal: number; protein: number }): void {
    addExtra(item.label, item.kcal, item.protein);
    extraOpen = false;
    showToast(`${item.label} eingetragen`);
  }

  function custom(): void {
    const kcal = parseDecimal(extraKcal);
    if (kcal === null || kcal <= 0) {
      showToast('Trag die Kalorien als Zahl ein, zum Beispiel 300.');
      return;
    }
    addExtra('Eigener Eintrag', Math.round(kcal), Math.round(parseDecimal(extraProtein) ?? 0));
    extraKcal = '';
    extraProtein = '';
    extraOpen = false;
  }

  const PORTIONS = [0.5, 1, 1.5];
</script>

<div class="screen">
  <header class="screen-head">
    <div>
      <p class="small muted">{formatDate(today)}</p>
      <h1>Essen</h1>
    </div>
  </header>

  <section class="card rings-card">
    <Rings
      rings={[
        { value: eaten.kcal, target: app.settings.kcalTarget, color: 'var(--kcal)' },
        { value: eaten.protein, target: app.settings.proteinTarget, color: 'var(--protein)' },
      ]}
    />
    <div class="totals small">
      <p><span class="dot kcal"></span><span class="num strong">{Math.round(eaten.kcal).toLocaleString('de-DE')}</span> / {app.settings.kcalTarget.toLocaleString('de-DE')} kcal</p>
      <p><span class="dot protein"></span><span class="num strong">{Math.round(eaten.protein)}</span> / {app.settings.proteinTarget} g Protein</p>
      <p class="muted">Geplant heute: {Math.round(planned.kcal).toLocaleString('de-DE')} kcal, {Math.round(planned.protein)} g</p>
    </div>
  </section>

  <div class="list">
    {#each plan as meal (meal.id)}
      {@const n = mealNutrients(meal)}
      {@const portion = done[meal.id]}
      <div class="row meal" class:checked={!!portion}>
        <button
          class="check"
          aria-label={portion ? `${title(meal)}: nicht gegessen` : `${title(meal)}: gegessen`}
          aria-pressed={!!portion}
          onclick={() => setPortion(meal.id, portion ? null : 1)}
        >
          {#if portion}<Icon name="check" size={16} />{/if}
        </button>
        <span class="row-grow">
          <span class="small muted num">{mealTime(meal)}</span>
          {title(meal)}<br />
          <span class="small muted">{Math.round(n.kcal)} kcal, {Math.round(n.protein)} g{note(meal) ? `. ${note(meal)}` : ''}</span>
          {#if meal.kind === 'dish' && !meal.leftover}
            <br /><a class="small cook" href="#/essen/rezept/{meal.recipeId}">Rezept und Kochmodus</a>
          {/if}
        </span>
        {#if portion}
          <span class="portions" role="group" aria-label="Portion">
            {#each PORTIONS as p (p)}
              <button class:selected={portion === p} onclick={() => setPortion(meal.id, p)}>{p === 0.5 ? '½' : p === 1.5 ? '1½' : '1'}</button>
            {/each}
          </span>
        {/if}
      </div>
    {/each}
    {#each extras as extra (extra.id)}
      <div class="row meal checked">
        <span class="check on"><Icon name="plus" size={16} /></span>
        <span class="row-grow">{extra.label}<br /><span class="small muted">{extra.kcal} kcal, {extra.protein} g</span></span>
        <button class="icon-btn" aria-label="{extra.label} entfernen" onclick={() => removeExtra(extra.id)}><Icon name="x" size={18} /></button>
      </div>
    {/each}
  </div>
  <button class="btn btn-secondary" onclick={() => (extraOpen = true)}><Icon name="plus" size={18} />Extra eintragen</button>

  <h2 class="section-title">Diese Woche</h2>
  <div class="list">
    {#each week as date, i (date)}
      {@const recipe = getRecipe(dinnerOf(date))}
      {@const day = dayPlanNutrients(date)}
      <a class="row" class:today={date === today} href="#/essen/rezept/{recipe.id}">
        <span class="day small num">{WEEKDAYS_SHORT[i]}</span>
        <span class="row-grow">{recipe.name}<br /><span class="small muted">Tag: {Math.round(day.kcal).toLocaleString('de-DE')} kcal, {Math.round(day.protein)} g Protein</span></span>
        <Icon name="chevron-right" />
      </a>
    {/each}
  </div>
  <p class="small muted">Etwa {formatDecimal(weekCost, 2, 2)} € für die Woche, ohne Öl, Brühe und Gewürze. Die Preise werden mit deinem ersten Bon genauer.</p>

  <h2 class="section-title">Rezepte</h2>
  <div class="list">
    {#each RECIPES as recipe (recipe.id)}
      {@const n = portionOf(recipe)}
      <a class="row" href="#/essen/rezept/{recipe.id}">
        <span class="row-grow">{recipe.name}<br /><span class="small muted">{totalMinutes(recipe)} Min, {Math.round(n.kcal)} kcal, {Math.round(n.protein)} g, {formatDecimal(n.euro, 2, 2)} € pro Portion</span></span>
        <Icon name="chevron-right" />
      </a>
    {/each}
  </div>
  <section class="card soon">
    <p class="small muted">Rezeptvorschläge, Hilfe bei wenig Hunger, Nährstoff-Check und neue Rezepte über Claude kommen mit dem nächsten Update.</p>
  </section>
</div>

<Sheet open={extraOpen} title="Extra eintragen" onclose={() => (extraOpen = false)}>
  <div class="quick">
    {#each QUICK as item (item.label)}
      <button class="btn btn-secondary" onclick={() => quick(item)}>{item.label}<span class="small muted">{item.kcal} kcal</span></button>
    {/each}
  </div>
  <div class="grid2">
    <label class="field"><span>kcal</span><input class="input" inputmode="numeric" bind:value={extraKcal} placeholder="300" /></label>
    <label class="field"><span>Protein (g)</span><input class="input" inputmode="numeric" bind:value={extraProtein} placeholder="10" /></label>
  </div>
  {#snippet footer()}
    <button class="btn btn-primary btn-block" onclick={custom}>Eintragen</button>
  {/snippet}
</Sheet>

<style>
  .rings-card {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .totals {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 6px;
  }

  .dot.kcal {
    background: var(--kcal);
  }

  .dot.protein {
    background: var(--protein);
  }

  .strong {
    font-weight: 600;
    color: var(--text);
  }

  .meal {
    align-items: flex-start;
  }

  .check {
    width: 28px;
    height: 28px;
    flex: none;
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px var(--line-strong);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--on-accent);
    margin-top: 2px;
  }

  .checked .check,
  .check.on {
    background: var(--accent);
    box-shadow: none;
  }

  .cook {
    color: var(--accent-ink);
    text-decoration: none;
  }

  .portions {
    display: inline-flex;
    gap: 2px;
    background: var(--surface-2);
    border-radius: 8px;
    padding: 2px;
    flex: none;
  }

  .portions button {
    min-width: 32px;
    min-height: 32px;
    border-radius: 6px;
    color: var(--text-2);
    font-size: var(--fs-small);
  }

  .portions button.selected {
    background: var(--surface-3);
    color: var(--text);
  }

  .day {
    width: 1.8em;
    color: var(--text-2);
    font-weight: 600;
  }

  .today .day {
    color: var(--accent-ink);
  }

  .quick {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  .quick .btn {
    flex-direction: column;
    gap: 0;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .soon {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }
</style>
