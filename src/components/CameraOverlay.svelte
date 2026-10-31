<script lang="ts">
  // Kamera für Check-in-Fotos: Das letzte Foto der Pose liegt halb durchsichtig darüber, damit du dich gleich hinstellst.
  // Mit Selbstauslöser (10 Sekunden), damit du das iPhone anlehnen und dich hinstellen kannst.
  import { onDestroy, onMount } from 'svelte';
  import { toJpeg } from '../lib/photos';
  import { beep, unlockSound } from '../lib/sound';
  import { keepScreenOn } from '../lib/wakelock';
  import Icon from './Icon.svelte';

  interface Props {
    title: string;
    tip: string;
    /** letztes Foto dieser Pose */
    overlayUrl?: string | null;
    onshot: (blob: Blob) => void;
    onclose: () => void;
  }

  let { title, tip, overlayUrl = null, onshot, onclose }: Props = $props();

  let video = $state<HTMLVideoElement>();
  let stream = $state.raw<MediaStream | null>(null);
  let facing = $state<'user' | 'environment'>('user');
  let error = $state('');
  let count = $state<number | null>(null);
  let showOverlay = $state(true);
  let timer: ReturnType<typeof setInterval> | undefined;
  // Die Selfie-Kamera zeigt wie ein Spiegel; gespeichert wird das Bild unverspiegelt
  const mirrored = $derived(facing === 'user');

  function stop(): void {
    clearInterval(timer);
    count = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  async function start(): Promise<void> {
    stop();
    error = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      error = 'Die Kamera geht hier nicht. Wähle stattdessen ein Foto aus deinen Fotos.';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    } catch {
      error = 'Kein Zugriff auf die Kamera. Erlaube die Kamera in den Einstellungen oder wähle ein Foto aus deinen Fotos.';
    }
  }

  $effect(() => {
    if (video && stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
  });

  onMount(() => {
    void keepScreenOn(true);
    void start();
  });

  onDestroy(() => {
    stop();
    void keepScreenOn(false);
  });

  async function shoot(): Promise<void> {
    if (!video || video.videoWidth === 0) {
      error = 'Die Kamera ist noch nicht bereit. Warte einen Moment.';
      return;
    }
    try {
      onshot(await toJpeg(video));
    } catch {
      error = 'Das Foto hat nicht geklappt. Versuch es noch einmal.';
    }
  }

  function startTimer(): void {
    unlockSound();
    const endsAt = Date.now() + 10_000;
    count = 10;
    timer = setInterval(() => {
      const left = Math.ceil((endsAt - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(timer);
        count = null;
        void shoot();
        return;
      }
      if (left !== count) {
        count = left;
        if (left <= 3) beep();
      }
    }, 200);
  }

  function cancel(): void {
    clearInterval(timer);
    count = null;
  }

  function flip(): void {
    facing = facing === 'user' ? 'environment' : 'user';
    void start();
  }
</script>

<div class="cam" role="dialog" aria-modal="true" aria-label={title}>
  <div class="stage">
    {#if stream}<video bind:this={video} class:mirrored playsinline muted autoplay></video>{/if}
    {#if overlayUrl && showOverlay}<img class="ghost" class:mirrored src={overlayUrl} alt="" />{/if}
    {#if count !== null}<div class="count num" aria-live="assertive">{count}</div>{/if}
    {#if error}<p class="error">{error}</p>{/if}
  </div>

  <header class="top">
    <button class="icon-btn" aria-label="Schließen" onclick={onclose}><Icon name="x" /></button>
    <div>
      <strong>{title}</strong><br />
      <span class="small">{tip}</span>
    </div>
  </header>

  <div class="controls">
    {#if count === null}
      <button class="btn btn-primary btn-block" onclick={startTimer} disabled={!stream}><Icon name="clock" size={20} />Selbstauslöser, 10 Sekunden</button>
      <div class="more">
        <button class="btn btn-secondary" onclick={shoot} disabled={!stream}>Sofort</button>
        <button class="btn btn-secondary" onclick={flip}>Kamera wechseln</button>
      </div>
      {#if overlayUrl}
        <label class="check"><input type="checkbox" bind:checked={showOverlay} /> Letztes Foto einblenden</label>
      {/if}
    {:else}
      <button class="btn btn-danger btn-block" onclick={cancel}>Abbrechen</button>
    {/if}
  </div>
</div>

<style>
  .cam {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    flex-direction: column;
    background: #000;
    color: #fff;
  }

  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  video,
  .ghost {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ghost {
    opacity: 0.35;
    pointer-events: none;
  }

  .mirrored {
    transform: scaleX(-1);
  }

  .top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: calc(var(--safe-top, 0px) + 8px) 12px 24px;
    background: linear-gradient(#000a, #0000);
  }

  .top :global(.icon-btn) {
    color: #fff;
  }

  .count {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 140px;
    font-weight: 700;
    text-shadow: 0 2px 16px #000;
    pointer-events: none;
  }

  .error {
    position: absolute;
    left: 16px;
    right: 16px;
    top: 40%;
    text-align: center;
    background: #000c;
    padding: 12px;
    border-radius: 12px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px calc(var(--safe-bottom, 0px) + 14px);
    background: #000;
  }

  .more {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--fs-small);
  }

  .check input {
    width: 20px;
    height: 20px;
    accent-color: var(--accent-ink);
  }
</style>
