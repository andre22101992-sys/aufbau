import { describe, expect, it } from 'vitest';
import { getRecipe } from '../src/data/recipes';
import { portionOf, totalMinutes } from '../src/lib/nutrition';
import { freshEnough } from '../src/lib/suggest';
import { matchFood } from '../src/lib/receipt';

describe('Hühnersuppe', () => {
  const soup = getRecipe('huehnersuppe');

  it('ist mit Schenkel, Kartoffeln und Nudeln eine volle Mahlzeit und bleibt im Budget', () => {
    const n = portionOf(soup);
    expect(n.kcal).toBeGreaterThan(800);
    expect(n.kcal).toBeLessThan(1000);
    expect(n.protein).toBeGreaterThan(50);
    expect(n.euro).toBeLessThanOrEqual(2.5);
    expect(totalMinutes(soup)).toBeLessThan(60);
  });

  it('hält ohne Gefrierfach nur am Wochenende und bis Dienstag', () => {
    expect(freshEnough(soup, '2026-11-04')).toBe(false); // Mittwoch
    expect(freshEnough(soup, '2026-11-03')).toBe(true); // Dienstag
    expect(freshEnough(soup, '2026-11-07')).toBe(true); // Samstag
  });

  it('wird auf dem Bon vor der Hähnchenbrust erkannt', () => {
    expect(matchFood('Hähnchen-Unterschenkel', {})).toBe('schenkel');
    expect(matchFood('Hähnchenbrustfilet', {})).toBe('haehnchen');
    expect(matchFood('Suppengrün', {})).toBe('suppengruen');
  });
});
