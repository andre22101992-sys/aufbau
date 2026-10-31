// Bewegungen für die Übungs-Figuren. Jede Übung hat mindestens eine Start- und eine Endpose.
// Koordinaten im Bild 240 × 200, Boden bei y = 188, Sitzfläche bei y = 156. Seitenansicht: Blick nach rechts.

import type { Muscle } from './types';
import { FLOOR, SEAT, solve, type FigureDef, type Limb, type Pose, type Region, type Vec } from '../lib/figure';

const STAND: Pose = { hip: [120, 104], torso: 180, arm: { a: 4, b: 4 }, leg: { a: 0, b: 0, c: 90 } };
const SIT: Pose = { hip: [100, 145], torso: 180, arm: { a: 4, b: 4 }, leg: { a: 90, b: 0, c: 90 } };
/** Rückenlage, Kopf links, Knie angewinkelt */
const LIE: Pose = { hip: [150, 176], torso: -90, arm: { a: 80, b: 85 }, armFar: { a: 80, b: 85 }, leg: { a: 140, b: 10, c: 95 } };
const HAND_FLOOR = FLOOR - 4.3;
const HAND_SEAT = SEAT - 4.3;
const TOE_FLOOR = FLOOR - 3.4;

const pose = (base: Pose, change: Partial<Pose>): Pose => ({ ...base, ...change });

/** Liegestütz-Stellung: Beine in Linie mit dem Oberkörper, Fuß zum Boden */
const plank = (torso: number, arm: Limb): Pose => ({ hip: [100, 150], torso, head: -6, arm, leg: { a: torso - 180, b: torso - 180, c: torso - 90 } });

/** Liegestütz-Varianten: Zehen bleiben stehen, die Hände stützen unter der Schulter */
function pushup(surface: 'floor' | 'hands' | 'feet'): FigureDef {
  const setup = {
    floor: { toe: [30, TOE_FLOOR] as Vec, top: 108, bottom: 95, handY: HAND_FLOOR },
    hands: { toe: [20, TOE_FLOOR] as Vec, top: 122, bottom: 108, handY: HAND_SEAT },
    feet: { toe: [50, SEAT - 3.4] as Vec, top: 93, bottom: 83, handY: HAND_FLOOR },
  }[surface];
  const anchor = { joint: 'toe' as const, at: setup.toe };
  const shoulder = solve({ view: 'side', anchor }, plank(setup.top, { a: 0, b: 0 })).neck;
  const hand: Vec = [shoulder[0] + 2, setup.handY];
  const arm: Limb = { to: hand, bend: 1 };
  return {
    view: 'side',
    anchor,
    lowerFirst: true,
    frames: [plank(setup.top, arm), plank(setup.bottom, arm)],
    props: surface === 'hands' ? [{ kind: 'chair', x: hand[0] + 17, back: 0 }] : surface === 'feet' ? [{ kind: 'chair', x: 36, back: 0 }] : [],
  };
}

function pike(): FigureDef {
  const anchor = { joint: 'toe' as const, at: [60, TOE_FLOOR] as Vec };
  const at = (torso: number, arm: Limb): Pose => ({ hip: [90, 110], torso, head: 15, arm, leg: { a: -25, b: -25, c: 65 } });
  const shoulder = solve({ view: 'side', anchor }, at(60, { a: 0, b: 0 })).neck;
  const arm: Limb = { to: [shoulder[0] + 5, HAND_FLOOR], bend: 1 };
  return { view: 'side', anchor, lowerFirst: true, frames: [at(60, arm), at(40, arm)] };
}

/** Vorgebeugt mit einer Hand auf dem Stuhl, Füße in Schrittstellung (Rudern, Kickback) */
const BENT: Pose = {
  hip: [95, 112],
  torso: 100,
  head: -10,
  arm: { a: 2, b: 0 },
  armFar: { to: [163, HAND_SEAT], bend: 1 },
  leg: { to: [112, 184], bend: -1, c: 90 },
  legFar: { to: [64, 184], bend: -1, c: 90 },
};
const BENT_CHAIR = { kind: 'chair' as const, x: 178, back: 1 as const };

