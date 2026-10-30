<script lang="ts">
  // Feld zum Einfügen einer KI-Antwort. Prüft, ob ein gültiger JSON-Block mit "ok": true drinsteht.
  import { extractJson } from '../lib/ai/extract';
  import Icon from './Icon.svelte';

  interface Props {
    /** Meldung, wenn die Antwort passt */
    describe: (answer: Record<string, unknown>) => string;
  }

  let { describe }: Props = $props();

  let text = $state('');
  let pasteError = $state('');

  // null: noch nichts eingefügt, undefined: eingefügt, aber nicht gültig
  const answer = $derived.by(() => {
    if (!text.trim()) return null;
    const value = extractJson(text);
    if (value && typeof value === 'object' && !Array.isArray(value) && (value as Record<string, unknown>).ok === true) {
      return value as Record<string, unknown>;
    }
    return undefined;
  });

  async function paste(): Promise<void> {
    pasteError = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {
      pasteError = 'Einfügen hat nicht geklappt. Halte den Finger ins Feld und tippe auf „Einfügen“.';
    }
  }
</script>

<div class="stack">
  <button class="btn btn-secondary" onclick={paste}><Icon name="clipboard" size={20} />Antwort einfügen</button>
  <textarea class="input" rows="3" bind:value={text} placeholder="Oder hier einfügen" aria-label="Antwort"></textarea>
  {#if pasteError}
    <p class="result bad"><Icon name="alert-triangle" size={18} /><span>{pasteError}</span></p>
  {:else if answer}
    <p class="result ok"><Icon name="circle-check" size={18} /><span>{describe(answer)}</span></p>
  {:else if answer === undefined}
    <p class="result bad">
      <Icon name="alert-triangle" size={18} /><span>Kein gültiger JSON-Block gefunden. Kopier die ganze Antwort und versuch es noch einmal.</span>
    </p>
  {/if}
</div>

<style>
  textarea {
    resize: vertical;
    min-height: 5.5em;
  }
</style>
