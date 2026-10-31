// Figuren-Generator: rechnet aus Gelenkwinkeln eine Figur und zeichnet sie als SVG-Pfade.
// Winkel in Grad: 0 = nach unten, 90 = nach vorn (in Blickrichtung), 180 = nach oben, −90 = nach hinten.
// Von vorn und von hinten gilt dasselbe für die rechte Bildhälfte, die linke wird gespiegelt (90 = nach außen).

export type Vec = [number, number];

/** side: von der Seite, Blick nach rechts · front/back: von vorn/hinten · top: liegend von oben */
export type View = 'side' | 'front' | 'back' | 'top';

export type Region =
  | 'chest'
  | 'delts'
  | 'rdelts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'traps'
  | 'upper'
  | 'lats'
  | 'lower'
  | 'glutes'
  | 'quads'
  | 'hams'
  | 'calves';

/** Gliedmaße über Winkel: a = Oberarm/Oberschenkel, b = Unterarm/Unterschenkel, c = Fuß; s, s2 verkürzen (zeigt zur Kamera) */
export interface AngleLimb {
  a: number;
  b: number;
  c?: number;
  s?: number;
  s2?: number;
}

/** Gliedmaße über einen Zielpunkt für Hand bzw. Knöchel; bend legt fest, zu welcher Seite Ellbogen oder Knie zeigen */
export interface IkLimb {
  to: Vec;
  bend: 1 | -1;
  c?: number;
}

export type Limb = AngleLimb | IkLimb;

export interface Pose {
  /** Becken */
  hip: Vec;
  /** Richtung Becken → Schulter */
  torso: number;
  /** Verkürzung des Oberkörpers, z. B. vorgebeugt von hinten gesehen */
  torsoS?: number;
  /** Kopfneigung gegenüber dem Oberkörper */
  head?: number;
  /** Rundung des Rückens: + Buckel, − Hohlkreuz */
  bend?: number;
  arm: Limb;
  /** fehlt er, macht der zweite Arm dasselbe (von vorn: gespiegelt) */
  armFar?: Limb;
  leg: Limb;
  legFar?: Limb;
}

export type Joint = 'hip' | 'shoulder' | 'knee' | 'ankle' | 'toe';

export type Prop =
  /** back: Seite der Lehne; 0 = ohne Lehne (als Ablage) */
  | { kind: 'chair'; x: number; back: 1 | -1 | 0 }
  | { kind: 'chairFront'; x: number }
  | { kind: 'mat' }
  | { kind: 'wall'; x: number };

export interface Dumbbell {
  /** near: Hand vorn/rechts · far: andere Hand · between: zwischen beiden Händen · hip: auf dem Becken */
  at: 'near' | 'far' | 'between' | 'hip';
  /** bar: Stange quer zum Unterarm sichtbar · end: Hantel von der Stirnseite · vertical: senkrecht */
  grip: 'bar' | 'end' | 'vertical';
}

export interface FigureDef {
  view: View;
  /** Start … Ende der Bewegung; mindestens 2 */
  frames: Pose[];
  /** Die erste Bewegung ist das Absenken (Liegestütze, Kniebeuge, Drücken) */
  lowerFirst?: boolean;
  /** Dieses Gelenk bleibt stehen, z. B. die Zehen beim Liegestütz */
  anchor?: { joint: Joint; at: Vec };
  props?: Prop[];
  dumbbell?: Dumbbell;
  /** Halteübung ohne Bewegung */
  hold?: boolean;
  /** Von vorn/hinten nur die rechte Seite hervorheben (einarmige Übungen) */
  one?: boolean;
  /** Sekunden oben halten je Stufe (z. B. Y-Heben) */
  levelHolds?: number[];
  /** Überschreibt die Muskeln aus der Übung */
  muscles?: { primary: Region[]; secondary?: Region[] };
}

export const L = { torso: 56, neck: 8, head: 11, upper: 30, fore: 27, thigh: 41, shin: 39, foot: 13, shoulderHalf: 17, hipHalf: 9 };
export const FLOOR = 188;
export const SEAT = 156;
export const VIEW_W = 240;
export const VIEW_H = 200;