function plankHold(): FigureDef {
  const anchor = { joint: 'toe' as const, at: [34, TOE_FLOOR] as Vec };
  const base = plank(101, { a: 0, b: 90 });
  const shoulder = solve({ view: 'side', anchor }, base).neck;
  const p = { ...base, head: -4, arm: { to: [shoulder[0] + 27, HAND_FLOOR] as Vec, bend: 1 as const } };
  return { view: 'side', anchor, hold: true, frames: [p, p] };
}

function hipThrust(): FigureDef {
  const anchor = { joint: 'shoulder' as const, at: [80, 150] as Vec };
  const at = (torso: number): Pose => ({ hip: [130, 160], torso, head: 10, arm: { a: -60, b: -40, s: 0.6 }, leg: { to: [172, 184], bend: -1, c: 90 } });
  // Die Hand liegt auf dem Becken und wandert mit
  const withHand = (torso: number): Pose => {
    const s = solve({ view: 'side', anchor }, at(torso));
    return { ...at(torso), arm: { to: [s.hip[0] - 6, s.hip[1] - 14], bend: 1 } };
  };
  return {
    view: 'side',
    anchor,
    frames: [withHand(-119), withHand(-90)],
    props: [{ kind: 'chair', x: 60, back: -1 }],
    dumbbell: { at: 'hip', grip: 'end' },
  };
}

const end = { at: 'near', grip: 'end' } as const;
const bar = { at: 'near', grip: 'bar' } as const;

