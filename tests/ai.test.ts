import { describe, expect, it } from 'vitest';
import { newRecipePrompt } from '../src/lib/ai/prompts';
import { parsePhoto, parseRecipe } from '../src/lib/ai/schemas';
import { portionOf } from '../src/lib/nutrition';

const CLAUDE_ANSWER = `Gern! Hier ist dein Rezept:
\`\`\`json
{"name": "Scharfe Reispfanne mit Ei", "servings": 2,
 "ingredients": [{"food": "reis", "grams": 220}, {"food": "ei", "grams": 360}, {"food": "kidney", "grams": 250}, {"food": "paprika", "grams": 160}, {"food": "oel", "grams": 20}],
 "steps": [{"text": "Reis kochen.", "device": "topf", "at": 0, "minutes": 15, "timer": 15}, {"text": "Eier braten.", "device": "topf", "at": 15, "minutes": 5}]}
\`\`\`
Guten Appetit!`;

describe('KI-Antworten', () => {
  it('liest ein Rezept aus einem Codeblock und rechnet die Nährwerte selbst nach', () => {
    const result = parseRecipe(CLAUDE_ANSWER);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toMatch(/^eigen-/);
    expect(portionOf(result.value).protein).toBeGreaterThan(30);
  });

  it('lehnt unbekannte Zutaten und fehlendes JSON mit verständlicher Meldung ab', () => {
    const unknown = parseRecipe(CLAUDE_ANSWER.replace('"kidney"', '"tofu"'));
    expect(unknown.ok).toBe(false);
    expect(!unknown.ok && unknown.error).toContain('ingredients');
    const none = parseRecipe('Leider kann ich das nicht.');
    expect(!none.ok && none.error).toContain('kein JSON');
  });

  it('liest eine Foto-Schätzung', () => {
    expect(parsePhoto('{"label": "Döner", "kcal": 700, "protein": 32}')).toEqual({ ok: true, value: { label: 'Döner', kcal: 700, protein: 32 } });
    expect(parsePhoto('{"label": "Döner", "kcal": -5, "protein": 32}').ok).toBe(false);
  });

  it('hält die Anfrage an Apple Intelligence kurz', () => {
    expect(newRecipePrompt('scharf', true).length).toBeLessThan(newRecipePrompt('scharf').length / 2);
    expect(newRecipePrompt('scharf', true).length).toBeLessThan(900);
  });
});
