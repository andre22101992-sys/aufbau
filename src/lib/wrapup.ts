// Ruhiger Tagesabschluss am Abend: was heute geklappt hat und womit morgen der Tag beginnt. Kein Vorwurf, kein Punktestand.

import { GOOD_DAY_MEALS } from './rhythm';

export const WRAPUP_FROM_MINUTES = 19 * 60;

export interface WrapUp {
  title: string;
  lines: string[];
}

export interface WrapUpInput {
  /** Mahlzeiten (abgehakt plus Extras) heute und gestern; gestern null, wenn unbekannt */
  today: number;
  yesterday: number | null;
  kcal: number;
  kcalTarget: number;
  /** z. B. „Milch und Banane um 5:30“ */
  tomorrowFirst: string;
}

const plural = (n: number) => `${n} ${n === 1 ? 'Mahlzeit' : 'Mahlzeiten'}`;

export function dayWrapUp(input: WrapUpInput): WrapUp {
  const { today, yesterday, kcal, kcalTarget, tomorrowFirst } = input;
  const lines: string[] = [];
  let title: string;

  if (today === 0) {
    title = 'Heute hat es nicht geklappt, und das ist okay';
    lines.push('Ein Tag ohne Essen ist kein Beinbruch. Wichtig ist, dass du morgen wieder anfängst.');
  } else if (today >= GOOD_DAY_MEALS) {
    title = `Guter Tag: ${plural(today)}`;
  } else {
    title = `${plural(today)} geschafft`;
    lines.push(`Ab ${GOOD_DAY_MEALS} Mahlzeiten zählt ein Tag als gut. Das war ein Schritt in die Richtung.`);
  }

  if (today > 0 && yesterday !== null && today > yesterday) lines.push(`Mehr als gestern (${yesterday}).`);
  if (today > 0) lines.push(`${Math.round(kcal).toLocaleString('de-DE')} von ${kcalTarget.toLocaleString('de-DE')} kcal.`);
  if (tomorrowFirst) lines.push(`Morgen als Erstes: ${tomorrowFirst}.`);
  return { title, lines };
}
