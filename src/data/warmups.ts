// Aufwärmen, etwa 5 Minuten. Danach folgt ein leichter Satz der ersten Hantelübung.

import type { Warmup, WarmupId } from './types';

export const WARMUPS: Record<WarmupId, Warmup> = {
  oberkoerper: {
    id: 'oberkoerper',
    title: 'Oberkörper aufwärmen',
    items: [
      { name: 'Auf der Stelle gehen oder Hampelmann', seconds: 60 },
      { name: 'Armkreisen', seconds: 30, detail: 'Erst klein, dann größer, beide Richtungen.' },
      { name: 'Schulterkreisen', seconds: 30 },
      { name: 'Schulterblätter zusammenziehen', seconds: 30, detail: 'Arme nach vorn, dann Ellbogen nach hinten ziehen.' },
      { name: 'Liegestütze an der Wand', seconds: 45, detail: '10 ruhige Wiederholungen.' },
      { name: 'Oberkörper drehen', seconds: 30 },
    ],
  },
  beine: {
    id: 'beine',
    title: 'Beine aufwärmen',
    items: [
      { name: 'Auf der Stelle gehen', seconds: 60 },
      { name: 'Kniebeugen ohne Gewicht', seconds: 45, detail: '10 ruhige Wiederholungen.' },
      { name: 'Ausfallschritte im Wechsel', seconds: 60, detail: '5 pro Seite.' },
      { name: 'Hüftkreisen', seconds: 30 },
      { name: 'Beinpendel', seconds: 30, detail: 'An der Wand festhalten, jedes Bein vor und zurück.' },
      { name: 'Wadenheben', seconds: 30, detail: '15 Wiederholungen.' },
    ],
  },
};

export const WARMUP_SET_HINT = 'Mach vor der ersten Hantelübung einen leichten Satz mit etwa der Hälfte des Gewichts und 10 Wiederholungen.';
