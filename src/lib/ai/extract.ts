// Holt den JSON-Teil aus einer KI-Antwort: aus einem ```json-Codeblock, als reines JSON oder mitten im Text.

const FENCE = /```(?:json)?\s*([\s\S]*?)```/i;

function candidates(text: string): string[] {
  const list: string[] = [];
  const fenced = FENCE.exec(text);
  if (fenced) list.push(fenced[1]);
  list.push(text);
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (start >= 0 && end > start) list.push(text.slice(start, end + 1));
  return list;
}

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text.trim());
  } catch {
    return undefined;
  }
}

// Autokorrektur und manche Modelle setzen typografische Anführungszeichen.
function straightenQuotes(text: string): string {
  return text.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'");
}

/** Gibt undefined zurück, wenn kein gültiges JSON in der Antwort steckt. */
export function extractJson(text: string): unknown {
  for (const candidate of candidates(text)) {
    const value = tryParse(candidate) ?? tryParse(straightenQuotes(candidate));
    if (value !== undefined) return value;
  }
  return undefined;
}
