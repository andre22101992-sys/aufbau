<script lang="ts">
  // Claude-Brücke ohne API: Die App stellt die Anfrage zusammen, du teilst sie an die Claude-App
  // oder startest den Kurzbefehl „Aufbau KI“ (Apple Intelligence) und fügst die Antwort wieder ein.
  import Icon from './Icon.svelte';

  interface Props {
    prompt: string;
    /** kürzere Anfrage für Apple Intelligence; fehlt sie, gibt es nur Claude */
    shortPrompt?: string;
    image?: File | null;
    onanswer: (text: string) => void;
  }

  let { prompt, shortPrompt, image = null, onanswer }: Props = $props();

  const SHORTCUT_URL = `shortcuts://run-shortcut?name=${encodeURIComponent('Aufbau KI')}&input=clipboard`;
  let note = $state('');
  let text = $state('');

  async function copy(value: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  async function share(): Promise<void> {
    note = '';
    const data: ShareData = image && navigator.canShare?.({ files: [image], text: prompt }) ? { files: [image], text: prompt } : { text: prompt };
    if (!('share' in navigator)) {
      note = (await copy(prompt)) ? 'Die Anfrage liegt in der Zwischenablage. Füg sie in der Claude-App ein.' : 'Teilen geht hier nicht.';
      return;
    }
    const sharing = navigator.share(data);
    const copied = copy(prompt);
    try {
      await sharing;
      note = 'Schick die Anfrage in der Claude-App ab, kopier die Antwort und füg sie unten ein.';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      note = 'Teilen hat nicht geklappt.';
    }
    if (await copied) note += ' Die Anfrage liegt außerdem in der Zwischenablage.';
  }

  function startShortcut(): void {
    if (!shortPrompt) return;
    void copy(shortPrompt).then((ok) => {
      note = ok ? 'Wenn der Kurzbefehl fertig ist: oben links „◀ Aufbau“, dann „Antwort einfügen“.' : 'Die Zwischenablage war gesperrt.';
    });
  }

  async function paste(): Promise<void> {
    try {
      text = await navigator.clipboard.readText();
      if (text.trim()) onanswer(text);
    } catch {
      note = 'Einfügen hat nicht geklappt. Halte den Finger ins Feld und tippe auf „Einfügen“.';
    }
  }
</script>

<div class="bridge stack">
  <details>
    <summary class="small">Was mitgeschickt wird</summary>
    <pre>{prompt}</pre>
    {#if image}<p class="small muted">Dazu dein Foto.</p>{/if}
  </details>
  <button class="btn btn-primary btn-block" onclick={share}><Icon name="share" size={20} />Mit Claude</button>
  {#if shortPrompt && !image}
    <a class="btn btn-secondary btn-block" href={SHORTCUT_URL} onclick={startShortcut}><Icon name="bolt" size={20} />Mit Apple Intelligence</a>
  {/if}
  {#if note}<p class="small muted">{note}</p>{/if}
  <button class="btn btn-secondary btn-block" onclick={paste}><Icon name="clipboard" size={20} />Antwort einfügen</button>
  <textarea class="input" rows="3" bind:value={text} placeholder="Oder hier einfügen" aria-label="Antwort"></textarea>
  {#if text.trim()}
    <button class="btn btn-ghost" onclick={() => onanswer(text)}>Antwort prüfen</button>
  {/if}
</div>

<style>
  summary {
    color: var(--text-2);
    cursor: pointer;
    min-height: 32px;
  }

  pre {
    white-space: pre-wrap;
    font-size: var(--fs-caption);
    color: var(--text-2);
    background: var(--surface-2);
    padding: 10px;
    border-radius: var(--radius-control);
    max-height: 200px;
    overflow: auto;
  }
</style>
