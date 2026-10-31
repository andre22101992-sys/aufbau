// zod-Schemata für Antworten von Claude und Apple Intelligence. Alles, was zurückkommt, wird geprüft,
// Nährwerte und Preise rechnet die App danach selbst nach.

import { z } from 'zod';
import { FOODS } from '../../data/foods';
import type { Recipe } from '../../data/recipes';
import { uid } from '../platform';
import { extractJson } from './extract';

const foodIds = FOODS.map((f) => f.id) as [string, ...string[]];

export const recipeAnswer = z.object({
  name: z.string().min(3).max(80),
  servings: z.number().int().min(1).max(6).default(2),
  ingredients: z
    .array(z.object({ food: z.enum(foodIds), grams: z.number().positive().max(3000) }))
    .min(2),
  steps: z
    .array(
      z.object({
        text: z.string().min(3),
        device: z.enum(['topf', 'crispi', 'du']),
        at: z.number().min(0).max(180),
        minutes: z.number().min(0.5).max(120),
        timer: z.number().min(1).max(120).optional(),
      }),
    )
    .min(2),
});

export const photoAnswer = z.object({
  label: z.string().min(2).max(60),
  kcal: z.number().min(0).max(3000),
  protein: z.number().min(0).max(250),
});

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function parseWith<T>(schema: z.ZodType<T>, text: string): ParseResult<T> {
  const json = extractJson(text);
  if (json === undefined) return { ok: false, error: 'In der Antwort steht kein JSON-Block. Kopier die ganze Antwort und versuch es noch einmal.' };
  const result = schema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `Die Antwort passt nicht ganz: ${issue.path.join('.') || 'Format'} – ${issue.message}. Bitte die KI, das JSON genau im vorgegebenen Format zu schicken.` };
  }
  return { ok: true, value: result.data };
}

export function parseRecipe(text: string): ParseResult<Recipe> {
  const parsed = parseWith(recipeAnswer, text);
  if (!parsed.ok) return parsed;
  const r = parsed.value;
  return { ok: true, value: { id: `eigen-${uid().slice(0, 8)}`, name: r.name, servings: r.servings, ingredients: r.ingredients, steps: r.steps } };
}

export function parsePhoto(text: string): ParseResult<z.infer<typeof photoAnswer>> {
  return parseWith(photoAnswer, text);
}
