/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svg?raw' {
  const content: string;
  export default content;
}

// Audio Session API (Safari): sorgt dafür, dass Töne auch im Stumm-Modus abgespielt werden.
interface AudioSession {
  type: 'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record';
}

interface Navigator {
  readonly audioSession?: AudioSession;
  /** Nur Safari auf iOS: true, wenn die Web-App vom Home-Bildschirm gestartet wurde. */
  readonly standalone?: boolean;
}