const rad = (deg: number) => (deg * Math.PI) / 180;
export const dir = (deg: number): Vec => [Math.sin(rad(deg)), Math.cos(rad(deg))];
const add = (p: Vec, v: Vec, s = 1): Vec => [p[0] + v[0] * s, p[1] + v[1] * s];
const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
const len = (v: Vec) => Math.hypot(v[0], v[1]);
const norm = (v: Vec): Vec => {
  const l = len(v) || 1;
  return [v[0] / l, v[1] / l];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const isIk = (limb: Limb): limb is IkLimb => 'to' in limb;

// ---------- Bewegung ----------

function lerpLimb(a: Limb, b: Limb, t: number): Limb {
  if (isIk(a) && isIk(b)) return { to: lerpV(a.to, b.to, t), bend: a.bend, c: lerp(a.c ?? 90, b.c ?? 90, t) };
  if (!isIk(a) && !isIk(b)) {
    return { a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t), c: lerp(a.c ?? 90, b.c ?? 90, t), s: lerp(a.s ?? 1, b.s ?? 1, t), s2: lerp(a.s2 ?? a.s ?? 1, b.s2 ?? b.s ?? 1, t) };
  }
  return t < 0.5 ? a : b;
}

const optLimb = (a: Limb | undefined, b: Limb | undefined, t: number) => (a && b ? lerpLimb(a, b, t) : t < 0.5 ? a : b);

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerpV(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    torsoS: lerp(a.torsoS ?? 1, b.torsoS ?? 1, t),
    head: lerp(a.head ?? 0, b.head ?? 0, t),
    bend: lerp(a.bend ?? 0, b.bend ?? 0, t),
    arm: lerpLimb(a.arm, b.arm, t),
    armFar: optLimb(a.armFar, b.armFar, t),
    leg: lerpLimb(a.leg, b.leg, t),
    legFar: optLimb(a.legFar, b.legFar, t),
  };
}

/** Pose an der Stelle p (0 = Start, 1 = Ende) über alle Zwischenbilder */
export function poseAt(def: FigureDef, p: number): Pose {
  const n = def.frames.length;
  const x = Math.min(1, Math.max(0, p)) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  return lerpPose(def.frames[i], def.frames[i + 1], x - i);
}

// ---------- Skelett ----------

export interface Skeleton {
  view: View;
  hip: Vec;
  neck: Vec;
  head: Vec;
  /** Kontrollpunkt der Rücken-Kurve (Seitenansicht) */
  ctrl: Vec;
  /** Einheitsvektor Becken → Schulter und die Senkrechte dazu (vorn bzw. rechte Bildhälfte) */
  td: Vec;
  tn: Vec;
  /** Schulter, Ellbogen, Hand */
  arm: [Vec, Vec, Vec];
  armFar: [Vec, Vec, Vec];
  /** Hüfte, Knie, Knöchel, Zehen */
  leg: [Vec, Vec, Vec, Vec];
  legFar: [Vec, Vec, Vec, Vec];
  /** false, wenn ein Zielpunkt außer Reichweite lag */
  reachable: boolean;
}

const FAR_OFFSET: Vec = [-2.5, -1.5];

