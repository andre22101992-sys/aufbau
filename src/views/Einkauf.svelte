<script lang="ts">
  // Einkauf: Liste aus dem Wochenplan als Kacheln, Budget, „Noch da?“ für den Vorrat, Ausgaben und Preisverlauf.
  import Icon from '../components/Icon.svelte';
  import { getFood } from '../data/foods';
  import { SECTIONS, shopInfo } from '../data/shop';
  import { FIRST_SHOPPING } from '../data/week1';
  import { formatDate, todayKey } from '../lib/dates';
  import { formatDecimal } from '../lib/numbers';
  import { loadChecked, saveChecked } from '../lib/repo';
  import { monthBudget, priceChange, shoppingList, stockAt } from '../lib/shopping';
  import { app, setOverride } from '../lib/state/app.svelte';
  import { changeStock, clearStock, loadShop, planOptions, shop } from '../lib/state/shop.svelte';

  const today = todayKey();
  void loadShop();

  const list = $derived(shoppingList(today, shop.stock, shop.prices, planOptions()));
  let checked = $state<string[]>([]);
  $effect(() => {
    void loadChecked(list.day).then((c) => (checked = c));
  });

  const tiles = $derived(app.overrides['shop:view'] !== 'list');
  const firstTime = $derived(shop.loaded && shop.receipts.length === 0 && shop.stock.length === 0);
  const extras = $derived(FIRST_SHOPPING.filter((s) => /Ausstattung|Drogerie/.test(s.title)));
  const checkKey = $derived(`stockcheck:${list.day}`);
  const pantryToConfirm = $derived(
    shop.loaded && app.overrides[checkKey] !== true
      ? shop.stock.filter((s) => shopInfo(s.foodId).pantry && stockAt(s, list.day, planOptions()) > 0)
      : [],
  );
  const month = $derived(monthBudget(shop.receipts, today));
  const priced = $derived([...new Set(shop.prices.map((p) => p.foodId))]);
  const done = $derived(list.items.filter((i) => checked.includes(i.foodId)).length);

  async function toggle(foodId: string, packs: number): Promise<void> {
    const on = checked.includes(foodId);
    checked = on ? checked.filter((c) => c !== foodId) : [...checked, foodId];
    await saveChecked(list.day, $state.snapshot(checked));
    if (packs > 0) await changeStock(foodId, on ? -packs : packs);
  }
</script>