export const FIGURES: Record<string, FigureDef> = {
  liegestuetze: pushup('floor'),
  'enge-liegestuetze': pushup('floor'),
  'pike-liegestuetze': pike(),
  bodendruecken: {
    view: 'side',
    lowerFirst: true,
    frames: [pose(LIE, { arm: { a: 180, b: 180 } }), pose(LIE, { arm: { a: 78.5, b: 180 } })],
    dumbbell: end,
  },
  schulterdruecken: {
    view: 'side',
    frames: [pose(SIT, { arm: { a: 30, b: 180, s: 0.75 }, armFar: { a: 20, b: 80 } }), pose(SIT, { arm: { a: 175, b: 178 }, armFar: { a: 20, b: 80 } })],
    props: [{ kind: 'chair', x: 103, back: -1 }],
    dumbbell: end,
  },
  seitheben: {
    view: 'front',
    one: true,
    frames: [
      pose(STAND, { arm: { a: 8, b: 8 }, armFar: { a: 35, b: -45 }, leg: { a: 3, b: 1, c: 80 } }),
      pose(STAND, { arm: { a: 88, b: 92 }, armFar: { a: 35, b: -45 }, leg: { a: 3, b: 1, c: 80 } }),
    ],
    dumbbell: end,
  },
  'trizeps-ueberkopf': {
    view: 'side',
    lowerFirst: true,
    frames: [pose(SIT, { arm: { a: 172, b: -178 } }), pose(SIT, { arm: { a: 165, b: -25 } })],
    props: [{ kind: 'chair', x: 103, back: -1 }],
    dumbbell: { at: 'near', grip: 'bar' },
  },
  rudern: {
    view: 'side',
    frames: [BENT, pose(BENT, { arm: { a: -130, b: 0 } })],
    props: [BENT_CHAIR],
    dumbbell: bar,
    muscles: { primary: ['lats', 'upper'], secondary: ['biceps', 'rdelts'] },
  },
  pullover: {
    view: 'side',
    lowerFirst: true,
    frames: [pose(LIE, { arm: { a: 180, b: 172 }, armFar: undefined }), pose(LIE, { arm: { a: 268, b: 262 }, armFar: undefined })],
    dumbbell: { at: 'near', grip: 'bar' },
    muscles: { primary: ['lats'], secondary: ['chest', 'triceps'] },
  },
  'reverse-flys': {
    view: 'back',
    one: true,
    frames: [
      pose(STAND, { torsoS: 0.55, arm: { a: 6, b: 4 }, armFar: { a: 12, b: -12 }, leg: { a: 6, b: 2, c: 80 } }),
      pose(STAND, { torsoS: 0.55, arm: { a: 85, b: 92 }, armFar: { a: 12, b: -12 }, leg: { a: 6, b: 2, c: 80 } }),
    ],
    dumbbell: end,
    muscles: { primary: ['rdelts', 'upper'], secondary: ['traps'] },
  },
  'bizeps-curl': {
    view: 'side',
    frames: [pose(STAND, { arm: { a: 3, b: 3 } }), pose(STAND, { arm: { a: 12, b: 148 } })],
    dumbbell: end,
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
  },
  'hammer-curl': {
    view: 'side',
    frames: [pose(STAND, { arm: { a: 3, b: 3 } }), pose(STAND, { arm: { a: 12, b: 148 } })],
    dumbbell: bar,
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
  },
  'zottman-curl': {
    view: 'side',
    frames: [pose(STAND, { arm: { a: 3, b: 3 } }), pose(STAND, { arm: { a: 12, b: 148 } })],
    dumbbell: end,
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
  },
  'konzentrations-curl': {
    view: 'side',
    frames: [
      pose(SIT, { torso: 140, head: -25, arm: { a: 5, b: 5 }, armFar: { a: 20, b: 60 } }),
      pose(SIT, { torso: 140, head: -25, arm: { a: 5, b: 150 }, armFar: { a: 20, b: 60 } }),
    ],
    props: [{ kind: 'chair', x: 103, back: -1 }],
    dumbbell: end,
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
  },
  'hammer-curl-kreuz': {
    view: 'front',
    one: true,
    frames: [pose(STAND, { arm: { a: 4, b: 4 }, leg: { a: 3, b: 1, c: 80 } }), pose(STAND, { arm: { a: -8, b: -140 }, leg: { a: 3, b: 1, c: 80 } })],
    dumbbell: end,
    muscles: { primary: ['biceps'], secondary: ['forearms'] },
  },
  kickback: {
    view: 'side',
    frames: [pose(BENT, { arm: { a: -80, b: 0 } }), pose(BENT, { arm: { a: -80, b: -82 } })],
    props: [BENT_CHAIR],
    dumbbell: bar,
  },
  'rudern-pause': {
    view: 'side',
    frames: [BENT, pose(BENT, { arm: { a: -130, b: 0 } })],
    props: [BENT_CHAIR],
    dumbbell: bar,
    muscles: { primary: ['lats', 'upper'], secondary: ['biceps', 'rdelts'] },
  },
  'goblet-kniebeuge': {
    view: 'side',
    lowerFirst: true,
    frames: [
      { hip: [118, 104], torso: 180, arm: { a: 25, b: 165 }, leg: { to: [118, 184], bend: -1, c: 90 } },
      { hip: [100, 140], torso: 160, arm: { a: 42, b: 178 }, leg: { to: [118, 184], bend: -1, c: 90 } },
    ],
    dumbbell: { at: 'near', grip: 'vertical' },
    muscles: { primary: ['quads', 'glutes'], secondary: ['abs'] },
  },
  'sumo-kniebeuge': {
    view: 'front',
    lowerFirst: true,
    frames: [
      { hip: [120, 107], torso: 180, arm: { a: -8, b: -8 }, leg: { to: [150, 184], bend: -1, c: 70 } },
      { hip: [120, 140], torso: 180, arm: { a: -6, b: -6 }, leg: { to: [150, 184], bend: -1, c: 70 } },
    ],
    dumbbell: { at: 'between', grip: 'vertical' },
    muscles: { primary: ['quads', 'glutes'], secondary: ['hams'] },
  },
  bulgarische: {
    view: 'side',
    lowerFirst: true,
    frames: [
      { hip: [108, 108], torso: 178, arm: { a: 4, b: 4 }, leg: { to: [128, 184], bend: -1, c: 90 }, legFar: { to: [62, 148], bend: -1, c: -80 } },
      { hip: [104, 140], torso: 170, arm: { a: 4, b: 4 }, leg: { to: [128, 184], bend: -1, c: 90 }, legFar: { to: [62, 148], bend: -1, c: -80 } },
    ],
    props: [{ kind: 'chair', x: 52, back: -1 }],
    dumbbell: bar,
  },
  'rdl-einbeinig': {
    view: 'side',
    lowerFirst: true,
    frames: [
      { hip: [118, 104], torso: 180, arm: { a: 2, b: 2 }, leg: { a: 0, b: 0, c: 90 }, legFar: { to: [118, 184], bend: -1, c: 90 } },
      { hip: [102, 110], torso: 95, head: -15, arm: { a: 0, b: 0 }, leg: { a: -88, b: -88, c: -5 }, legFar: { to: [118, 184], bend: -1, c: 90 } },
    ],
    dumbbell: bar,
    muscles: { primary: ['hams', 'glutes'], secondary: ['lower'] },
  },
  wadenheben: {
    view: 'side',
    anchor: { joint: 'toe', at: [133, TOE_FLOOR] },
    frames: [
      { ...STAND, arm: { to: [164, 66], bend: 1 }, armFar: { a: 3, b: 3 }, legFar: { a: 15, b: -70, c: 10 } },
      { ...STAND, arm: { to: [164, 58], bend: 1 }, armFar: { a: 3, b: 3 }, leg: { a: 0, b: 0, c: 45 }, legFar: { a: 15, b: -70, c: 10 } },
    ],
    props: [{ kind: 'wall', x: 168 }],
    dumbbell: { at: 'far', grip: 'bar' },
    muscles: { primary: ['calves'] },
  },
  unterarmstuetz: { ...plankHold(), muscles: { primary: ['abs'], secondary: ['obliques'] } },
  'arnold-press': {
    view: 'front',
    one: true,
    frames: [
      { hip: [120, 139], torso: 180, arm: { a: -12, b: 178, s: 0.6, s2: 1 }, armFar: { a: 15, b: -60 }, leg: { a: 15, b: 0, c: 80, s: 0.25, s2: 1 } },
      { hip: [120, 139], torso: 180, arm: { a: 80, b: 175 }, armFar: { a: 15, b: -60 }, leg: { a: 15, b: 0, c: 80, s: 0.25, s2: 1 } },
      { hip: [120, 139], torso: 180, arm: { a: 165, b: 172 }, armFar: { a: 15, b: -60 }, leg: { a: 15, b: 0, c: 80, s: 0.25, s2: 1 } },
    ],
    props: [{ kind: 'chairFront', x: 120 }],
    dumbbell: end,
  },
  'seitheben-gelehnt': {
    view: 'front',
    one: true,
    frames: [
      { hip: [100, 104], torso: 168, arm: { a: 2, b: 2 }, armFar: { to: [78, 100], bend: 1 }, leg: { a: -6, b: -6, c: 80 }, legFar: { a: 4, b: 4, c: 80 } },
      { hip: [100, 104], torso: 168, arm: { a: 90, b: 94 }, armFar: { to: [78, 100], bend: 1 }, leg: { a: -6, b: -6, c: 80 }, legFar: { a: 4, b: 4, c: 80 } },
    ],
    props: [{ kind: 'chairFront', x: 70 }],
    dumbbell: end,
  },
  'flys-boden': {
    view: 'top',
    one: true,
    lowerFirst: true,
    frames: [
      { hip: [120, 112], torso: 180, arm: { a: 60, b: 60, s: 0.25 }, armFar: { a: 10, b: 10 }, leg: { a: 3, b: 3, c: 0 } },
      { hip: [120, 112], torso: 180, arm: { a: 92, b: 100 }, armFar: { a: 10, b: 10 }, leg: { a: 3, b: 3, c: 0 } },
    ],
    props: [{ kind: 'mat' }],
    dumbbell: bar,
    muscles: { primary: ['chest'], secondary: ['delts'] },
  },
  'ausfallschritte-rueckwaerts': {
    view: 'side',
    lowerFirst: true,
    frames: [
      { hip: [128, 104], torso: 180, arm: { a: 3, b: 3 }, leg: { to: [130, 184], bend: -1, c: 90 }, legFar: { to: [126, 184], bend: -1, c: 90 } },
      { hip: [104, 146], torso: 176, arm: { a: 3, b: 3 }, leg: { to: [130, 184], bend: -1, c: 90 }, legFar: { to: [64, 178], bend: -1, c: 25 } },
    ],
    dumbbell: bar,
  },
  'skull-crusher': {
    view: 'side',
    lowerFirst: true,
    frames: [pose(LIE, { arm: { a: 180, b: 180 } }), pose(LIE, { arm: { a: 180, b: 315 } })],
    dumbbell: end,
  },
  'hip-thrust-stuhl': { ...hipThrust(), muscles: { primary: ['glutes'], secondary: ['hams'] } },
  'bodendruecken-pause': {
    view: 'side',
    lowerFirst: true,
    frames: [pose(LIE, { arm: { a: 180, b: 180 } }), pose(LIE, { arm: { a: 78.5, b: 180 } })],
    dumbbell: end,
  },
  'y-heben': {
    view: 'side',
    levelHolds: [0.4, 2, 3],
    frames: [
      { hip: [110, 177], torso: 90, head: 8, arm: { a: 98, b: 98 }, leg: { a: -90, b: -90, c: -95 } },
      { hip: [110, 177], torso: 99, head: -2, arm: { a: 112, b: 112 }, leg: { a: -90, b: -90, c: -95 } },
    ],
    muscles: { primary: ['upper', 'traps'], secondary: ['rdelts', 'lower'] },
  },
  seitstuetz: {
    view: 'front',
    hold: true,
    anchor: { joint: 'ankle', at: [205, 176] },
    frames: [
      { hip: [130, 150], torso: 250, arm: { a: 70, b: 70 }, armFar: { a: 0, b: -90 }, leg: { a: 70, b: 70, c: 160 }, legFar: { a: -70, b: -70, c: -160 } },
      { hip: [130, 150], torso: 250, arm: { a: 70, b: 70 }, armFar: { a: 0, b: -90 }, leg: { a: 70, b: 70, c: 160 }, legFar: { a: -70, b: -70, c: -160 } },
    ],
    muscles: { primary: ['obliques'], secondary: ['abs'] },
  },
};

