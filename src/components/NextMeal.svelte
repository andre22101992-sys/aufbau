<script lang="ts">
  // Oben in „Heute“: die nächste Mahlzeit mit großem Knopf. Dazu ein freundlicher Hinweis nach langer Pause,
  // der Abend-Retter und der leichte Tag für Tage ohne Appetit.
  import { onMount } from 'svelte';
  import { mealsOf, mealTime, type PlanMeal } from '../data/mealplan';
  import { getRecipe } from '../data/recipes';
  import { todayKey } from '../lib/dates';
  import { eatenTotals, openMeals, plannedTotals } from '../lib/dayfood';
  import { mealAmounts, mealNutrients } from '../lib/nutrition';
  import { eveningRescue, gapNotice, inTime, lastEatenAt, mealCount, mealMinutes, minutesOf, sinceText } from '../lib/rhythm';
  import { app, showToast } from '../lib/state/app.svelte';
  import { clock, useClock } from '../lib/state/clock.svelte';
  import { planOptions } from '../lib/state/shop.svelte';
  import { addExtra, endLightDay, isLightDay, loadDay, meals, setPortion, startLightDay } from '../lib/state/meals.svelte';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  const today = todayKey();
  void loadDay(today);
  onMount(() => useClock());

  const options = $derived(planOptions());
  const plan = $derived(mealsOf(today, options));
  const day = $derived(meals.day);
  const done = $derived(day?.done ?? {});
  const extras = $derived(day?.extras ?? []);
  const open = $derived(openMeals(plan, done, extras));
  const next = $derived(open[0] ?? null);
  const light = $derived(isLightDay(today));
  const now = $derived(new Date(clock.now));

  const title = (meal: PlanMeal) => (meal.kind === 'dish' ? getRecipe(meal.recipeId).name : meal.name);
  const nutrition = $derived(next ? mealNutrients(next) : null);
  const minutesUntil = $derived(next ? mealMinutes(mealTime(next)) - minutesOf(now) : 0);
  const when = $derived(
    !next ? '' : minutesUntil > 0 ? `Als Nächstes, ${inTime(minutesUntil)}` : minutesUntil > -90 ? 'Jetzt dran' : `Noch offen, geplant für ${mealTime(next)}`,
  );
  const note = $derived(
    !next ? '' : next.kind === 'fixed' ? (next.note ?? '') : next.leftover ? 'Zweite Portion von gestern, dampfend heiß aufwärmen' : 'Doppelte Menge kochen, eine Portion für morgen',
  );

  // Wie lange die letzte Mahlzeit her ist; bei Einträgen ohne Zeitpunkt (ältere App-Version) bleibt die Zeile weg
  const lastAt = $derived(lastEatenAt(day));
  const since = $derived(day && mealCount(day) === 0 ? 'Heute noch nichts abgehakt' : lastAt ? `Letzte Mahlzeit ${sinceText(clock.now - lastAt)}` : '');
  const longPause = $derived(!!lastAt && clock.now - lastAt >= 4 * 3_600_000);

  // Hinweis nach langer Pause und Abend-Retter
  let dismissed = $state(false);
  let rescueDismissed = $state(false);
  const notice = $derived(dismissed ? null : gapNotice(now, plan, day));
  const rescue = $derived(
    rescueDismissed || !day
      ? null
      : eveningRescue(now, eatenTotals(plan, done, extras), plannedTotals(open, []), { kcal: app.settings.kcalTarget, protein: app.settings.proteinTarget }),
  );

  let drinkOpen = $state(false);
  let lightOpen = $state(false);

  function eat(): void {
    if (!next) return;
    setPortion(next.id, 1);
    showToast('Abgehakt. Gut gemacht!');
  }

  /** Trinken statt essen: der Eintrag ersetzt die nächste Mahlzeit */
  function drink(label: string, kcal: number, protein: number): void {
    if (!next) return;
    addExtra(label, kcal, protein, next.id);
    drinkOpen = false;
    showToast(`${label} eingetragen. Das zählt.`);
  }

  function glass(): void {
    addExtra('250 ml Milch', 160, 8);
    dismissed = true;
    showToast('250 ml Milch eingetragen');
  }

  function takeRescue(): void {
    if (!rescue) return;
    addExtra(`${rescue.ml} ml Milch`, rescue.kcal, rescue.protein);
    showToast(`${rescue.ml} ml Milch eingetragen`);
  }

  async function startLight(): Promise<void> {
    await startLightDay(today, plan, title);
    lightOpen = false;
    showToast('Leichter Tag: Trinken zählt');
  }

  async function backToNormal(): Promise<void> {
    await endLightDay(today);
    showToast('Wieder der normale Plan');
  }
</script>

