// Professionelle Übungs-Animationen (aus Gemini, mit `npm run uebungen` umgewandelt).
// Fehlt eine Datei, zeigt die App die selbst gezeichnete Figur.

const FILES = import.meta.glob('../assets/uebungen/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const byId = new Map(Object.entries(FILES).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url]));

/** Liegestütze haben je nach Stufe eine eigene Animation */
function fileId(exerciseId: string, level?: number): string {
  if (exerciseId === 'liegestuetze' && level !== undefined) {
    if (level === 0) return 'liegestuetze-stuhl';
    if (level >= 3) return 'liegestuetze-fuesse-stuhl';
  }
  return exerciseId;
}

export function animationFor(exerciseId: string, level?: number): string | undefined {
  return byId.get(fileId(exerciseId, level));
}

export function hasAnimation(fileName: string): boolean {
  return byId.has(fileName);
}
