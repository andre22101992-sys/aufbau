<script lang="ts">
  import { DINNERS, DISHES, OFFICE_DAY } from '../data/week1';
  import Icon from '../components/Icon.svelte';
  import { formatDecimal } from '../lib/numbers';

  let openDish = $state<string | null>('haehnchen');
</script>

<div class="screen">
  <header class="screen-head">
    <div>
      <p class="small muted">Vorschau auf deinen Plan</p>
      <h1>Essen</h1>
    </div>
  </header>

  <p class="card small muted intro">
    Abhaken, Kochmodus, Rezeptvorschläge und Claude kommen mit dem nächsten großen Update. Bis dahin steht hier dein Plan für die erste Woche,
    damit du schon danach kochen kannst.
  </p>

  <h2 class="section-title">Ein Bürotag</h2>
  <div class="list">
    {#each OFFICE_DAY as row (row.time)}
      <div class="row meal">
        <span class="time num">{row.time}</span>
        <span class="row-grow">{row.meal}<br /><span class="small muted">{row.place}</span></span>
        <span class="vals small num"><span class="kcal">{row.kcal}</span><span class="protein">{row.protein} g</span></span>
      </div>
    {/each}
  </div>
  <p class="caption muted">
    Zusammen etwa 2.850 kcal und 140 g Protein. Freitag ist alles eine Stunde früher, am Wochenende frühstückst du zu Hause.
  </p>

  <h2 class="section-title">Abendessen der Woche</h2>
  <div class="list">
    {#each DINNERS as d (d.day)}
      <div class="row">
        <span class="day small muted">{d.day}</span>
        <span class="row-grow">{DISHES[d.dish].name}</span>
      </div>
    {/each}
  </div>
  <p class="caption muted">Du kochst die doppelte Menge. Die zweite Portion ist das Mittagessen am nächsten Tag. Hack kommt am Einkaufstag dran.</p>

  <h2 class="section-title">Rezepte</h2>
  {#each Object.values(DISHES) as dish (dish.id)}
    <section class="card dish">
      <button class="dish-head" aria-expanded={openDish === dish.id} onclick={() => (openDish = openDish === dish.id ? null : dish.id)}>
        <span class="row-grow">
          <h3>{dish.name}</h3>
          <span class="small muted">{dish.device}, {dish.minutes} Minuten, pro Portion ca. {dish.kcal} kcal, {dish.protein} g Protein, {formatDecimal(dish.euro, 2, 2)} €</span>
        </span>
        <Icon name={openDish === dish.id ? 'minus' : 'plus'} />
      </button>
      {#if openDish === dish.id}
        <div class="dish-body">
          <p class="small muted">Für 2 Portionen</p>
          <ul>
            {#each dish.ingredients as item (item)}<li>{item}</li>{/each}
          </ul>
          {#if dish.steps}
            <h3>Schritt für Schritt</h3>
            <ol>
              {#each dish.steps as step (step)}<li>{step}</li>{/each}
            </ol>
          {:else}
            <p class="small muted">Die Schritt-für-Schritt-Anleitung mit Kochmodus folgt mit dem Essen-Update.</p>
          {/if}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .intro {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }

  .meal {
    align-items: flex-start;
  }

  .time {
    width: 3em;
    flex: none;
    color: var(--text-2);
    padding-top: 1px;
  }

  .vals {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex: none;
  }

  .kcal::after {
    content: ' kcal';
    color: var(--text-3);
  }

  .kcal {
    color: var(--text);
  }

  .protein {
    color: var(--text-2);
  }

  .day {
    width: 6.5em;
    flex: none;
  }

  .dish {
    padding: 0;
  }

  .dish-head {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px;
    text-align: left;
  }

  .dish-head h3 {
    margin-bottom: 2px;
  }

  .dish-body {
    padding: 0 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  ul,
  ol {
    margin: 0;
    padding-left: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  li::marker {
    color: var(--text-3);
  }
</style>
