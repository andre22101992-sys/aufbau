<script lang="ts">
  // Essen: oben heute mit Ringen und Mahlzeiten zum Abhaken, darunter Wochenplan und Rezepte.
  import AiBridge from '../components/AiBridge.svelte';
  import Icon from '../components/Icon.svelte';
  import { photoPrompt } from '../lib/ai/prompts';
  import { parsePhoto } from '../lib/ai/schemas';
  import Rings from '../components/Rings.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { dinnerKey, dinnerOf, mealsOf, mealTime, type PlanMeal } from '../data/mealplan';
  import { BASE_RECIPES, PLAN_B, RECIPES, getRecipe } from '../data/recipes';
  import { WEEKDAYS_SHORT, addDays, formatDate, todayKey, weekStart } from '../lib/dates';
  import { eatenTotals, openMeals, plannedTotals, replacedMeals } from '../lib/dayfood';
  import { RECENT_KEY, topRecent } from '../lib/recent';
  import { dayPlanNutrients, mealAmounts, mealNutrients, portionOf, totalMinutes } from '../lib/nutrition';
  import { NUTRIENT_LABELS, NUTRIENT_TARGETS, suggestFor, weekNutrients, type NutrientKey } from '../lib/suggest';
  import { formatDecimal, parseDecimal } from '../lib/numbers';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { addExtra, loadDay, meals, removeExtra, setPortion } from '../lib/state/meals.svelte';
  import { planOptions } from '../lib/state/shop.svelte';

  const today = todayKey();
  void loadDay(today);

  const options = $derived(planOptions());
  const plan = $derived(mealsOf(today, options));
  const done = $derived(meals.day?.done ?? {});
  const extras = $derived(meals.day?.extras ?? []);

  const eaten = $derived(eatenTotals(plan, done, extras));
  const planned = $derived(plannedTotals(plan, extras));
  const replacedBy = $derived(replacedMeals(extras));
  const open = $derived(openMeals(plan, done, extras));
  const week = $derived(Array.from({ length: 7 }, (_, i) => addDays(weekStart(today), i)));
  const weekCost = $derived(week.reduce((sum, d) => sum + dayPlanNutrients(d, options).euro, 0));
  const nutrients = $derived(weekNutrients(today, app.overrides, app.settings.kcalTarget, app.settings.startDate));
  const NUTRIENT_KEYS = Object.keys(NUTRIENT_TARGETS) as NutrientKey[];

  // Gericht tauschen
  let swapDate = $state<string | null>(null);
  const suggestions = $derived(swapDate ? suggestFor(swapDate, app.overrides).slice(0, 6) : []);

  async function swapTo(recipeId: string | null): Promise<void> {
    if (!swapDate) return;
    await setOverride(dinnerKey(swapDate), recipeId);
    showToast(recipeId ? `${getRecipe(recipeId).name} eingeplant` : 'Wieder wie im Plan');
    swapDate = null;
  }

  let hungerOpen = $state(false);

  const title = (meal: PlanMeal) => (meal.kind === 'dish' ? getRecipe(meal.recipeId).name : meal.name);
  const note = (meal: PlanMeal) => {
    if (meal.kind === 'dish') return meal.leftover ? 'Zweite Portion von gestern, dampfend heiß aufwärmen' : 'Doppelte Menge kochen, eine Portion für morgen';
    return [meal.note, meal.id === 'oats' && app.settings.creatine ? 'Mit 3–5 g Kreatin' : ''].filter(Boolean).join('. ');
  };
  const titleOf = (id: string) => {
    const meal = plan.find((m) => m.id === id);
    return meal ? title(meal) : '';
  };

  // Extras
  let extraOpen = $state(false);
  let extraName = $state('');
  let replaces = $state('');
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

  const recent = $derived(topRecent(app.overrides[RECENT_KEY], QUICK.map((q) => q.label)));

  function quick(item: { label: string; kcal: number; protein: number }): void {
    addExtra(item.label, item.kcal, item.protein, replaces || undefined);
    replaces = '';
    extraOpen = false;
    showToast(`${item.label} eingetragen`);
  }

  function custom(): void {
    const kcal = parseDecimal(extraKcal);
    if (kcal === null || kcal <= 0) {
      showToast('Trag die Kalorien als Zahl ein, zum Beispiel 300.');
      return;
    }
    addExtra(extraName.trim() || 'Eigener Eintrag', Math.round(kcal), Math.round(parseDecimal(extraProtein) ?? 0), replaces || undefined);
    extraName = '';
    replaces = '';
    extraKcal = '';
    extraProtein = '';
    extraOpen = false;
  }

  const PORTIONS = [0.5, 1, 1.5];

  let photo = $state.raw<File | null>(null);
  let photoInput = $state<HTMLInputElement>();
  let photoError = $state('');

  function photoAnswer(text: string): void {
    const result = parsePhoto(text);
    if (!result.ok) {
      photoError = result.error;
      return;
    }
    addExtra(result.value.label, Math.round(result.value.kcal), Math.round(result.value.protein), replaces || undefined);
    replaces = '';
    showToast(`${result.value.label} eingetragen: ${Math.round(result.value.kcal)} kcal`);
    photo = null;
    photoError = '';
    extraOpen = false;
  }
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
      {#if replacedBy.has(meal.id)}
        <div class="row meal replaced">
          <span class="check" aria-hidden="true"><Icon name="arrows-exchange" size={14} /></span>
          <span class="row-grow">
            <span class="small muted num">{mealTime(meal)}</span>
            {title(meal)}<br />
            <span class="small muted">Ersetzt durch {replacedBy.get(meal.id)?.label}</span>
          </span>
        </div>
      {:else}
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
          <span class="small">{mealAmounts(meal)}</span><br />
          <span class="small muted">{Math.round(n.kcal)} kcal, {Math.round(n.protein)} g{note(meal) ? `. ${note(meal)}` : ''}</span>
          {#if meal.kind === 'dish' && !meal.leftover}
            <br /><a class="small cook" href="#/essen/rezept/{meal.recipeId}">Rezept und Kochmodus</a>
            <button class="small planb" onclick={() => (swapDate = today)}>Keine Zeit? Tauschen oder Plan B</button>
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
      {/if}
    {/each}
    {#each extras as extra (extra.id)}
      <div class="row meal checked">
        <span class="check on"><Icon name="plus" size={16} /></span>
        <span class="row-grow">{extra.label}<br /><span class="small muted">{extra.kcal} kcal, {extra.protein} g{#if extra.replaces}. Statt {titleOf(extra.replaces)}{/if}</span></span>
        <button class="icon-btn" aria-label="{extra.label} entfernen" onclick={() => removeExtra(extra.id)}><Icon name="x" size={18} /></button>
      </div>
    {/each}
  </div>
  <div class="pair">
    <button class="btn btn-secondary" onclick={() => (extraOpen = true)}><Icon name="plus" size={18} />Extra eintragen</button>
    <button class="btn btn-ghost" onclick={() => (hungerOpen = true)}>Wenig Hunger?</button>
  </div>

  <h2 class="section-title">Diese Woche</h2>
  <div class="list">
    {#each week as date, i (date)}
      {@const recipe = getRecipe(dinnerOf(date, app.overrides))}
      {@const day = dayPlanNutrients(date, options)}
      <button class="row" class:today={date === today} onclick={() => (swapDate = date)}>
        <span class="day small num">{WEEKDAYS_SHORT[i]}</span>
        <span class="row-grow">{recipe.name}<br /><span class="small muted">Tag: {Math.round(day.kcal).toLocaleString('de-DE')} kcal, {Math.round(day.protein)} g Protein</span></span>
        <Icon name="arrows-exchange" size={18} />
      </button>
    {/each}
  </div>
  <p class="small muted">Etwa {formatDecimal(weekCost, 2, 2)} € für die Woche, ohne Öl, Brühe und Gewürze. Die Preise werden mit deinem ersten Bon genauer.</p>

  <h2 class="section-title">Nährstoffe im Wochenschnitt</h2>
  <section class="card stack">
    {#each NUTRIENT_KEYS as key (key)}
      {@const share = nutrients[key] / NUTRIENT_TARGETS[key]}
      <div class="nutrient">
        <span class="small">{NUTRIENT_LABELS[key].name}</span>
        <span class="track" aria-hidden="true"><span class:low={share < 0.9} style:width="{Math.min(100, share * 100)}%"></span></span>
        <span class="small num muted">{Math.round(nutrients[key])} / {NUTRIENT_TARGETS[key]} {NUTRIENT_LABELS[key].unit}</span>
      </div>
      {#if share < 0.9}<p class="small muted">Tipp: {NUTRIENT_LABELS[key].tip}</p>{/if}
    {/each}
    <p class="caption muted">Pro Tag, gemessen an den Richtwerten der DGE. Nährwerte sind Durchschnittswerte.</p>
  </section>

  <h2 class="section-title">Rezepte</h2>
  <div class="pair2">
    <a class="btn btn-secondary" href="#/essen/ki/neu"><Icon name="bolt" size={18} />Neues Rezept</a>
    <a class="btn btn-secondary" href="#/essen/ki/umwandeln"><Icon name="camera" size={18} />Umwandeln</a>
  </div>
  <div class="list">
    {#each RECIPES as recipe (recipe.id)}
      {@const n = portionOf(recipe)}
      <a class="row" href="#/essen/rezept/{recipe.id}">
        <span class="row-grow">{recipe.name}{#if !BASE_RECIPES.includes(recipe.id)}<span class="pill new">Sammlung</span>{/if}<br /><span class="small muted">{totalMinutes(recipe)} Min, {Math.round(n.kcal)} kcal, {Math.round(n.protein)} g, {formatDecimal(n.euro, 2, 2)} € pro Portion</span></span>
        <Icon name="chevron-right" />
      </a>
    {/each}
  </div>
  <section class="card soon">
    <p class="small muted">Neue Rezepte kommen auch per App-Update dazu, zum Beispiel beim Monats-Check.</p>
  </section>
</div>

<Sheet open={swapDate !== null} title={swapDate ? `Abendessen am ${formatDate(swapDate, 'weekday')}` : ''} onclose={() => (swapDate = null)}>
  {#if swapDate}
    {@const current = getRecipe(dinnerOf(swapDate, app.overrides))}
    <a class="row current" href="#/essen/rezept/{current.id}"><span class="row-grow">Geplant: {current.name}</span><Icon name="chevron-right" /></a>
    {#if app.overrides[dinnerKey(swapDate)]}
      <button class="btn btn-ghost" onclick={() => swapTo(null)}>Zurück zum Plan</button>
    {/if}
    <h3>Plan B, wenn es schnell gehen muss</h3>
    <div class="list plain">
      {#each PLAN_B.filter((id) => id !== current.id) as id (id)}
        {@const r = getRecipe(id)}
        <button class="row" onclick={() => swapTo(id)}><span class="row-grow">{r.name}<br /><span class="small muted">aus dem Vorrat, {totalMinutes(r)} Min</span></span><Icon name="arrows-exchange" size={18} /></button>
      {/each}
    </div>
    <h3>Vorschläge</h3>
    <div class="list plain">
      {#each suggestions as s (s.recipe.id)}
        <button class="row" onclick={() => swapTo(s.recipe.id)}>
          <span class="row-grow">{s.recipe.name}<br /><span class="small muted">{s.reasons.join(', ') || `${Math.round(portionOf(s.recipe).protein)} g Protein`}</span></span>
          <Icon name="arrows-exchange" size={18} />
        </button>
      {/each}
    </div>
    <p class="caption muted">Nur Gerichte, die an diesem Tag noch frisch sind: Hack am Einkaufswochenende, Hähnchen bis Dienstag. Die zweite Portion gibt es am nächsten Mittag.</p>
  {/if}
</Sheet>

{#snippet replacePicker()}
  {#if open.length}
    <label class="field">
      <span>Ersetzt das eine geplante Mahlzeit?</span>
      <select class="input" bind:value={replaces}>
        <option value="">Nein, zusätzlich</option>
        {#each open as m (m.id)}<option value={m.id}>{mealTime(m)} {title(m)}</option>{/each}
      </select>
    </label>
  {/if}
{/snippet}

<Sheet open={hungerOpen} title="Wenig Hunger?" onclose={() => (hungerOpen = false)}>
  <p>Trinken geht leichter als essen. Der Milch-Hafer-Shake liefert fast so viel wie eine Mahlzeit:</p>
  <p class="card small">400 ml Vollmilch, 60 g zarte Haferflocken und eine Banane im Schraubglas schütteln. Etwa 590 kcal und 23 g Protein.</p>
  {@render replacePicker()}
  <button class="btn btn-primary btn-block" onclick={() => { quick({ label: 'Milch-Hafer-Shake', kcal: 590, protein: 23 }); hungerOpen = false; }}>Shake eintragen</button>
  <p class="small muted">Öl-Booster: 1 EL Öl im Essen bringt 90 kcal mehr, ohne dass die Portion größer wird.</p>
  <p class="small muted">Lässt du eine Mahlzeit öfter aus, tausch sie lieber dauerhaft gegen den Shake, statt sie zu überspringen.</p>
</Sheet>

<Sheet open={extraOpen} title="Extra eintragen" onclose={() => (extraOpen = false)}>
  {@render replacePicker()}
  {#if recent.length}
    <h3>Zuletzt gegessen</h3>
    <div class="quick">
      {#each recent as item (item.label + item.kcal + item.protein)}
        <button class="btn btn-secondary" onclick={() => quick(item)}>{item.label}<span class="small muted">{item.kcal} kcal, {item.protein} g</span></button>
      {/each}
    </div>
    <h3>Schnellauswahl</h3>
  {/if}
  <div class="quick">
    {#each QUICK as item (item.label)}
      <button class="btn btn-secondary" onclick={() => quick(item)}>{item.label}<span class="small muted">{item.kcal} kcal</span></button>
    {/each}
  </div>
  <details class="photo">
    <summary class="small">Essen per Foto mit Claude schätzen</summary>
    <button class="btn btn-secondary btn-block" onclick={() => photoInput?.click()}><Icon name="camera" size={18} />{photo ? 'Anderes Foto' : 'Foto aufnehmen oder wählen'}</button>
    <input bind:this={photoInput} class="sr-only" type="file" accept="image/*" onchange={(e) => (photo = e.currentTarget.files?.[0] ?? null)} />
    {#if photo}
      <AiBridge prompt={photoPrompt()} image={photo} onanswer={photoAnswer} />
    {/if}
    {#if photoError}<p class="small muted">{photoError}</p>{/if}
  </details>
  <label class="field"><span>Name (optional)</span><input class="input" bind:value={extraName} placeholder="z. B. Schokomüsli mit Milch" /></label>
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

  .replaced {
    opacity: 0.7;
  }

  .replaced .check {
    box-shadow: none;
    background: var(--surface-3);
    color: var(--text-2);
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

  .photo summary {
    color: var(--text-2);
    cursor: pointer;
    min-height: 36px;
  }

  .photo {
    margin-bottom: 12px;
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

  .planb {
    color: var(--text-2);
    text-decoration: underline;
    padding: 4px 0;
  }

  .pair2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .nutrient {
    display: grid;
    grid-template-columns: 7.5em 1fr auto;
    gap: 10px;
    align-items: center;
  }

  .track {
    height: 8px;
    background: var(--surface-2);
    border-radius: 4px;
    overflow: hidden;
  }

  .track span {
    display: block;
    height: 100%;
    background: var(--accent-ink);
    border-radius: 0 4px 4px 0;
  }

  .track span.low {
    background: var(--warn);
  }

  .new {
    margin-left: 8px;
  }

  .plain {
    background: var(--surface-2);
  }

  h3 {
    margin-top: 6px;
  }

  .soon {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }
</style>
