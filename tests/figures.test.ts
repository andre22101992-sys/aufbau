import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../src/data/exercises';
import { figureFor, musclesFor } from '../src/data/figures';
import { drawFigure, poseAt, solve } from '../src/lib/figure';

describe('Übungs-Figuren', () => {
  const cases = [
    ...EXERCISES.map((e) => ({ id: e.id, level: undefined as number | undefined })),
    ...[0, 1, 3].flatMap((level) => [{ id: 'liegestuetze', level }, { id: 'enge-liegestuetze', level }]),
  ];

  it.each(cases)('$id (Stufe $level) hat Start und Ende, erreichbare Ziele und gültige Pfade', ({ id, level }) => {
    const def = figureFor(id, level);
    expect(def, id).toBeDefined();
    expect(def!.frames.length).toBeGreaterThanOrEqual(2);
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const skeleton = solve(def!, poseAt(def!, p));
      expect(skeleton.reachable, `${id} bei ${p.toFixed(1)}`).toBe(true);
      const shapes = drawFigure(def!, skeleton, musclesFor(EXERCISES.find((e) => e.id === id)!).primary);
      for (const s of shapes) expect(s.d).not.toMatch(/NaN|Infinity/);
    }
  });

  it('hebt bei jeder Übung mindestens einen Hauptmuskel hervor', () => {
    for (const e of EXERCISES) expect(musclesFor(e).primary.length, e.id).toBeGreaterThan(0);
  });
});
