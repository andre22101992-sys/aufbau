<script lang="ts">
  // Check-in: Maße messen und drei Fotos machen. Das letzte Foto der Pose liegt beim Fotografieren halb durchsichtig über der Kamera.
  import { onDestroy } from 'svelte';
  import CameraOverlay from '../components/CameraOverlay.svelte';
  import Icon from '../components/Icon.svelte';
  import { MEASURES, POSES, parseMeasures, withPhoto, type MeasureKey, type Pose } from '../lib/checkin';
  import { formatDate, todayKey } from '../lib/dates';
  import { toJpeg } from '../lib/photos';
  import { getPhoto } from '../lib/repo';
  import { app, showToast } from '../lib/state/app.svelte';
  import { saveCheckinEntry } from '../lib/state/body.svelte';
  import { goBack } from '../lib/state/router.svelte';
  import { formatDecimal } from '../lib/numbers';

  const today = todayKey();
  const existing = app.checkins.find((e) => e.date === today);

  let measures = $state<Partial<Record<MeasureKey, string>>>(
    Object.fromEntries(MEASURES.map((m) => [m.key, existing?.[m.key] !== undefined ? formatDecimal(existing[m.key]!, 1, 1) : ''])),
  );
  let shots = $state.raw<Partial<Record<Pose, Blob>>>({});
  let urls = $state.raw<Partial<Record<Pose, string>>>({});
  let cameraPose = $state<Pose | null>(null);
  let overlayUrl = $state<string | null>(null);
  let error = $state('');
  let saving = $state(false);
  const owned: string[] = [];

  // Fotos von heute, falls der Check-in schon einmal gespeichert wurde
  void (async () => {
    for (const pose of POSES) {
      const id = existing?.photos[pose.id];
      const blob = id ? await getPhoto(id) : null;
      if (blob) show(pose.id, blob);
    }
  })();

  function show(pose: Pose, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    owned.push(url);
    urls = { ...urls, [pose]: url };
  }

  onDestroy(() => owned.forEach((u) => URL.revokeObjectURL(u)));

  async function openCamera(pose: Pose): Promise<void> {
    const last = withPhoto(app.checkins, pose).find((e) => e.date !== today);
    const blob = last?.photos[pose] ? await getPhoto(last.photos[pose]!) : null;
    if (blob) {
      overlayUrl = URL.createObjectURL(blob);
      owned.push(overlayUrl);
    } else {
      overlayUrl = null;
    }
    cameraPose = pose;
  }

  function onShot(blob: Blob): void {
    if (!cameraPose) return;
    shots = { ...shots, [cameraPose]: blob };
    show(cameraPose, blob);
    cameraPose = null;
  }

  async function pick(pose: Pose, event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const blob = await toJpeg(file);
      shots = { ...shots, [pose]: blob };
      show(pose, blob);
    } catch {
      error = 'Das Foto konnte nicht gelesen werden. Versuch ein anderes.';
    }
  }

  async function save(): Promise<void> {
    error = '';
    const parsed = parseMeasures($state.snapshot(measures));
    if (!parsed.ok) {
      error = parsed.error;
      return;
    }
    if (Object.keys(parsed.values).length === 0 && Object.keys(shots).length === 0 && !existing) {
      error = 'Trag mindestens ein Maß ein oder mach ein Foto.';
      return;
    }
    saving = true;
    try {
      await saveCheckinEntry(today, parsed.values, shots);
      showToast('Check-in gespeichert');
      goBack('/fortschritt');
    } catch {
      error = 'Speichern hat nicht geklappt. Versuch es noch einmal.';
    } finally {
      saving = false;
    }
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/fortschritt')}><Icon name="chevron-left" /></button>
  </header>
  <h1>Check-in</h1>
  <p class="muted">{formatDate(today)}. Mach ihn möglichst morgens, locker und unter gleichen Bedingungen wie beim letzten Mal. Die Fotos bleiben auf diesem iPhone.</p>

  <h2 class="section-title">Maße</h2>
  <section class="card stack">
    {#each MEASURES as m (m.key)}
      <label class="field">
        <span>{m.label} (cm)</span>
        <input class="input" inputmode="decimal" placeholder="z. B. 31,5" bind:value={measures[m.key]} />
        <span class="caption muted">{m.how}</span>
      </label>
    {/each}
  </section>

  <h2 class="section-title">Fotos</h2>
  <p class="small muted">Stell das iPhone auf Brusthöhe an, zum Beispiel an eine Flasche gelehnt. Der Selbstauslöser gibt dir 10 Sekunden. Am besten immer dasselbe Licht und dieselbe Stelle.</p>
  <div class="poses">
    {#each POSES as pose (pose.id)}
      <section class="card stack pose">
        <div class="thumb">
          {#if urls[pose.id]}<img src={urls[pose.id]} alt="Foto {pose.label}" />{:else}<span class="muted small">{pose.label}</span>{/if}
        </div>
        <p class="caption muted">{pose.tip}</p>
        <button class="btn btn-secondary" onclick={() => openCamera(pose.id)}><Icon name="camera" size={18} />{urls[pose.id] ? 'Neu aufnehmen' : 'Aufnehmen'}</button>
        <label class="btn btn-ghost">
          Aus Fotos wählen
          <input class="sr-only" type="file" accept="image/*" onchange={(e) => pick(pose.id, e)} />
        </label>
      </section>
    {/each}
  </div>

  {#if error}<p class="result bad"><Icon name="alert-triangle" size={18} /><span>{error}</span></p>{/if}
  <button class="btn btn-primary btn-block" onclick={save} disabled={saving}>Check-in speichern</button>
</div>

{#if cameraPose}
  {@const pose = POSES.find((p) => p.id === cameraPose)!}
  <CameraOverlay title={pose.label} tip={pose.tip} {overlayUrl} onshot={onShot} onclose={() => (cameraPose = null)} />
{/if}

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .poses {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .thumb {
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-control);
    background: var(--surface-2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
