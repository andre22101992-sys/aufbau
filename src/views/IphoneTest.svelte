<script lang="ts">
  // Einmaliger Test auf dem iPhone: Ton, Bildschirm, Kamera, Teilen an Claude, Kurzbefehl, Kalender und offline.
  import { onDestroy, onMount } from 'svelte';
  import AnswerCheck from '../components/AnswerCheck.svelte';
  import Icon from '../components/Icon.svelte';
  import { toKey } from '../lib/dates';
  import { buildIcs } from '../lib/ics';
  import { downloadFile, isStandalone, shareOrDownload, uid } from '../lib/platform';
  import { beep, unlockSound } from '../lib/sound';
  import { goBack } from '../lib/state/router.svelte';
  import { keepScreenOn } from '../lib/wakelock';

  const SHORTCUT_URL = `shortcuts://run-shortcut?name=${encodeURIComponent('Aufbau KI')}&input=clipboard`;

  const CLAUDE_PROMPT = [
    'Test aus meiner Trainings-App „Aufbau“. Antworte nur mit diesem JSON-Block, ohne weiteren Text:',
    '```json',
    '{"ok": true, "bild": "<was auf dem Bild zu sehen ist, in wenigen Worten>"}',
    '```',
  ].join('\n');

  const SHORTCUT_PROMPT = 'Antworte nur mit JSON, ohne weiteren Text: {"ok": true, "satz": "<ein kurzer Satz auf Deutsch über Muskelaufbau>"}';

  const standalone = isStandalone();
  let offlineReady = $state<boolean | null>(null);
  let persisted = $state<boolean | null>(null);

  let soundLeft = $state(0);
  let soundPlayed = $state(false);
  let soundTimer: ReturnType<typeof setInterval> | undefined;

  let screenState = $state<'idle' | 'on' | 'failed' | 'done'>('idle');
  let screenLeft = $state(0);
  let screenTimer: ReturnType<typeof setInterval> | undefined;

  let video = $state<HTMLVideoElement>();
  let stream = $state.raw<MediaStream | null>(null);
  let cameraError = $state('');
  let photoInput = $state<HTMLInputElement>();
  let photo = $state.raw<File | null>(null);
  let photoUrl = $state('');
  let testImage = $state.raw<File | null>(null);

  let shareNote = $state('');
  let shortcutNote = $state('');
  let calendarNote = $state('');

  onMount(async () => {
    testImage = await makeTestImage();
    offlineReady = Boolean((await navigator.serviceWorker?.getRegistration())?.active);
    persisted = (await navigator.storage?.persisted?.()) ?? null;
  });

  onDestroy(() => {
    clearInterval(soundTimer);
    clearInterval(screenTimer);
    if (screenState === 'on') void keepScreenOn(false);
    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });

  $effect(() => {
    if (video && stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
  });

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /** Meldet alle 250 ms die verbleibenden Sekunden, zuletzt 0. Rechnet mit der Uhrzeit, wie die Pausen-Timer. */
  function countdown(seconds: number, onTick: (left: number) => void): ReturnType<typeof setInterval> {
    const endsAt = Date.now() + seconds * 1000;
    onTick(seconds);
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (left === 0) clearInterval(id);
      onTick(left);
    }, 250);
    return id;
  }

  function soundTest(seconds: number): void {
    unlockSound();
    clearInterval(soundTimer);
    soundPlayed = false;
    soundTimer = countdown(seconds, (left) => {
      soundLeft = left;
      if (left === 0 && !soundPlayed) {
        beep();
        soundPlayed = true;
      }
    });
  }

  async function screenTest(): Promise<void> {
    clearInterval(screenTimer);
    if (!(await keepScreenOn(true))) {
      screenState = 'failed';
      return;
    }
    screenState = 'on';
    screenTimer = countdown(120, (left) => {
      screenLeft = left;
      if (left === 0) stopScreen('done');
    });
  }

  function stopScreen(next: 'idle' | 'done'): void {
    clearInterval(screenTimer);
    void keepScreenOn(false);
    screenState = next;
  }

  async function startCamera(): Promise<void> {
    cameraError = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraError = 'Die Live-Kamera wird hier nicht unterstützt.';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      cameraError =
        name === 'NotAllowedError'
          ? 'Zugriff abgelehnt. Tipp noch einmal auf den Knopf und erlaube die Kamera.'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'Keine passende Kamera gefunden.'
            : `Die Kamera startet nicht (${name || 'unbekannter Fehler'}).`;
    }
  }

  function stopCamera(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  function pickPhoto(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photo = file;
    photoUrl = URL.createObjectURL(file);
  }

  /** Testbild mit den drei Balken aus dem App-Symbol, falls du kein eigenes Foto gewählt hast */
  async function makeTestImage(): Promise<File | null> {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const g = canvas.getContext('2d');
    if (!g) return null;
    g.fillStyle = '#0F1012';
    g.fillRect(0, 0, 600, 400);
    g.fillStyle = '#C6F432';
    [140, 210, 280].forEach((height, i) => {
      g.beginPath();
      g.roundRect(170 + i * 95, 330 - height, 70, height, 12);
      g.fill();
    });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ? new File([blob], 'aufbau-test.png', { type: 'image/png' }) : null;
  }

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function shareToClaude(): Promise<void> {
    shareNote = '';
    const file = photo ?? testImage;
    const data: ShareData =
      file && navigator.canShare?.({ files: [file], text: CLAUDE_PROMPT }) ? { files: [file], text: CLAUDE_PROMPT } : { text: CLAUDE_PROMPT };
    if (!('share' in navigator)) {
      shareNote = (await copy(CLAUDE_PROMPT)) ? 'Teilen geht hier nicht. Die Anfrage liegt in der Zwischenablage.' : 'Teilen geht hier nicht.';
      return;
    }
    // Erst teilen, solange das Antippen noch frisch ist, dann zusätzlich in die Zwischenablage
    const sharing = navigator.share(data);
    const copied = copy(CLAUDE_PROMPT);
    try {
      await sharing;
      shareNote = data.files ? 'Geteilt. Prüf in Claude, ob Bild und Text angekommen sind.' : 'Nur der Text wurde geteilt, ein Bild kann dein iPhone hier nicht mitschicken.';
    } catch (err) {
      const name = err instanceof DOMException ? err.name : 'Fehler';
      if (name === 'AbortError') return;
      shareNote = `Teilen hat nicht geklappt (${name}).`;
    }
    shareNote += (await copied) ? ' Die Anfrage liegt außerdem in der Zwischenablage.' : ' Die Zwischenablage war gesperrt.';
  }

  function startShortcut(): void {
    // Die Anfrage kommt in die Zwischenablage, danach öffnet der Link die Kurzbefehle-App
    void copy(SHORTCUT_PROMPT).then((ok) => {
      shortcutNote = ok
        ? 'Zurück kommst du oben links über „◀ Aufbau“.'
        : 'Die Zwischenablage war gesperrt. Tipp auf „Nur Anfrage kopieren“ und starte den Kurzbefehl selbst.';
    });
  }

  async function copyShortcutPrompt(): Promise<void> {
    shortcutNote = (await copy(SHORTCUT_PROMPT)) ? 'Kopiert. Starte jetzt „Aufbau KI“ in der Kurzbefehle-App.' : 'Kopieren hat nicht geklappt.';
  }

  function testEventFile(): File {
    const at = new Date(Date.now() + 5 * 60_000);
    const time = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
    const ics = buildIcs([
      {
        uid: `test-${uid()}@aufbau`,
        summary: 'Aufbau: Test-Erinnerung',
        description: 'Test aus der App. Du kannst den Termin löschen.',
        firstDate: toKey(at),
        time,
        durationMin: 5,
        rrule: 'FREQ=DAILY;COUNT=1',
        alarmMinutesBefore: 0,
      },
    ]);
    return new File([ics], 'aufbau-test.ics', { type: 'text/calendar' });
  }

  async function calendarTest(viaShare: boolean): Promise<void> {
    const file = testEventFile();
    if (viaShare) {
      if ((await shareOrDownload(file)) === 'cancelled') return;
    } else {
      downloadFile(file);
    }
    calendarNote = 'Landet der Termin im Kalender, kommt in etwa 5 Minuten die Erinnerung.';
  }
</script>

<div class="screen">
  <header class="top">
    <button class="icon-btn" aria-label="Zurück" onclick={() => goBack('/einstellungen')}><Icon name="chevron-left" /></button>
  </header>
  <h1>iPhone-Test</h1>
  <p class="muted">Prüf hier einmal, ob auf deinem iPhone alles klappt, und notier dir, was nicht funktioniert.</p>

  <section class="card status">
    <p class="result" class:ok={standalone} class:bad={!standalone}>
      <Icon name={standalone ? 'circle-check' : 'alert-triangle'} size={18} />
      <span>{standalone ? 'Vom Home-Bildschirm geöffnet' : 'In Safari geöffnet. Öffne die App für den Test über das Symbol auf dem Home-Bildschirm.'}</span>
    </p>
    {#if offlineReady !== null}
      <p class="result" class:ok={offlineReady} class:bad={!offlineReady}>
        <Icon name={offlineReady ? 'circle-check' : 'alert-triangle'} size={18} />
        <span>{offlineReady ? 'Für offline gespeichert' : 'Noch nicht für offline gespeichert. Schließ die App und öffne sie neu.'}</span>
      </p>
    {/if}
    {#if persisted !== null}
      <p class="result" class:ok={persisted} class:bad={!persisted}>
        <Icon name={persisted ? 'circle-check' : 'alert-triangle'} size={18} />
        <span>{persisted ? 'Dauerhafter Speicher aktiv' : 'Kein dauerhafter Speicher. Du kannst ihn in den Einstellungen anfragen.'}</span>
      </p>
    {/if}
  </section>

  <h2 class="section-title">Timer-Ton</h2>
  <section class="card stack">
    <p class="small muted">Schalt das iPhone auf lautlos. Der Ton soll trotzdem kommen, so wie am Ende einer Satzpause.</p>
    <div class="pair">
      <button class="btn btn-primary" onclick={() => soundTest(10)} disabled={soundLeft > 0}><Icon name="volume" size={20} />In 10 Sekunden</button>
      <button class="btn btn-secondary" onclick={() => soundTest(0)}>Sofort</button>
    </div>
    {#if soundLeft > 0}
      <p class="result num"><Icon name="clock" size={18} /><span>Noch {soundLeft} s, lass die App offen.</span></p>
    {:else if soundPlayed}
      <p class="result"><Icon name="info-circle" size={18} /><span>Ton gespielt. Hast du drei Töne gehört?</span></p>
    {/if}
  </section>

  <h2 class="section-title">Bildschirm bleibt an</h2>
  <section class="card stack">
    <p class="small muted">Im Training soll das Display nicht ausgehen. Starte den Test und leg das iPhone 2 Minuten hin, ohne es zu berühren.</p>
    {#if screenState === 'on'}
      <p class="result num"><Icon name="clock" size={18} /><span>Noch {mmss(screenLeft)}</span></p>
      <button class="btn btn-secondary" onclick={() => stopScreen('idle')}>Test beenden</button>
    {:else}
      <button class="btn btn-primary" onclick={screenTest}><Icon name="sun" size={20} />Test starten</button>
    {/if}
    {#if screenState === 'failed'}
      <p class="result bad"><Icon name="alert-triangle" size={18} /><span>Das iPhone lässt die App den Bildschirm nicht anlassen.</span></p>
    {:else if screenState === 'done'}
      <p class="result"><Icon name="info-circle" size={18} /><span>Fertig. War der Bildschirm die ganze Zeit an?</span></p>
    {/if}
  </section>

  <h2 class="section-title">Kamera</h2>
  <section class="card stack">
    <p class="small muted">Für den Barcode-Scanner und das Foto-Overlay braucht die App die Live-Kamera.</p>
    {#if stream}
      <video bind:this={video} class="preview" autoplay playsinline muted></video>
      <p class="result ok"><Icon name="circle-check" size={18} /><span>Die Live-Kamera läuft.</span></p>
      <button class="btn btn-secondary" onclick={stopCamera}>Kamera ausschalten</button>
    {:else}
      <button class="btn btn-primary" onclick={startCamera}><Icon name="camera" size={20} />Live-Kamera starten</button>
    {/if}
    {#if cameraError}
      <p class="result bad"><Icon name="alert-triangle" size={18} /><span>{cameraError}</span></p>
    {/if}
    <p class="small muted">Bons und Essen fotografierst du mit der normalen Kamera oder wählst ein Bild aus deinen Fotos.</p>
    <button class="btn btn-secondary" onclick={() => photoInput?.click()}>Foto aufnehmen oder wählen</button>
    <input bind:this={photoInput} class="sr-only" type="file" accept="image/*" onchange={pickPhoto} />
    {#if photoUrl}
      <img class="thumb" src={photoUrl} alt="Dein Testfoto" />
      <p class="small muted">Dieses Foto geht im nächsten Test an Claude.</p>
    {/if}
  </section>

  <h2 class="section-title">Teilen an die Claude-App</h2>
  <section class="card stack">
    <p class="small muted">
      Die App teilt {photo ? 'dein Foto' : 'ein Testbild'} und eine kurze Anfrage. Wähl im Teilen-Menü die Claude-App und schick die Anfrage ab. Kopier
      dann Claudes Antwort und füg sie hier ein.
    </p>
    <button class="btn btn-primary" onclick={shareToClaude}><Icon name="share" size={20} />An Claude teilen</button>
    {#if shareNote}
      <p class="result"><Icon name="info-circle" size={18} /><span>{shareNote}</span></p>
    {/if}
    <AnswerCheck describe={(a) => `Antwort erkannt. Claude sieht: ${String(a.bild ?? 'kein Bild')}`} />
  </section>

  <h2 class="section-title">Kurzbefehl „Aufbau KI“</h2>
  <section class="card stack">
    <p class="small muted">Über diesen Kurzbefehl nutzt die App Apple Intelligence. Leg ihn einmal an und teste ihn dann.</p>
    <details class="howto">
      <summary><span class="row-grow">So legst du ihn an</span><Icon name="chevron-right" size={18} /></summary>
      <ol>
        <li>Öffne die App „Kurzbefehle“ und tippe auf „+“.</li>
        <li>Nenn den Kurzbefehl „Aufbau KI“, genau so geschrieben.</li>
        <li>Füg die Aktion „Zwischenablage abrufen“ hinzu.</li>
        <li>Füg die Aktion „Modell verwenden“ hinzu. Wähl „Auf dem Gerät“ und setz als Anfrage die „Zwischenablage“ ein.</li>
        <li>Füg die Aktion „In Zwischenablage kopieren“ hinzu und setz die Antwort des Modells ein.</li>
        <li>Tippe auf „Fertig“.</li>
      </ol>
      <p class="small muted">Fehlt „Modell verwenden“, schalte Apple Intelligence ein: Einstellungen → Apple Intelligence & Siri.</p>
    </details>
    <a class="btn btn-primary" href={SHORTCUT_URL} onclick={startShortcut}><Icon name="bolt" size={20} />Kurzbefehl starten</a>
    <button class="btn btn-ghost" onclick={copyShortcutPrompt}>Nur Anfrage kopieren</button>
    {#if shortcutNote}
      <p class="result"><Icon name="info-circle" size={18} /><span>{shortcutNote}</span></p>
    {/if}
    <AnswerCheck describe={(a) => `Antwort erkannt: ${String(a.satz ?? '')}`} />
  </section>

  <h2 class="section-title">Kalender</h2>
  <section class="card stack">
    <p class="small muted">Lädt einen einzelnen Test-Termin in 5 Minuten. Probier beide Wege, dann weißt du, welcher klappt.</p>
    <button class="btn btn-primary" onclick={() => calendarTest(true)}><Icon name="calendar" size={20} />Über das Teilen-Menü</button>
    <button class="btn btn-secondary" onclick={() => calendarTest(false)}>Als Datei öffnen</button>
    {#if calendarNote}
      <p class="result"><Icon name="info-circle" size={18} /><span>{calendarNote}</span></p>
    {/if}
  </section>

  <h2 class="section-title">Zum Schluss: offline</h2>
  <section class="card">
    <p class="small muted">
      Schalt den Flugmodus ein und schließ die App ganz: vom unteren Rand nach oben wischen und die App wegschieben. Öffne sie dann wieder. Startet sie, klappt
      alles offline.
    </p>
  </section>
</div>

<style>
  .top {
    margin: 0 -8px -8px;
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pair {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 10px;
  }

  .preview {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius-control);
    background: #000;
  }

  .thumb {
    width: 50%;
    border-radius: var(--radius-control);
  }

  .howto summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: var(--tap);
    font-weight: 600;
    cursor: pointer;
    list-style: none;
  }

  .howto summary::-webkit-details-marker {
    display: none;
  }

  .howto[open] summary :global(.icon) {
    transform: rotate(90deg);
  }

  .howto ol {
    margin: 0 0 10px;
    padding-left: 1.4em;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
</style>
