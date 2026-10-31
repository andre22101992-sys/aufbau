<script lang="ts">
  // Bon übernehmen: Text per „Text scannen“ einlesen (offline) oder Foto an Claude, dann prüfen und übernehmen.
  import AiBridge from '../components/AiBridge.svelte';
  import Icon from '../components/Icon.svelte';
  import { FOODS, getFood } from '../data/foods';
  import { receiptPrompt } from '../lib/ai/prompts';
  import { parseReceiptAnswer } from '../lib/ai/schemas';
  import { todayKey } from '../lib/dates';
  import { formatDecimal } from '../lib/numbers';
  import { itemsSum, normalize, parseReceiptText, withMatches, type ReceiptLine } from '../lib/receipt';
  import { loadChecked, saveChecked } from '../lib/repo';
  import { currentPrice, shoppingDay } from '../lib/shopping';
  import { showToast } from '../lib/state/app.svelte';
  import { go, goBack } from '../lib/state/router.svelte';
  import { importReceipt, loadShop, shop } from '../lib/state/shop.svelte';

  void loadShop();

  let way = $state<'text' | 'foto'>('text');
  let text = $state('');
  let photo = $state.raw<File | null>(null);
  let photoInput = $state<HTMLInputElement>();
  let error = $state('');
  let lines = $state<ReceiptLine[] | null>(null);
  let total = $state<number | null>(null);
  /** Zuordnungen, die du selbst geändert hast; die merkt sich die App */
  let learned = $state<Record<string, string>>({});

  const sum = $derived(lines ? itemsSum({ items: lines, total }) : 0);
  const matches = $derived(lines !== null && total !== null && Math.abs(sum - total) < 0.015);

  function readText(): void {
    const parsed = withMatches(parseReceiptText(text), shop.aliases);
    if (!parsed.items.length) {
      error = 'Im Text habe ich keine Artikel mit Preisen gefunden. Versuch es mit Claude oder Apple Intelligence.';
      return;
    }
    error = '';
    lines = parsed.items;
    total = parsed.total;
  }

  function answer(raw: string): void {
    const result = parseReceiptAnswer(raw);
    if (!result.ok) {
      error = result.error;
      return;
    }
    error = '';
    lines = withMatches({ items: result.value.items, total: result.value.total }, shop.aliases).items;
    total = result.value.total;
  }

  function assign(index: number, foodId: string): void {
    if (!lines) return;
    lines[index].foodId = foodId || undefined;
    learned[normalize(lines[index].text)] = foodId || '-';
  }

  async function accept(): Promise<void> {
    if (!lines) return;
    const day = shoppingDay(todayKey());
    const checked = await loadChecked(day);
    const bought = await importReceipt($state.snapshot(lines) as ReceiptLine[], total ?? sum, checked, $state.snapshot(learned));
    await saveChecked(day, [...new Set([...checked, ...bought])]);
    showToast('Bon übernommen: Preise, Ausgaben und Vorrat sind aktuell');
    go('/einkauf', true);
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/einkauf')}><Icon name="chevron-left" /></button>
  </header>
  <h1>Bon übernehmen</h1>

  {#if !lines}
    <div class="ways" role="radiogroup" aria-label="Weg">
      <button role="radio" aria-checked={way === 'text'} class:selected={way === 'text'} onclick={() => (way = 'text')}>Text scannen</button>
      <button role="radio" aria-checked={way === 'foto'} class:selected={way === 'foto'} onclick={() => (way = 'foto')}>Foto an Claude</button>
    </div>

    {#if way === 'text'}
      <p class="small muted">
        Tipp ins Feld und wähl am iPhone „Text scannen“, dann halt die Kamera auf den Bon. Oder kopier den Text aus einem Foto bzw. einem Lidl-Plus-Screenshot
        (lange auf den Text drücken). Das geht ohne Internet.
      </p>
      <textarea class="input" rows="8" bind:value={text} placeholder="Bon-Text hier einfügen" aria-label="Bon-Text"></textarea>
      <button class="btn btn-primary btn-block" disabled={!text.trim()} onclick={readText}>Selbst auslesen</button>
      {#if text.trim()}
        <details>
          <summary class="small">Klappt nicht? Mit Apple Intelligence oder Claude sortieren</summary>
          <AiBridge prompt={receiptPrompt(text)} shortPrompt={receiptPrompt(text, true)} onanswer={answer} />
        </details>
      {/if}
    {:else}
      <p class="small muted">Fotografier den Bon oder wähl einen Lidl-Plus-Screenshot. Deck vorher die Zahlungsdaten ab.</p>
      <button class="btn btn-secondary" onclick={() => photoInput?.click()}><Icon name="camera" size={20} />{photo ? 'Anderes Foto' : 'Foto aufnehmen oder wählen'}</button>
      <input bind:this={photoInput} class="sr-only" type="file" accept="image/*" onchange={(e) => (photo = e.currentTarget.files?.[0] ?? null)} />
      {#if photo}<AiBridge prompt={receiptPrompt()} image={photo} onanswer={answer} />{/if}
    {/if}
    {#if error}<p class="result bad"><Icon name="alert-triangle" size={18} /><span>{error}</span></p>{/if}
  {:else}
    <p class="small muted">Prüf die Zuordnung. Was du änderst, merkt sich die App für den nächsten Bon.</p>
    <div class="list">
      {#each lines as line, i (i)}
        <div class="row review">
          <span class="row-grow">
            {line.text}
            <select class="input select" value={line.foodId ?? ''} onchange={(e) => assign(i, e.currentTarget.value)} aria-label="Zuordnung für {line.text}">
              <option value="">Kein Lebensmittel aus dem Plan</option>
              {#each FOODS as f (f.id)}<option value={f.id}>{f.name}</option>{/each}
            </select>
          </span>
          <span class="num price">
            {formatDecimal(line.euro, 2, 2)} €
            {#if line.foodId}
              {@const old = currentPrice(line.foodId, shop.prices)}
              {#if Math.abs(old - line.euro) > 0.009 && line.euro < old * 3}<br /><span class="small muted">vorher {formatDecimal(old, 2, 2)}</span>{/if}
            {/if}
          </span>
        </div>
      {/each}
    </div>
    <section class="card totals">
      <p>Summe Artikel <span class="num">{formatDecimal(sum, 2, 2)} €</span></p>
      <p>Summe Bon <span class="num">{total !== null ? `${formatDecimal(total, 2, 2)} €` : 'nicht erkannt'}</span></p>
      {#if total !== null}
        <p class={matches ? 'ok' : 'bad'}>{matches ? 'Passt' : `Abweichung ${formatDecimal(Math.abs(sum - total), 2, 2)} €: Prüf, ob ein Artikel fehlt oder doppelt ist.`}</p>
      {/if}
    </section>
    <button class="btn btn-primary btn-block" onclick={accept}>Übernehmen</button>
    <button class="btn btn-ghost btn-block" onclick={() => (lines = null)}>Verwerfen</button>
    <p class="caption muted">Preise, Ausgaben und Vorrat werden aktualisiert, gekaufte Artikel auf der Liste abgehakt. {getFood('oel').name} und Gewürze zählen nicht zum Budget.</p>
  {/if}
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .ways {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 4px;
    background: var(--surface-1);
    border-radius: var(--radius-control);
  }

  .ways button {
    min-height: 40px;
    border-radius: 8px;
    color: var(--text-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }

  .ways button.selected {
    background: var(--surface-3);
    color: var(--text);
  }

  summary {
    color: var(--text-2);
    cursor: pointer;
    min-height: 36px;
  }

  .review {
    align-items: flex-start;
  }

  .select {
    margin-top: 6px;
    min-height: 36px;
    padding-block: 4px;
    font-size: 16px;
  }

  .price {
    text-align: right;
    flex: none;
  }

  .totals p {
    display: flex;
    justify-content: space-between;
  }

  .ok {
    color: var(--accent-ink);
  }

  .bad {
    color: var(--warn);
  }
</style>