/** Liegestütze passen sich der Stufe an: Hände auf dem Stuhl, Boden, Füße auf dem Stuhl */
const LEVEL_FIGURES: Record<string, (level: number) => FigureDef> = {
  liegestuetze: (level) => pushup(level === 0 ? 'hands' : level >= 3 ? 'feet' : 'floor'),
  'enge-liegestuetze': (level) => pushup(level === 0 ? 'hands' : level >= 3 ? 'feet' : 'floor'),
};

export function figureFor(exerciseId: string, level?: number): FigureDef | undefined {
  const byLevel = LEVEL_FIGURES[exerciseId];
  if (byLevel && level !== undefined) return byLevel(level);
  return FIGURES[exerciseId];
}

const BY_MUSCLE: Record<Muscle, Region[]> = {
  brust: ['chest'],
  ruecken: ['lats', 'upper'],
  schultern: ['delts'],
  bizeps: ['biceps'],
  trizeps: ['triceps'],
  beine: ['quads', 'glutes'],
  bauch: ['abs'],
};

/** Hauptmuskeln und helfende Muskeln für Figur und Muskelkarte */
export function musclesFor(exercise: { id: string; primary: Muscle; secondary: Muscle[] }): { primary: Region[]; secondary: Region[] } {
  const custom = FIGURES[exercise.id]?.muscles;
  if (custom) return { primary: custom.primary, secondary: custom.secondary ?? [] };
  const primary = BY_MUSCLE[exercise.primary];
  const secondary = exercise.secondary.flatMap((m) => BY_MUSCLE[m]).filter((r) => !primary.includes(r));
  return { primary, secondary };
}
