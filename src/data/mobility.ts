// Ruhetag-Programm: etwa 10 Minuten Beweglichkeit, freiwillig. Übungen mit zwei Seiten stehen zweimal drin.

export interface MobilityStep {
  name: string;
  seconds: number;
  side?: 'links' | 'rechts';
  cues: string[];
}

const both = (step: Omit<MobilityStep, 'side'>): MobilityStep[] => [
  { ...step, side: 'links' },
  { ...step, side: 'rechts' },
];

export const MOBILITY: MobilityStep[] = [
  {
    name: 'Katze-Kuh',
    seconds: 90,
    cues: ['Vierfüßlerstand, Hände unter den Schultern.', 'Ausatmen: Rücken rund machen, Kinn zur Brust.', 'Einatmen: Rücken sanft durchhängen lassen, Blick nach vorn.'],
  },
  ...both({
    name: 'Drehung des oberen Rückens',
    seconds: 45,
    cues: ['Vierfüßlerstand, eine Hand an den Hinterkopf.', 'Den Ellbogen zur Decke drehen, dem Ellbogen nachschauen.', 'Langsam zurück, das Becken bleibt ruhig.'],
  }),
  ...both({
    name: 'Hüftbeuger-Dehnung im Halbknien',
    seconds: 45,
    cues: ['Ein Knie am Boden, der andere Fuß vorn.', 'Po anspannen und die Hüfte leicht nach vorn schieben.', 'Vorn in der Leiste des hinteren Beins dehnt es.'],
  }),
  ...both({
    name: 'Ausfallschritt mit Drehung',
    seconds: 40,
    cues: ['Großer Schritt nach vorn, hinteres Knie Richtung Boden.', 'Den Oberkörper zum vorderen Bein drehen, Arme öffnen.', 'Ein paar ruhige Atemzüge, dann zurück.'],
  }),
  {
    name: 'Schulterkreisen mit Handtuch',
    seconds: 60,
    cues: ['Ein Handtuch weit gefasst mit beiden Händen halten.', 'Gestreckte Arme langsam über den Kopf nach hinten und zurück führen.', 'Nur so weit, wie es ohne Schmerz geht.'],
  },
  {
    name: 'Kindhaltung',
    seconds: 90,
    cues: ['Auf die Fersen setzen, Oberkörper nach vorn ablegen.', 'Arme lang nach vorn, Stirn auf den Boden.', 'Ruhig in den Rücken atmen.'],
  },
];

export const MOBILITY_MINUTES = Math.round(MOBILITY.reduce((sum, s) => sum + s.seconds + 5, 0) / 60);
