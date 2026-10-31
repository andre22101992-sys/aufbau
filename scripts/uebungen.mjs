// Wandelt die GIFs aus dem Ordner „uebungen“ in kleine animierte WebP-Dateien für die App um.
// Aufruf: npm run uebungen
import { readdir } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = 'uebungen';
const TARGET = 'src/assets/uebungen';

const files = (await readdir(SOURCE)).filter((f) => f.toLowerCase().endsWith('.gif'));
for (const file of files) {
  const id = file.replace(/\.gif$/i, '');
  const info = await sharp(`${SOURCE}/${file}`, { animated: true })
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 70, effort: 6, loop: 0 })
    .toFile(`${TARGET}/${id}.webp`);
  console.log(`${id}: ${Math.round(info.size / 1024)} KB`);
}
console.log(files.length ? `${files.length} Übungen umgewandelt.` : 'Keine GIFs im Ordner „uebungen“ gefunden.');
