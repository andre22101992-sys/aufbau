<script lang="ts">
  // Rezept: Menge anpassen, Zutaten-Check vorab, Schritte mit den passenden Mengen.
  import Icon from '../components/Icon.svelte';
  import Stepper from '../components/Stepper.svelte';
  import { RECIPE_BY_ID, DEVICE_LABELS } from '../data/recipes';
  import { crispiRounds, portionOf, portionsFor, scaleIngredients, stepText, totalMinutes } from '../lib/nutrition';
  import { formatDecimal, parseDecimal } from '../lib/numbers';
  import { goBack } from '../lib/state/router.svelte';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { ratingKey } from '../lib/suggest';
  import { dinnerKey } from '../data/mealplan';
  import { todayKey } from '../lib/dates';

  interface Props {
    id: string;
  }

  let { id }: Props = $props();

  const recipe = $derived(RECIPE_BY_ID[id]);
  let portions = $state(2);
  let checked = $state<string[]>([]);
  let haveFood = $state('');
  let haveGrams = $state('');

  const ingredients = $derived(recipe ? scaleIngredients(recipe, portions) : []);
  const perPortion = $derived(recipe ? portionOf(recipe) : null);
  const rounds = $derived(recipe ? crispiRounds(recipe, portions) : 1);
  const devices = $derived(recipe ? [...new Set(recipe.steps.map((s) => s.device))].filter((d) => d !== 'du') : []);
  const allChecked = $derived(ingredients.length > 0 && ingredients.every((i) => checked.includes(i.food)));

  function fromAmount(): void {
    const grams = parseDecimal(haveGrams);
    if (!recipe || !haveFood || grams === null || grams <= 0) return;
    portions = portionsFor(recipe, haveFood, grams);
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/essen')}><Icon name="chevron-left" /></button>
  </header>

  {#if !recipe || !perPortion}
    <p class="muted">Dieses Rezept gibt es nicht.</p>
  {:else}
    <h1>{recipe.name}</h1>
    <p class="muted">
      {totalMinutes(recipe, portions)} Min mit {devices.map((d) => DEVICE_LABELS[d]).join(' und ')}. Pro Portion {Math.round(perPortion.kcal)} kcal,
      {Math.round(perPortion.protein)} g Protein, etwa {formatDecimal(perPortion.euro, 2, 2)} €.
    </p>

    <section class="card stack">
      <div class="portion-row">
        <span>Portionen</span>
        <Stepper value={portions} label="Portionen" step={0.5} min={0.5} max={6} onchange={(v) => (portions = v)} />
      </div>
      <details>
        <summary class="small">Ich habe nur eine bestimmte Menge einer Zutat</summary>
        <div class="have">
          <select class="input" bind:value={haveFood} aria-label="Zutat">
            <option value="">Zutat wählen</option>
            {#each recipe.ingredients.filter((i) => i.grams >= 50) as i (i.food)}
              <option value={i.food}>{scaleIngredients(recipe, recipe.servings).find((s) => s.food === i.food)?.name}</option>
            {/each}
          </select>
          <input class="input" inputmode="numeric" placeholder="Gramm" bind:value={haveGrams} aria-label="Gramm" />
          <button class="btn btn-secondary" onclick={fromAmount}>Umrechnen</button>
        </div>
      </details>
      {#if portions !== 2}
        <p class="small muted">Für {formatDecimal(portions, 1)} Portionen sind alle Mengen und Schritte umgerechnet.</p>
      {/if}
      {#if rounds > 1}
        <p class="small warn"><Icon name="alert-triangle" size={16} /> Das passt nicht auf einmal in den Crispi. Gare es in {rounds} Durchgängen, die Zeit verlängert sich entsprechend.</p>
      {/if}
    </section>

    <h2 class="section-title">Zutaten-Check</h2>
    <div class="list">
      {#each ingredients as item (item.food)}
        <label class="row check-row">
          <input type="checkbox" value={item.food} bind:group={checked} />
          <span class="row-grow">{item.name}</span>
          <span class="num muted">{item.amount}</span>
        </label>
      {/each}
      {#each devices as d (d)}
        <label class="row check-row">
          <input type="checkbox" value="geraet-{d}" bind:group={checked} />
          <span class="row-grow">{DEVICE_LABELS[d]} bereit</span>
        </label>
      {/each}
    </div>

    <h2 class="section-title">Schritte</h2>
    <ol class="steps">
      {#each recipe.steps as step, i (i)}
        <li>
          <span class="device {step.device}">{DEVICE_LABELS[step.device]}{step.timer ? `, ${step.timer} Min` : ''}</span>
          <span>{stepText(step, recipe, portions)}</span>
        </li>
      {/each}
    </ol>

    <div class="rate" role="group" aria-label="Bewertung">
      <button class="btn btn-ghost" class:on={app.overrides[ratingKey(recipe.id)] === 1} onclick={() => setOverride(ratingKey(recipe.id), app.overrides[ratingKey(recipe.id)] === 1 ? null : 1)}>Schmeckt mir</button>
      <button class="btn btn-ghost" class:on={app.overrides[ratingKey(recipe.id)] === -1} onclick={() => setOverride(ratingKey(recipe.id), app.overrides[ratingKey(recipe.id)] === -1 ? null : -1)}>Nicht nochmal</button>
      <button class="btn btn-ghost" onclick={() => { void setOverride(dinnerKey(todayKey()), recipe.id); showToast('Für heute Abend eingeplant'); }}>Heute kochen</button>
    </div>

    <a class="btn btn-primary btn-block cook" href="#/essen/kochen/{recipe.id}/{portions}">
      <Icon name="tools-kitchen-2" size={20} />{allChecked ? 'Kochmodus starten' : 'Kochmodus starten, Zutaten noch nicht alle abgehakt'}
    </a>
  {/if}
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .portion-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  summary {
    color: var(--text-2);
    cursor: pointer;
    min-height: 32px;
  }

  .have {
    display: grid;
    grid-template-columns: 1fr 5.5em auto;
    gap: 8px;
    margin-top: 8px;
  }

  .warn {
    color: var(--warn);
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }

  .check-row input {
    width: 22px;
    height: 22px;
    accent-color: var(--accent-ink);
    flex: none;
  }

  .steps {
    margin: 0;
    padding-left: 1.4em;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .steps li {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .device {
    font-size: var(--fs-small);
    font-weight: 600;
  }

  .device.topf {
    color: var(--protein);
  }

  .device.crispi {
    color: var(--kcal);
  }

  .device.du {
    color: var(--text-2);
  }

  .cook {
    margin-top: 8px;
  }

  .rate {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .rate .on {
    color: var(--accent-ink);
    box-shadow: inset 0 0 0 1.5px var(--accent-ink);
  }
</style>
