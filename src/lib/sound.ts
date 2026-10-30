// Kurzer Signalton für Timer über Web Audio.
// Safari erlaubt Ton erst nach einer Berührung; unlockSound() wird beim ersten Tippen aufgerufen.

let ctx: AudioContext | null = null;

export function unlockSound(): void {
  try {
    // Kurze Töne über anderer Musik; ob sie auch im Stumm-Modus kommen, wird auf dem iPhone getestet.
    if (navigator.audioSession) navigator.audioSession.type = 'transient';
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Drei kurze Töne */
export function beep(): void {
  if (!ctx) unlockSound();
  if (!ctx) return;
  const start = ctx.currentTime + 0.02;
  for (let i = 0; i < 3; i++) {
    const t = start + i * 0.22;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 2 ? 1175 : 880;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }
  if ('vibrate' in navigator) navigator.vibrate?.([120, 80, 120]);
}
