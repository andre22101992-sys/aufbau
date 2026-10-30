// Trainingsblöcke: Block 1 (Woche 1–8) und Block 2 (Woche 9–16).
// Gleicher Buchstabe bei „superset“ = die beiden Übungen laufen im Wechsel.

import type { Block, DayId } from './types';

export const DAY_TITLES: Record<DayId, string> = {
  mo: 'Brust, Schulter, Trizeps',
  di: 'Rücken und Bizeps',
  mi: 'Beine und Bauch',
  do: 'Arme und Schultern',
  fr: 'Brust und Rücken',
};

export const BLOCK_1: Block = {
  id: 'block-1',
  name: 'Block 1',
  firstWeek: 1,
  lastWeek: 8,
  days: {
    mo: {
      id: 'mo',
      title: DAY_TITLES.mo,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'liegestuetze', sets: 4, min: 6, max: 15, restSec: 90 },
        { exerciseId: 'bodendruecken', sets: 3, min: 8, max: 15, restSec: 90 },
        { exerciseId: 'schulterdruecken', sets: 3, min: 8, max: 12, restSec: 90 },
        { exerciseId: 'seitheben', sets: 3, min: 12, max: 20, restSec: 60, superset: 'A' },
        { exerciseId: 'trizeps-ueberkopf', sets: 3, min: 10, max: 15, restSec: 60, superset: 'A' },
      ],
    },
    di: {
      id: 'di',
      title: DAY_TITLES.di,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'rudern', sets: 4, min: 8, max: 15, restSec: 90 },
        { exerciseId: 'reverse-flys', sets: 3, min: 12, max: 20, restSec: 60, superset: 'A' },
        { exerciseId: 'bizeps-curl', sets: 3, min: 8, max: 12, restSec: 60, superset: 'A' },
        { exerciseId: 'pullover', sets: 3, min: 10, max: 15, restSec: 60, superset: 'B' },
        { exerciseId: 'hammer-curl', sets: 3, min: 10, max: 15, restSec: 60, superset: 'B' },
      ],
    },
    mi: {
      id: 'mi',
      title: DAY_TITLES.mi,
      warmup: 'beine',
      slots: [
        { exerciseId: 'goblet-kniebeuge', sets: 3, min: 10, max: 20, restSec: 90 },
        { exerciseId: 'bulgarische', sets: 3, min: 8, max: 12, restSec: 90 },
        { exerciseId: 'rdl-einbeinig', sets: 3, min: 8, max: 12, restSec: 90 },
        { exerciseId: 'wadenheben', sets: 2, min: 12, max: 20, restSec: 60, superset: 'A' },
        { exerciseId: 'unterarmstuetz', sets: 3, min: 30, max: 60, restSec: 60, superset: 'A' },
      ],
    },
    do: {
      id: 'do',
      title: DAY_TITLES.do,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'arnold-press', sets: 3, min: 8, max: 12, restSec: 90 },
        { exerciseId: 'seitheben-gelehnt', sets: 3, min: 12, max: 20, restSec: 60 },
        { exerciseId: 'konzentrations-curl', sets: 3, min: 8, max: 15, restSec: 60, superset: 'A' },
        { exerciseId: 'kickback', sets: 3, min: 12, max: 15, restSec: 60, superset: 'A' },
        { exerciseId: 'enge-liegestuetze', sets: 3, min: 6, max: 15, restSec: 60, superset: 'B' },
        { exerciseId: 'hammer-curl-kreuz', sets: 2, min: 10, max: 15, restSec: 60, superset: 'B' },
      ],
    },
    fr: {
      id: 'fr',
      title: DAY_TITLES.fr,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'liegestuetze', sets: 4, min: 6, max: 15, restSec: 90 },
        { exerciseId: 'rudern', sets: 4, min: 8, max: 15, restSec: 90 },
        { exerciseId: 'flys-boden', sets: 3, min: 12, max: 15, restSec: 60, superset: 'A' },
        { exerciseId: 'reverse-flys', sets: 2, min: 15, max: 20, restSec: 60, superset: 'A' },
        { exerciseId: 'pullover', sets: 3, min: 10, max: 15, restSec: 60 },
      ],
    },
  },
};

