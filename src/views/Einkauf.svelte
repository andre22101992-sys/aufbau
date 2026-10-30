<script lang="ts">
  import { onMount } from 'svelte';
  import { FIRST_SHOPPING } from '../data/week1';
  import Icon from '../components/Icon.svelte';
  import { loadChecked, saveChecked } from '../lib/repo';

  const LIST_ID = 'vorschau-woche-1';
  let checked = $state<string[]>([]);

  onMount(async () => {
    checked = await loadChecked(LIST_ID);
  });

  const total = FIRST_SHOPPING.reduce((n, s) => n + s.items.length, 0);

  function toggle(id: string): void {
    checked = checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id];
    void saveChecked(LIST_ID, $state.snapshot(checked));
  }

  function reset(): void {
    checked = [];
    void saveChecked(LIST_ID, []);
  }
</script>

<div class="screen">
  <header class="screen-head">
    <div>
      <p class="small muted">Erste Woche</p>
      <h1>Einkauf</h1>
    </div>
    <span class="small muted num">{checked.length} von {total}</span>
  </header>

  <p class="card small muted intro">
    Vorläufige Liste für Lidl. Etwa 45–48 € mit Grundvorrat, danach rund 36,50 € pro Woche. Preise, Vorrat und Bon-Scan kommen mit einem späteren Update.
  </p>

  {#each FIRST_SHOPPING as section (section.title)}
    <h2 class="section-title">{section.title}</h2>
    {#if section.note}<p class="caption muted note">{section.note}</p>{/if}
    <div class="list">
      {#each section.items as item (item.id)}
        {@const on = checked.includes(item.id)}
        <button class="row item" class:on aria-pressed={on} onclick={() => toggle(item.id)}>
          <span class="box" aria-hidden="true">{#if on}<Icon name="check" size={18} />{/if}</span>
          <span class="row-grow">
            {item.label}
            {#if item.hint}<br /><span class="small muted">{item.hint}</span>{/if}
          </span>
          <span class="small muted amount">{item.amount}</span>
        </button>
      {/each}
    </div>
  {/each}

  {#if checked.length}
    <button class="btn btn-ghost" onclick={reset}>Häkchen zurücksetzen</button>
  {/if}
</div>

<style>
  .intro {
    background: transparent;
    border: 1px dashed var(--line-strong);
  }

  .note {
    margin: 0 2px -8px;
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

  .amount {
    text-align: right;
    max-width: 9em;
  }
</style>
