<script lang="ts">
  // Barcode-Scanner: Strichcode scannen oder eintippen, Werte von Open Food Facts prüfen und als Lebensmittel speichern.
  import { onDestroy } from 'svelte';
  import Icon from '../components/Icon.svelte';
  import { CUSTOM_FOODS_KEY, addCustomFoods, type Food } from '../data/foods';
  import { scanImage, validEan } from '../lib/barcode';
  import { formatDecimal, parseDecimal } from '../lib/numbers';
  import { lookup, type OffProduct } from '../lib/off';
  import { app, setOverride, showToast } from '../lib/state/app.svelte';
  import { goBack } from '../lib/state/router.svelte';

  let video = $state<HTMLVideoElement>();
  let stream = $state.raw<MediaStream | null>(null);
  let status = $state('');
  let ean = $state('');
  let busy = $state(false);
  let product = $state<OffProduct | null>(null);
  let name = $state('');
  let kcal = $state('');
  let protein = $state('');
  let grams = $state('');
  let euro = $state('');
  let timer: ReturnType<typeof setInterval> | undefined;

  async function startCamera(): Promise<void> {
    status = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      status = 'Die Kamera geht hier nicht. Tipp den Barcode unten ein.';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      status = 'Halte den Strichcode ruhig ins Bild.';
      timer = setInterval(scanFrame, 350);
    } catch {
      status = 'Kein Zugriff auf die Kamera. Tipp den Barcode unten ein.';
    }
  }

  function stopCamera(): void {
    clearInterval(timer);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  $effect(() => {
    if (video && stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
  });

  let scanning = false;
  async function scanFrame(): Promise<void> {
    if (!video || scanning || video.videoWidth === 0) return;
    scanning = true;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const g = canvas.getContext('2d', { willReadFrequently: true });
      if (!g) return;
      g.drawImage(video, 0, 0);
      const code = await scanImage(g.getImageData(0, 0, canvas.width, canvas.height));
      if (code) {
        ean = code;
        stopCamera();
        await find();
      }
    } catch {
      status = 'Der Scanner braucht beim ersten Mal Internet zum Laden.';
    } finally {
      scanning = false;
    }
  }

  async function find(): Promise<void> {
    const code = ean.trim();
    if (!validEan(code)) {
      status = 'Das ist kein gültiger Barcode. Prüf die Ziffern.';
      return;
    }
    busy = true;
    status = 'Suche bei Open Food Facts …';
    try {
      product = await lookup(code);
      status = product ? '' : 'Nicht gefunden. Du kannst die Werte von der Packung selbst eintragen.';
      const p = product ?? { ean: code, name: '', kcal: null, protein: null, fiber: null, grams: null };
      product = p;
      name = p.name;
      kcal = p.kcal !== null ? formatDecimal(p.kcal, 1) : '';
      protein = p.protein !== null ? formatDecimal(p.protein, 1) : '';
      grams = p.grams !== null ? String(p.grams) : '';
    } catch {
      status = 'Keine Verbindung. Open Food Facts braucht Internet.';
    } finally {
      busy = false;
    }
  }

  async function save(): Promise<void> {
    const values = [parseDecimal(kcal), parseDecimal(protein), parseDecimal(grams), parseDecimal(euro)];
    if (!name.trim() || values.some((v) => v === null || v < 0)) {
      showToast('Füll Name, kcal, Protein, Packungsgröße und Preis aus.');
      return;
    }
    const [k, p, g, e] = values as number[];
    const food: Food = {
      id: `ean-${product?.ean ?? Date.now()}`,
      name: name.trim(),
      kcal: k,
      protein: p,
      fiber: product?.fiber ?? 0,
      calcium: 0,
      iron: 0,
      vitaminC: 0,
      pack: { grams: g, euro: e, label: `${g} g` },
    };
    const list = Array.isArray(app.overrides[CUSTOM_FOODS_KEY]) ? (app.overrides[CUSTOM_FOODS_KEY] as Food[]) : [];
    await setOverride(CUSTOM_FOODS_KEY, [...$state.snapshot(list).filter((f) => f.id !== food.id), food]);
    addCustomFoods([food]);
    showToast(`${food.name} gespeichert`);
    product = null;
    ean = '';
  }

  onDestroy(stopCamera);
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/einkauf')}><Icon name="chevron-left" /></button>
  </header>
  <h1>Produkt scannen</h1>
  <p class="muted">Für ein neues Produkt scannst du den Strichcode. Die App holt Nährwerte und Packungsgröße von Open Food Facts, du prüfst sie und trägst den Preis ein. Dafür braucht es Internet.</p>

  {#if !product}
    {#if stream}
      <video bind:this={video} class="preview" autoplay playsinline muted></video>
      <button class="btn btn-secondary" onclick={stopCamera}>Kamera aus</button>
    {:else}
      <button class="btn btn-primary btn-block" onclick={startCamera}><Icon name="camera" size={20} />Kamera starten</button>
    {/if}
    <div class="manual">
      <input class="input num" inputmode="numeric" bind:value={ean} placeholder="Barcode eintippen" aria-label="Barcode" />
      <button class="btn btn-secondary" disabled={busy || !ean.trim()} onclick={find}>Suchen</button>
    </div>
  {:else}
    <section class="card stack">
      <p class="small muted num">Barcode {product.ean}</p>
      <label class="field"><span>Name</span><input class="input" bind:value={name} /></label>
      <div class="grid2">
        <label class="field"><span>kcal je 100 g</span><input class="input" inputmode="decimal" bind:value={kcal} /></label>
        <label class="field"><span>Protein je 100 g</span><input class="input" inputmode="decimal" bind:value={protein} /></label>
        <label class="field"><span>Packung (g oder ml)</span><input class="input" inputmode="numeric" bind:value={grams} /></label>
        <label class="field"><span>Preis (€)</span><input class="input" inputmode="decimal" bind:value={euro} placeholder="1,29" /></label>
      </div>
      <p class="caption muted">Nicht jedes Produkt steht vollständig in Open Food Facts. Vergleich die Werte kurz mit der Packung.</p>
      <button class="btn btn-primary btn-block" onclick={save}>Speichern</button>
      <button class="btn btn-ghost btn-block" onclick={() => (product = null)}>Abbrechen</button>
    </section>
  {/if}
  {#if status}<p class="small muted">{status}</p>{/if}
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .preview {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius-control);
    background: #000;
  }

  .manual {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
</style>