{#if notice}
  <section class="card stack notice">
    <p>
      {notice.kind === 'none-yet'
        ? 'Heute ist noch nichts abgehakt. Fang klein an: Ein Glas Milch zählt schon.'
        : `Deine letzte Mahlzeit ist etwa ${notice.hours} Stunden her. Wie wäre etwas Leichtes?`}
    </p>
    <div class="cluster">
      <button class="btn btn-primary" onclick={glass}>Glas Milch, 160 kcal</button>
      <button class="btn btn-ghost" onclick={() => (dismissed = true)}>Später</button>
    </div>
  </section>
{/if}

<section class="card-hero hero">
  {#if next && nutrition}
    <p class="small muted">{light ? 'Leichter Tag. ' : ''}{when}</p>
    <h2>{mealTime(next)} {title(next)}</h2>
    <p class="amounts">{mealAmounts(next)}</p>
    <p class="muted num">{Math.round(nutrition.kcal)} kcal, {Math.round(nutrition.protein)} g Protein</p>
    {#if since}<p class="small since" class:long={longPause}>{since}</p>{/if}
    {#if note}<p class="small muted">{note}</p>{/if}
    <button class="btn btn-primary btn-block go" onclick={eat}><Icon name="check" size={20} />Gegessen</button>
    <button class="btn btn-ghost btn-block" onclick={() => (drinkOpen = true)}>Kein Hunger? Trinken geht auch</button>
    {#if next.kind === 'dish' && !next.leftover}
      <a class="small cook" href="#/essen/rezept/{next.recipeId}">Rezept und Kochmodus</a>
    {/if}
  {:else}
    <p class="small muted">Heute</p>
    <h2>Alles für heute gegessen</h2>
    <p class="muted">Gut gemacht. Regelmäßig essen ist der Teil, der am meisten zählt.</p>
  {/if}
  <div class="light-row">
    {#if light}
      <button class="link" onclick={backToNormal}>Zurück zum normalen Plan</button>
    {:else}
      <button class="link" onclick={() => (lightOpen = true)}>Fällt Essen heute schwer? Leichter Tag</button>
    {/if}
  </div>
</section>

{#if rescue}
  <section class="card stack">
    <h2>Noch etwas fehlt</h2>
    <p class="muted">Mit dem, was noch geplant ist, erreichst du dein Ziel heute nicht ganz. {rescue.ml} ml Milch schließen die Lücke: etwa {rescue.kcal} kcal und {rescue.protein} g Protein.</p>
    <div class="cluster">
      <button class="btn btn-primary" onclick={takeRescue}>{rescue.ml} ml Milch eintragen</button>
      <button class="btn btn-ghost" onclick={() => (rescueDismissed = true)}>Nicht heute</button>
    </div>
  </section>
{/if}

<Sheet open={drinkOpen} title="Trinken geht auch" onclose={() => (drinkOpen = false)}>
  {#if next}
    <p>Flüssiges geht runter, auch wenn Essen gerade nicht geht. Der Eintrag ersetzt: {mealTime(next)} {title(next)}.</p>
    <p class="card small">Milch-Hafer-Shake: 400 ml Vollmilch, 60 g zarte Haferflocken und eine Banane im Schraubglas schütteln. Langsam trinken.</p>
    <button class="btn btn-primary btn-block" onclick={() => drink('Milch-Hafer-Shake', 590, 23)}>Shake getrunken, 590 kcal</button>
    <button class="btn btn-secondary btn-block" onclick={() => drink('250 ml Milch', 160, 8)}>Glas Milch getrunken, 160 kcal</button>
    <p class="small muted">Auch ein kleiner Anfang zählt. Später gibt es die nächste Mahlzeit.</p>
  {/if}
</Sheet>

<Sheet open={lightOpen} title="Leichter Tag" onclose={() => (lightOpen = false)}>
  <p>Ein leichter Tag ist besser als ein leerer. Statt Mahlzeiten gibt es ab jetzt Trinkmahlzeiten: Milch-Hafer-Shakes und Gläser Milch, über den Tag verteilt.</p>
  <p class="small muted">Ganzer Tag etwa 2.100 kcal und 85 g Protein. Das liegt unter deinem Ziel, aber weit über einem leeren Tag. Was du heute schon gegessen hast, bleibt in der Bilanz. Das Training wird heute zur Kurzversion oder zum Ruhetag, du entscheidest.</p>
  {#snippet footer()}
    <button class="btn btn-ghost" onclick={() => (lightOpen = false)}>Abbrechen</button>
    <button class="btn btn-primary btn-block" onclick={startLight}>Leichten Tag starten</button>
  {/snippet}
</Sheet>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .go {
    margin-top: 6px;
  }

  .cook {
    color: var(--accent-ink);
    text-decoration: none;
    text-align: center;
  }

  .link {
    color: var(--text-2);
    font-size: var(--fs-small);
    text-decoration: underline;
    padding: 6px 0;
  }

  .light-row {
    display: flex;
    justify-content: center;
  }

  .amounts {
    font-size: var(--fs-body);
    line-height: 1.4;
  }

  .since {
    color: var(--text-2);
  }

  .since.long {
    color: var(--kcal);
  }

  .notice {
    box-shadow: inset 3px 0 0 var(--kcal);
  }
</style>