<div class="screen">
  <header class="screen-head">
    <div>
      <p class="small muted">Einkauf am {formatDate(list.day)}</p>
      <h1>Einkauf</h1>
    </div>
    <span class="small muted num">{done} von {list.items.length}</span>
  </header>

  <section class="card stack">
    <div class="budget-head">
      <span>Diese Woche</span>
      <span class="num"><strong>{formatDecimal(list.euro, 2, 2)} €</strong> / {formatDecimal(list.budget, 2, 2)} €</span>
    </div>
    <div class="bar" aria-hidden="true"><span class:over={list.euro > list.budget} style:width="{Math.min(100, (list.euro / list.budget) * 100)}%"></span></div>
    {#if list.covered.length}
      <p class="small muted">Laut Vorrat noch da: {list.covered.join(', ')}.</p>
    {:else if firstTime}
      <p class="small muted">Erster Einkauf: Reis, Linsen, Öl und Gewürze kaufst du als ganze Packungen. Danach rechnet der Vorrat sie heraus.</p>
    {/if}
  </section>

  {#if pantryToConfirm.length}
    <section class="card stack">
      <h2>Noch da?</h2>
      <p class="small muted">Laut Rechnung hast du davon noch etwas. Stimmt das?</p>
      {#each pantryToConfirm as s (s.foodId)}
        <div class="confirm">
          <span class="row-grow">{shopInfo(s.foodId).icon} {getFood(s.foodId).name}</span>
          <button class="btn btn-ghost small-btn" onclick={() => clearStock(s.foodId)}>Leer</button>
        </div>
      {/each}
      <button class="btn btn-secondary" onclick={() => setOverride(checkKey, true)}>Rest stimmt</button>
    </section>
  {/if}

  <div class="actions">
    <a class="btn btn-secondary" href="#/einkauf/bon"><Icon name="list-check" size={18} />Bon übernehmen</a>
    <a class="btn btn-secondary" href="#/einkauf/scan"><Icon name="camera" size={18} />Produkt scannen</a>
  </div>
  <a class="btn btn-ghost" href="#/einkauf/samstag"><Icon name="calendar" size={18} />Samstags-Assistent</a>

  <div class="view-toggle" role="radiogroup" aria-label="Ansicht">
    <button role="radio" aria-checked={tiles} class:selected={tiles} onclick={() => setOverride('shop:view', null)}>Kacheln</button>
    <button role="radio" aria-checked={!tiles} class:selected={!tiles} onclick={() => setOverride('shop:view', 'list')}>Liste</button>
  </div>

  {#each SECTIONS as section (section)}
    {@const items = list.items.filter((i) => i.section === section)}
    {#if items.length}
      <h2 class="section-title">{section}</h2>
      <div class={tiles ? 'tiles' : 'list'}>
        {#each items as item (item.foodId)}
          {@const on = checked.includes(item.foodId)}
          <button class={tiles ? 'tile' : 'row item'} class:on aria-pressed={on} onclick={() => toggle(item.foodId, item.packs)}>
            {#if tiles}
              <span class="icon-big" aria-hidden="true">{on ? '✓' : item.icon}</span>
              <span class="name">{item.name}</span>
              <span class="small sub">{item.amount}, {formatDecimal(item.euro, 2, 2)} €</span>
            {:else}
              <span class="box" aria-hidden="true">{#if on}<Icon name="check" size={18} />{/if}</span>
              <span class="row-grow">{item.name}<br /><span class="small muted">{item.amount}</span></span>
              <span class="small muted num">{formatDecimal(item.euro, 2, 2)} €</span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  {/each}
  {#if list.items.some((i) => i.basic)}
    <p class="caption muted">Öl, Brühe und Gewürze zählen nicht zum Wochenbudget.</p>
  {/if}

  {#if firstTime}
    {#each extras as section (section.title)}
      <h2 class="section-title">{section.title}</h2>
      {#if section.note}<p class="caption muted">{section.note}</p>{/if}
      <div class="list">
        {#each section.items as item (item.id)}
          {@const on = checked.includes(`eq:${item.id}`)}
          <button class="row item" class:on aria-pressed={on} onclick={() => toggle(`eq:${item.id}`, 0)}>
            <span class="box" aria-hidden="true">{#if on}<Icon name="check" size={18} />{/if}</span>
            <span class="row-grow">{item.label}</span>
            <span class="small muted">{item.amount}</span>
          </button>
        {/each}
      </div>
    {/each}
  {/if}

  <h2 class="section-title">Ausgaben</h2>
  <section class="card stack">
    <div class="budget-head">
      <span>Diesen Monat</span>
      <span class="num"><strong>{formatDecimal(month.spent, 2, 2)} €</strong> / {formatDecimal(month.budget, 2, 2)} €</span>
    </div>
    <div class="bar" aria-hidden="true"><span class:over={month.spent > month.budget} style:width="{Math.min(100, (month.spent / month.budget) * 100)}%"></span></div>
    <p class="small muted">
      {shop.receipts.length ? `Schnitt ${formatDecimal(month.perDay, 2, 2)} € pro Tag, Ziel 5,25 €.` : 'Übernimm deinen ersten Bon, dann siehst du hier deine Ausgaben.'}
    </p>
  </section>

  {#if priced.length}
    <h2 class="section-title">Preisverlauf</h2>
    <div class="list">
      {#each priced as foodId (foodId)}
        {@const change = priceChange(foodId, shop.prices)}
        {@const latest = shop.prices.filter((p) => p.foodId === foodId).sort((a, b) => (a.date < b.date ? 1 : -1))[0]}
        <div class="row">
          <span class="row-grow">{getFood(foodId).name}<br /><span class="small muted">{getFood(foodId).pack.label}, zuletzt am {formatDate(latest.date, 'short')}</span></span>
          <span class="num">{formatDecimal(latest.euro, 2, 2)} €</span>
          {#if change !== null && Math.abs(change) >= 0.01}
            <span class="small num" class:up={change > 0.15}>{change > 0 ? '+' : '−'}{Math.round(Math.abs(change) * 100)} %</span>
          {/if}
        </div>
        {#if change !== null && change > 0.15}
          <p class="small muted warn">Deutlich teurer geworden. Schau nach einer Eigenmarke oder tausch Gerichte mit dieser Zutat für eine Weile.</p>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .budget-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .bar {
    height: 8px;
    background: var(--surface-3);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--accent-ink);
  }

  .bar span.over {
    background: var(--warn);
  }

  .confirm {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .small-btn {
    min-height: 36px;
    padding-inline: 12px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .view-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 4px;
    background: var(--surface-1);
    border-radius: var(--radius-control);
  }

  .view-toggle button {
    min-height: 36px;
    border-radius: 8px;
    color: var(--text-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }

  .view-toggle button.selected {
    background: var(--surface-3);
    color: var(--text);
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 10px;
    min-height: 92px;
    background: var(--surface-1);
    border-radius: var(--radius-card, 14px);
    text-align: left;
    color: var(--text);
  }

  .tile.on {
    background: var(--accent);
    color: var(--on-accent);
  }

  .icon-big {
    font-size: 22px;
    line-height: 1.2;
  }

  .name {
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.2;
  }

  .sub {
    color: var(--text-2);
    line-height: 1.2;
  }

  .tile.on .sub {
    color: var(--on-accent);
  }

  .item {
    min-height: 52px;
  }

  .box {
    width: 26px;
    height: 26px;
    flex: none;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 0 2px var(--surface-3);
    color: var(--on-accent);
  }

  .on .box {
    background: var(--accent);
    box-shadow: none;
  }

  .on .row-grow {
    color: var(--text-3);
    text-decoration: line-through;
  }

  .up {
    color: var(--warn);
  }

  .warn {
    padding: 0 14px 10px;
  }
</style>