/** Zwei-Gelenk-Kette zum Zielpunkt; gibt Mittelgelenk und Endpunkt zurück */
function solveIk(root: Vec, target: Vec, l1: number, l2: number, bend: 1 | -1): { mid: Vec; end: Vec; ok: boolean } {
  const d = sub(target, root);
  const dist = len(d);
  const ok = dist <= l1 + l2 + 1.5 && dist >= Math.abs(l1 - l2) - 0.5;
  const reach = Math.min(Math.max(dist, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const u = norm(d);
  const a = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mid = add(add(root, u, a), [-u[1] * bend, u[0] * bend], h);
  return { mid, end: ok ? target : add(root, u, reach), ok };
}

/** mirror = −1 für die linke Bildhälfte von vorn/hinten */
function chain(root: Vec, limb: Limb, l1: number, l2: number, mirror: 1 | -1): { mid: Vec; end: Vec; ok: boolean } {
  if (isIk(limb)) return solveIk(root, limb.to, l1, l2, limb.bend);
  const m = (deg: number) => dir(deg * mirror);
  const mid = add(root, m(limb.a), l1 * (limb.s ?? 1));
  return { mid, end: add(mid, m(limb.b), l2 * (limb.s2 ?? limb.s ?? 1)), ok: true };
}

function mirrorLimb(limb: Limb, axisX: number): Limb {
  if (isIk(limb)) return { to: [2 * axisX - limb.to[0], limb.to[1]], bend: (limb.bend * -1) as 1 | -1, c: limb.c };
  return limb;
}

export function solve(def: Pick<FigureDef, 'view' | 'anchor'>, pose: Pose): Skeleton {
  const flat = def.view !== 'side';
  const td = dir(pose.torso);
  const tn: Vec = [-td[1], td[0]];
  let hip = pose.hip;
  let ok = true;

  const footLen = flat ? 8 : L.foot;
  const legRoots = (h: Vec): [Vec, Vec] => (flat ? [add(h, tn, L.hipHalf), add(h, tn, -L.hipHalf)] : [h, add(h, FAR_OFFSET)]);

  const legOf = (root: Vec, limb: Limb, mirror: 1 | -1): [Vec, Vec, Vec, Vec] => {
    const c = chain(root, limb, L.thigh, L.shin, mirror);
    ok &&= c.ok;
    const footDir = dir((limb.c ?? 90) * mirror);
    return [root, c.mid, c.end, add(c.end, footDir, footLen)];
  };

  // Anker: zuerst Becken, Schulter und Beine rechnen, dann alles so verschieben, dass das Gelenk stehen bleibt
  if (def.anchor) {
    const [nearRoot] = legRoots(hip);
    const leg = isIk(pose.leg) ? null : legOf(nearRoot, pose.leg, 1);
    const shoulder = add(hip, td, L.torso * (pose.torsoS ?? 1));
    const joints: Record<Joint, Vec | undefined> = { hip, shoulder, knee: leg?.[1], ankle: leg?.[2], toe: leg?.[3] };
    const current = joints[def.anchor.joint];
    if (current) hip = add(hip, sub(def.anchor.at, current));
  }

  const neck = add(hip, td, L.torso * (pose.torsoS ?? 1));
  const headDist = (L.neck + L.head) * Math.max(0.6, pose.torsoS ?? 1);
  const head = add(neck, dir(pose.torso + (pose.head ?? 0)), headDist);
  const ctrl = add(lerpV(hip, neck, 0.5), tn, -(pose.bend ?? 0));

  const [legRoot, legRootFar] = legRoots(hip);
  const leg = legOf(legRoot, pose.leg, 1);
  // Von der Seite liegt die hintere Seite leicht versetzt; Zielpunkte wandern mit
  const shiftFar = (limb: Limb): Limb => (!flat && isIk(limb) ? { ...limb, to: add(limb.to, FAR_OFFSET) } : limb);
  const legFarLimb = shiftFar(pose.legFar ?? (flat ? mirrorLimb(pose.leg, hip[0]) : pose.leg));
  const legFar = legOf(legRootFar, flat && !pose.legFar ? legFarLimb : legFarLimb, flat ? -1 : 1);

  const armRoot = flat ? add(neck, tn, L.shoulderHalf) : neck;
  const armRootFar = flat ? add(neck, tn, -L.shoulderHalf) : add(neck, FAR_OFFSET);
  const armOf = (root: Vec, limb: Limb, mirror: 1 | -1): [Vec, Vec, Vec] => {
    const c = chain(root, limb, L.upper, L.fore, mirror);
    ok &&= c.ok;
    return [root, c.mid, c.end];
  };
  const arm = armOf(armRoot, pose.arm, 1);
  const armFarLimb = shiftFar(pose.armFar ?? (flat ? mirrorLimb(pose.arm, hip[0]) : pose.arm));
  const armFar = armOf(armRootFar, armFarLimb, flat ? -1 : 1);

  return { view: def.view, hip, neck, head, ctrl, td, tn, arm, armFar, leg, legFar, reachable: ok };
}

// ---------- Zeichnen ----------

export type Tone = 'floor' | 'prop' | 'mat' | 'far' | 'body' | 'hi' | 'hi2' | 'eq' | 'eqDark';

export interface Shape {
  tone: Tone;
  d: string;
}

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const pt = (p: Vec) => `${f(p[0])},${f(p[1])}`;

/** Glied mit runden Enden, am Anfang r1 dick, am Ende r2 */
export function capsule(p: Vec, q: Vec, r1: number, r2: number): string {
  const n = (() => {
    const d = norm(sub(q, p));
    return [-d[1], d[0]] as Vec;
  })();
  const A = add(p, n, r1);
  const B = add(q, n, r2);
  const C = add(q, n, -r2);
  const D = add(p, n, -r1);
  return `M${pt(A)}L${pt(B)}A${f(r2)} ${f(r2)} 0 0 0 ${pt(C)}L${pt(D)}A${f(r1)} ${f(r1)} 0 0 0 ${pt(A)}Z`;
}

export function circle(c: Vec, r: number): string {
  return `M${f(c[0] - r)},${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

/** Ellipse mit der langen Achse entlang u */
export function ellipse(c: Vec, u: Vec, rx: number, ry: number): string {
  const a = add(c, u, -rx);
  const b = add(c, u, rx);
  const deg = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
  return `M${pt(a)}A${f(rx)} ${f(ry)} ${f(deg)} 0 0 ${pt(b)}A${f(rx)} ${f(ry)} ${f(deg)} 0 0 ${pt(a)}Z`;
}

/** Dicke Kurve (Oberkörper) als Fläche, dünner werdend von r1 nach r2 */
function thickCurve(p: Vec, c: Vec, q: Vec, r1: number, r2: number): string {
  const left: Vec[] = [];
  const right: Vec[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point: Vec = [
      (1 - t) ** 2 * p[0] + 2 * (1 - t) * t * c[0] + t * t * q[0],
      (1 - t) ** 2 * p[1] + 2 * (1 - t) * t * c[1] + t * t * q[1],
    ];
    const tangent = norm([2 * (1 - t) * (c[0] - p[0]) + 2 * t * (q[0] - c[0]), 2 * (1 - t) * (c[1] - p[1]) + 2 * t * (q[1] - c[1])]);
    const n: Vec = [-tangent[1], tangent[0]];
    const r = lerp(r1, r2, t);
    left.push(add(point, n, r));
    right.push(add(point, n, -r));
  }
  return `M${left.map(pt).join('L')}L${right.reverse().map(pt).join('L')}Z${circle(p, r1)}${circle(q, r2)}`;
}

function dumbbellShapes(c: Vec, along: Vec, grip: Dumbbell['grip']): Shape[] {
  if (grip === 'end') return [{ tone: 'eq', d: circle(c, 7.5) }, { tone: 'eqDark', d: circle(c, 3) }];
  const u = grip === 'vertical' ? ([0, 1] as Vec) : along;
  const v: Vec = [-u[1], u[0]];
  return [
    { tone: 'eq', d: capsule(add(c, u, -9), add(c, u, 9), 1.8, 1.8) },
    { tone: 'eq', d: capsule(add(add(c, u, -11.5), v, -6.5), add(add(c, u, -11.5), v, 6.5), 2.6, 2.6) },
    { tone: 'eq', d: capsule(add(add(c, u, 11.5), v, -6.5), add(add(c, u, 11.5), v, 6.5), 2.6, 2.6) },
  ];
}

function propShapes(prop: Prop): Shape[] {
  const rect = (x1: number, y1: number, x2: number, y2: number, r = 2) =>
    `M${f(x1 + r)},${f(y1)}H${f(x2 - r)}A${r} ${r} 0 0 1 ${f(x2)},${f(y1 + r)}V${f(y2 - r)}A${r} ${r} 0 0 1 ${f(x2 - r)},${f(y2)}H${f(x1 + r)}A${r} ${r} 0 0 1 ${f(x1)},${f(y2 - r)}V${f(y1 + r)}A${r} ${r} 0 0 1 ${f(x1 + r)},${f(y1)}Z`;
  switch (prop.kind) {
    case 'chair': {
      const backX = prop.x + prop.back * 19;
      return [
        { tone: 'prop', d: rect(prop.x - 21, SEAT, prop.x + 21, SEAT + 5) },
        ...(prop.back ? [{ tone: 'prop' as const, d: rect(backX - 2.5, SEAT - 52, backX + 2.5, SEAT) }] : []),
        { tone: 'prop', d: rect(prop.x - 19, SEAT + 4, prop.x - 16, FLOOR) },
        { tone: 'prop', d: rect(prop.x + 16, SEAT + 4, prop.x + 19, FLOOR) },
      ];
    }
    case 'chairFront':
      return [
        { tone: 'prop', d: rect(prop.x - 20, SEAT, prop.x + 20, SEAT + 5) },
        { tone: 'prop', d: rect(prop.x - 19, SEAT - 52, prop.x - 15, FLOOR) },
        { tone: 'prop', d: rect(prop.x + 15, SEAT - 52, prop.x + 19, FLOOR) },
        { tone: 'prop', d: rect(prop.x - 19, SEAT - 52, prop.x + 19, SEAT - 47) },
      ];
    case 'wall':
      return [{ tone: 'prop', d: rect(prop.x, 20, prop.x + 6, FLOOR, 1) }];
    case 'mat':
      return [{ tone: 'mat', d: rect(62, 8, 178, 196, 10) }];
  }
}

// Wo die Muskeln auf der Figur liegen
function torsoSpot(s: Skeleton, at: number, side: number): Vec {
  return add(lerpV(s.hip, s.neck, at), s.tn, side);
}

function segSpot(p: Vec, q: Vec, at: number, side: number): { c: Vec; u: Vec } {
  const u = norm(sub(q, p));
  // Bei Armen und Beinen liegt „vorn“ auf der anderen Seite als beim Oberkörper
  return { c: add(lerpV(p, q, at), [u[1], -u[0]], side), u };
}

function highlightShapes(s: Skeleton, regions: Region[], tone: 'hi' | 'hi2', one: boolean): Shape[] {
  const out: Shape[] = [];
  const has = (r: Region) => regions.includes(r);
  const push = (d: string) => out.push({ tone, d });
  const torsoLen = len(sub(s.neck, s.hip));

  if (s.view === 'side') {
    const { td } = s;
    if (has('chest')) push(ellipse(torsoSpot(s, 0.78, 6), td, 10, 5.5));
    if (has('abs')) push(ellipse(torsoSpot(s, 0.36, 6.5), td, 11, 5));
    if (has('obliques')) push(ellipse(torsoSpot(s, 0.45, 1), td, 10, 6));
    if (has('upper')) push(ellipse(torsoSpot(s, 0.82, -6), td, 9, 5.5));
    if (has('lats')) push(ellipse(torsoSpot(s, 0.58, -6.5), td, 12, 5));
    if (has('traps')) push(ellipse(torsoSpot(s, 0.98, -4), td, 6, 4));
    if (has('lower')) push(ellipse(torsoSpot(s, 0.25, -6.5), td, 8, 4.5));
    if (has('glutes')) push(circle(torsoSpot(s, 0.02, -6), 7));
    if (has('delts')) push(circle(add(s.arm[0], s.tn, 1.5), 7.5));
    if (has('rdelts')) push(circle(add(s.arm[0], s.tn, -2), 7));
    const [shoulder, elbow, hand] = s.arm;
    if (has('biceps')) {
      const { c, u } = segSpot(shoulder, elbow, 0.5, 3.4);
      push(ellipse(c, u, 10, 4.2));
    }
    if (has('triceps')) {
      const { c, u } = segSpot(shoulder, elbow, 0.5, -3.4);
      push(ellipse(c, u, 10, 4.2));
    }
    if (has('forearms')) {
      const { c, u } = segSpot(elbow, hand, 0.4, 0);
      push(ellipse(c, u, 9, 3.6));
    }
    const [hip, knee, ankle] = s.leg;
    if (has('quads')) {
      const { c, u } = segSpot(hip, knee, 0.5, 4.5);
      push(ellipse(c, u, 14, 5.5));
    }
    if (has('hams')) {
      const { c, u } = segSpot(hip, knee, 0.5, -4.5);
      push(ellipse(c, u, 14, 5.5));
    }
    if (has('calves')) {
      const { c, u } = segSpot(knee, ankle, 0.35, -3);
      push(ellipse(c, u, 9, 4.5));
    }
    return out;
  }

  const back = s.view === 'back';
  const along = (at: number, side: number) => add(lerpV(s.hip, s.neck, at), s.tn, side);
  const sides = one ? [1] : [1, -1];
  const arms = one ? [s.arm] : [s.arm, s.armFar];
  const legs = [s.leg, s.legFar];
  const scale = torsoLen / L.torso;
  if (!back) {
    if (has('chest')) for (const k of sides) push(ellipse(along(0.8, 8 * k), s.tn, 8, 6 * scale + 1));
    if (has('abs')) push(ellipse(along(0.38, 0), s.td, 12 * scale + 2, 6.5));
    if (has('obliques')) for (const k of [1, -1]) push(ellipse(along(0.4, 11 * k), s.td, 10 * scale + 2, 3.5));
    if (has('delts')) for (const a of arms) push(circle(a[0], 7));
    if (has('biceps')) for (const a of arms) push(ellipse(lerpV(a[0], a[1], 0.5), norm(sub(a[1], a[0])), 10, 4.5));
    if (has('forearms')) for (const a of arms) push(ellipse(lerpV(a[1], a[2], 0.4), norm(sub(a[2], a[1])), 9, 3.6));
    if (has('quads')) for (const l of legs) push(ellipse(lerpV(l[0], l[1], 0.5), norm(sub(l[1], l[0])), 14, 6));
  } else {
    if (has('traps')) push(ellipse(along(0.95, 0), s.tn, 12, 5));
    if (has('upper')) push(ellipse(along(0.75, 0), s.tn, 9, 7 * scale + 1));
    if (has('lats')) for (const k of [1, -1]) push(ellipse(along(0.55, 10 * k), s.td, 12 * scale + 2, 5));
    if (has('lower')) push(ellipse(along(0.25, 0), s.td, 8 * scale + 2, 6));
    if (has('rdelts')) for (const a of arms) push(circle(a[0], 7));
    if (has('triceps')) for (const a of arms) push(ellipse(lerpV(a[0], a[1], 0.5), norm(sub(a[1], a[0])), 10, 4.5));
    if (has('forearms')) for (const a of arms) push(ellipse(lerpV(a[1], a[2], 0.4), norm(sub(a[2], a[1])), 9, 3.6));
    if (has('glutes')) for (const k of [1, -1]) push(circle(along(0.02, 6 * k), 7));
    if (has('hams')) for (const l of legs) push(ellipse(lerpV(l[0], l[1], 0.55), norm(sub(l[1], l[0])), 13, 6));
    if (has('calves')) for (const l of legs) push(ellipse(lerpV(l[1], l[2], 0.35), norm(sub(l[2], l[1])), 9, 4.5));
  }
  return out;
}

function limbShapes(points: Vec[], radii: number[], tone: Tone): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < points.length - 1; i++) out.push({ tone, d: capsule(points[i], points[i + 1], radii[i], radii[i + 1]) });
  return out;
}

const ARM_R = [6.5, 5, 4.2];
const LEG_R = [9.5, 7, 4.5, 3.4];

/** Alle Flächen der Figur in Zeichenreihenfolge */
export function drawFigure(def: FigureDef, s: Skeleton, primary: Region[]): Shape[] {
  const out: Shape[] = [];
  if (def.view !== 'top') out.push({ tone: 'floor', d: `M8,${FLOOR}H232V${FLOOR + 2}H8Z` });
  for (const prop of def.props ?? []) out.push(...propShapes(prop));

  const dumbbell = def.dumbbell;
  const handOf = (which: 'near' | 'far') => (which === 'near' ? s.arm : s.armFar);
  const dumbbellAt = (): Shape[] => {
    if (!dumbbell) return [];
    if (dumbbell.at === 'hip') return dumbbellShapes(add(s.hip, s.view === 'side' ? s.tn : s.td, 13), [1, 0], 'end');
    if (dumbbell.at === 'between') return dumbbellShapes(lerpV(s.arm[2], s.armFar[2], 0.5), [0, 1], 'vertical');
    const [, elbow, hand] = handOf(dumbbell.at);
    const fore = norm(sub(hand, elbow));
    const across: Vec = [-fore[1], fore[0]];
    return dumbbellShapes(add(hand, fore, 2), across, dumbbell.grip);
  };

  if (def.view === 'side') {
    out.push(...limbShapes(s.legFar, LEG_R, 'far'));
    out.push(...limbShapes(s.armFar, ARM_R, 'far'));
    out.push({ tone: 'far', d: circle(s.armFar[2], 4.3) });
    if (dumbbell?.at === 'far') out.push(...dumbbellAt());
    out.push({ tone: 'body', d: thickCurve(s.hip, s.ctrl, s.neck, 11, 12) });
    out.push({ tone: 'body', d: capsule(s.neck, s.head, 5, 5) });
    out.push({ tone: 'body', d: circle(s.head, L.head) });
    out.push(...limbShapes(s.leg, LEG_R, 'body'));
    if (dumbbell?.at === 'hip') out.push(...dumbbellAt());
    const torsoRegions = primary.filter((r) => !['biceps', 'triceps', 'forearms'].includes(r));
    out.push(...highlightShapes(s, torsoRegions, 'hi', false));
    const [shoulder, elbow, hand] = s.arm;
    out.push({ tone: 'body', d: capsule(shoulder, elbow, ARM_R[0], ARM_R[1]) });
    out.push(...highlightShapes(s, primary.filter((r) => r === 'biceps' || r === 'triceps'), 'hi', false));
    out.push({ tone: 'body', d: capsule(elbow, hand, ARM_R[1], ARM_R[2]) });
    out.push(...highlightShapes(s, primary.filter((r) => r === 'forearms'), 'hi', false));
    out.push({ tone: 'body', d: circle(hand, 4.3) });
    if (dumbbell?.at === 'near' || dumbbell?.at === 'between') out.push(...dumbbellAt());
    return out;
  }

  // Von vorn, hinten oder oben: beide Seiten gleich sichtbar
  const shoulderR = s.arm[0];
  const shoulderL = s.armFar[0];
  const hipR = s.leg[0];
  const hipL = s.legFar[0];
  const waistR = add(lerpV(s.hip, s.neck, 0.45), s.tn, 12);
  const waistL = add(lerpV(s.hip, s.neck, 0.45), s.tn, -12);
  out.push(...limbShapes(s.legFar, LEG_R, 'body'), ...limbShapes(s.leg, LEG_R, 'body'));
  out.push({
    tone: 'body',
    d: `M${pt(add(shoulderL, s.td, 3))}L${pt(add(shoulderR, s.td, 3))}L${pt(add(waistR, s.tn, 0))}L${pt(add(hipR, s.tn, 3))}L${pt(add(hipL, s.tn, -3))}L${pt(waistL)}Z${capsule(shoulderL, shoulderR, 6.5, 6.5)}${capsule(add(hipL, s.tn, -1), add(hipR, s.tn, 1), 8, 8)}`,
  });
  out.push({ tone: 'body', d: capsule(s.neck, s.head, 5.5, 5.5) });
  out.push({ tone: 'body', d: circle(s.head, L.head) });
  for (const arm of [s.armFar, s.arm]) {
    out.push(...limbShapes(arm, ARM_R, 'body'));
    out.push({ tone: 'body', d: circle(arm[2], 4.3) });
  }
  out.push(...highlightShapes(s, primary, 'hi', def.one ?? false));
  out.push(...dumbbellAt());
  return out;
}