export const BLOCK_2: Block = {
  id: 'block-2',
  name: 'Block 2',
  firstWeek: 9,
  lastWeek: 16,
  days: {
    mo: {
      id: 'mo',
      title: DAY_TITLES.mo,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'liegestuetze', sets: 4, min: 5, max: 12, restSec: 90 },
        { exerciseId: 'bodendruecken-pause', sets: 3, min: 6, max: 12, restSec: 90 },
        { exerciseId: 'arnold-press', sets: 3, min: 8, max: 12, restSec: 90 },
        { exerciseId: 'seitheben', sets: 3, min: 15, max: 25, restSec: 60, superset: 'A' },
        { exerciseId: 'skull-crusher', sets: 3, min: 8, max: 12, restSec: 60, superset: 'A' },
      ],
    },
    di: {
      id: 'di',
      title: DAY_TITLES.di,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'rudern-pause', sets: 4, min: 6, max: 12, restSec: 90 },
        { exerciseId: 'reverse-flys', sets: 3, min: 15, max: 25, restSec: 60, superset: 'A' },
        { exerciseId: 'zottman-curl', sets: 3, min: 8, max: 12, restSec: 60, superset: 'A' },
        { exerciseId: 'pullover', sets: 3, min: 8, max: 12, restSec: 60, superset: 'B' },
        { exerciseId: 'hammer-curl', sets: 3, min: 8, max: 12, restSec: 60, superset: 'B' },
      ],
    },
    mi: {
      id: 'mi',
      title: DAY_TITLES.mi,
      warmup: 'beine',
      slots: [
        { exerciseId: 'bulgarische', sets: 3, min: 8, max: 12, restSec: 90 },
        { exerciseId: 'goblet-kniebeuge', sets: 3, min: 12, max: 20, restSec: 90 },
        { exerciseId: 'hip-thrust-stuhl', sets: 3, min: 10, max: 15, restSec: 90 },
        { exerciseId: 'wadenheben', sets: 2, min: 15, max: 25, restSec: 60, superset: 'A' },
        { exerciseId: 'seitstuetz', sets: 3, min: 20, max: 45, restSec: 60, superset: 'A' },
      ],
    },
    do: {
      id: 'do',
      title: DAY_TITLES.do,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'schulterdruecken', sets: 3, min: 6, max: 10, restSec: 90 },
        { exerciseId: 'seitheben-gelehnt', sets: 3, min: 15, max: 25, restSec: 60 },
        { exerciseId: 'konzentrations-curl', sets: 3, min: 6, max: 12, restSec: 60, superset: 'A' },
        { exerciseId: 'trizeps-ueberkopf', sets: 3, min: 8, max: 12, restSec: 60, superset: 'A' },
        { exerciseId: 'enge-liegestuetze', sets: 3, min: 5, max: 12, restSec: 60, superset: 'B' },
        { exerciseId: 'hammer-curl-kreuz', sets: 2, min: 12, max: 15, restSec: 60, superset: 'B' },
      ],
    },
    fr: {
      id: 'fr',
      title: DAY_TITLES.fr,
      warmup: 'oberkoerper',
      slots: [
        { exerciseId: 'liegestuetze', sets: 4, min: 5, max: 12, restSec: 90 },
        { exerciseId: 'rudern', sets: 4, min: 6, max: 12, restSec: 90 },
        { exerciseId: 'flys-boden', sets: 3, min: 12, max: 15, restSec: 60, superset: 'A' },
        { exerciseId: 'y-heben', sets: 2, min: 10, max: 15, restSec: 60, superset: 'A' },
        { exerciseId: 'pullover', sets: 3, min: 8, max: 12, restSec: 60 },
      ],
    },
  },
};

export const BLOCKS: Block[] = [BLOCK_1, BLOCK_2];
