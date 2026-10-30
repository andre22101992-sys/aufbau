// Tabler-Icons (MIT), lokal eingebunden, damit sie offline funktionieren.

import activity from '../assets/icons/activity.svg?raw';
import alertTriangle from '../assets/icons/alert-triangle.svg?raw';
import arrowBackUp from '../assets/icons/arrow-back-up.svg?raw';
import arrowsExchange from '../assets/icons/arrows-exchange.svg?raw';
import barbell from '../assets/icons/barbell.svg?raw';
import bolt from '../assets/icons/bolt.svg?raw';
import calendar from '../assets/icons/calendar.svg?raw';
import chartLine from '../assets/icons/chart-line.svg?raw';
import check from '../assets/icons/check.svg?raw';
import chevronLeft from '../assets/icons/chevron-left.svg?raw';
import chevronRight from '../assets/icons/chevron-right.svg?raw';
import circle from '../assets/icons/circle.svg?raw';
import circleCheck from '../assets/icons/circle-check.svg?raw';
import clock from '../assets/icons/clock.svg?raw';
import deviceMobile from '../assets/icons/device-mobile.svg?raw';
import download from '../assets/icons/download.svg?raw';
import flame from '../assets/icons/flame.svg?raw';
import infoCircle from '../assets/icons/info-circle.svg?raw';
import listCheck from '../assets/icons/list-check.svg?raw';
import minus from '../assets/icons/minus.svg?raw';
import moon from '../assets/icons/moon.svg?raw';
import notes from '../assets/icons/notes.svg?raw';
import pencil from '../assets/icons/pencil.svg?raw';
import playerPause from '../assets/icons/player-pause.svg?raw';
import playerPlay from '../assets/icons/player-play.svg?raw';
import playerSkipForward from '../assets/icons/player-skip-forward.svg?raw';
import plus from '../assets/icons/plus.svg?raw';
import refresh from '../assets/icons/refresh.svg?raw';
import scale from '../assets/icons/scale.svg?raw';
import settings from '../assets/icons/settings.svg?raw';
import share from '../assets/icons/share.svg?raw';
import shieldCheck from '../assets/icons/shield-check.svg?raw';
import shoppingCart from '../assets/icons/shopping-cart.svg?raw';
import stretching from '../assets/icons/stretching.svg?raw';
import sun from '../assets/icons/sun.svg?raw';
import toolsKitchen from '../assets/icons/tools-kitchen-2.svg?raw';
import trophy from '../assets/icons/trophy.svg?raw';
import upload from '../assets/icons/upload.svg?raw';
import x from '../assets/icons/x.svg?raw';

// Größe kommt aus dem CSS, deshalb die festen 24px entfernen
const clean = (svg: string) => svg.replace(/\s(width|height)="24"/g, '').replace(/\sclass="[^"]*"/, '');

export const ICONS = {
  activity: clean(activity),
  'alert-triangle': clean(alertTriangle),
  'arrow-back-up': clean(arrowBackUp),
  'arrows-exchange': clean(arrowsExchange),
  barbell: clean(barbell),
  bolt: clean(bolt),
  calendar: clean(calendar),
  'chart-line': clean(chartLine),
  check: clean(check),
  'chevron-left': clean(chevronLeft),
  'chevron-right': clean(chevronRight),
  circle: clean(circle),
  'circle-check': clean(circleCheck),
  clock: clean(clock),
  'device-mobile': clean(deviceMobile),
  download: clean(download),
  flame: clean(flame),
  'info-circle': clean(infoCircle),
  'list-check': clean(listCheck),
  minus: clean(minus),
  moon: clean(moon),
  notes: clean(notes),
  pencil: clean(pencil),
  'player-pause': clean(playerPause),
  'player-play': clean(playerPlay),
  'player-skip-forward': clean(playerSkipForward),
  plus: clean(plus),
  refresh: clean(refresh),
  scale: clean(scale),
  settings: clean(settings),
  share: clean(share),
  'shield-check': clean(shieldCheck),
  'shopping-cart': clean(shoppingCart),
  stretching: clean(stretching),
  sun: clean(sun),
  'tools-kitchen-2': clean(toolsKitchen),
  trophy: clean(trophy),
  upload: clean(upload),
  x: clean(x),
} as const;

export type IconName = keyof typeof ICONS;
