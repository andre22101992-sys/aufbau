<script lang="ts">
  // Neues Rezept über Claude oder Apple Intelligence, oder ein Rezept aus einem Screenshot umwandeln.
  import AiBridge from '../components/AiBridge.svelte';
  import Icon from '../components/Icon.svelte';
  import { CUSTOM_KEY, addCustomRecipes, type Recipe } from '../data/recipes';
  import { convertPrompt, newRecipePrompt } from '../lib/ai/prompts';
  import { parseRecipe } from '../lib/ai/schemas';
  import { portionOf, scaleIngredients, stepText, totalMinutes } from '../lib/nutrition';
  import { formatDecimal } from '../lib/numbers';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { go, goBack } from '../lib/state/router.svelte';

  interface Props {
    mode: 'neu' | 'umwandeln';
  }

  let { mode }: Props = $props();

  let wish = $state('');
  let photo = $state.raw<File | null>(null);
  let photoInput = $state<HTMLInputElement>();
  let error = $state('');
  let recipe = $state.raw<Recipe | null>(null);

  const prompt = $derived(mode === 'neu' ? newRecipePrompt(wish) : convertPrompt(wish));
  const shortPrompt = $derived(mode === 'neu' ? newRecipePrompt(wish, true) : undefined);
  const n = $derived(recipe ? portionOf(recipe) : null);

  function answer(text: string): void {
    const result = parseRecipe(text);
    if (result.ok) {
      recipe = result.value;
      error = '';
    } else {
      error = result.error;
    }
  }

  async function save(): Promise<void> {
    if (!recipe) return;
    const list = Array.isArray(app.overrides[CUSTOM_KEY]) ? (app.overrides[CUSTOM_KEY] as Recipe[]) : [];
    const clean = $state.snapshot(recipe) as Recipe;
    await setOverride(CUSTOM_KEY, [...$state.snapshot(list), clean]);
    addCustomRecipes([clean]);
    showToast('Rezept gespeichert');
    go(`/essen/rezept/${clean.id}`, true);
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/essen')}><Icon name="chevron-left" /></button>
  </header>
  <h1>{mode === 'neu' ? 'Neues Rezept' : 'Rezept umwandeln'}</h1>

  {#if !recipe}
    <p class="muted">
      {mode === 'neu'
        ? 'Sag, worauf du Lust hast. Claude oder Apple Intelligence schlagen ein Gericht vor, das zu Topf, Crispi, Budget und deinem Protein-Ziel passt.'
        : 'Mach einen Screenshot von einem Rezept, zum Beispiel aus Chefkoch, Instagram oder einem Kochbuch. Claude baut es für dich um: 2 Portionen, Topf und Crispi, Lidl-Zutaten, genug Protein.'}
    </p>

    {#if mode === 'umwandeln'}
      <button class="btn btn-secondary" onclick={() => photoInput?.click()}><Icon name="camera" size={20} />{photo ? 'Anderes Bild wählen' : 'Screenshot oder Foto wählen'}</button>
      <input bind:this={photoInput} class="sr-only" type="file" accept="image/*" onchange={(e) => (photo = e.currentTarget.files?.[0] ?? null)} />
      {#if photo}<p class="small muted">Bild gewählt: {photo.name}</p>{/if}
    {/if}

    <label class="field">
      <span>{mode === 'neu' ? 'Worauf hast du Lust? (optional)' : 'Hinweis (optional)'}</span>
      <input class="input" bind:value={wish} placeholder={mode === 'neu' ? 'z. B. etwas mit Reis und scharf' : 'z. B. ohne Pilze'} />
    </label>

    {#if mode === 'neu' || photo}
      <AiBridge {prompt} {shortPrompt} image={photo} onanswer={answer} />
    {/if}
    {#if error}<p class="result bad"><Icon name="alert-triangle" size={18} /><span>{error}</span></p>{/if}
  {:else if n}
    <section class="card stack">
      <h2>{recipe.name}</h2>
      <p class="small muted">
        Nachgerechnet pro Portion: {Math.round(n.kcal)} kcal, {Math.round(n.protein)} g Protein, etwa {formatDecimal(n.euro, 2, 2)} €. Dauer etwa {totalMinutes(recipe)} Min.
      </p>
      {#if n.protein < 35}<p class="result bad"><Icon name="alert-triangle" size={18} /><span>Weniger als 35 g Protein pro Portion. Du kannst es trotzdem speichern.</span></p>{/if}
      <ul>
        {#each scaleIngredients(recipe, recipe.servings) as i (i.food)}<li>{i.name}: {i.amount}</li>{/each}
      </ul>
      <ol>
        {#each recipe.steps as s, i (i)}<li>{stepText(s, recipe, recipe.servings)}</li>{/each}
      </ol>
    </section>
    <button class="btn btn-primary btn-block" onclick={save}>Rezept speichern</button>
    <button class="btn btn-ghost btn-block" onclick={() => (recipe = null)}>Verwerfen</button>
  {/if}
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  ul,
  ol {
    margin: 0;
    padding-left: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
