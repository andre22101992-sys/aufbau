// Fotos verkleinern, bevor sie gespeichert werden: Der längere Rand wird höchstens 1.280 Pixel lang, als JPEG.

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Das Foto konnte nicht gespeichert werden.'))), 'image/jpeg', quality));

/** Standbild aus der laufenden Kamera oder aus einer Bilddatei */
export async function toJpeg(source: Blob | HTMLVideoElement, maxSide = 1280, quality = 0.82): Promise<Blob> {
  let bitmap: ImageBitmap | null = null;
  let width: number;
  let height: number;
  if (source instanceof Blob) {
    bitmap = await createImageBitmap(source);
    width = bitmap.width;
    height = bitmap.height;
  } else {
    width = source.videoWidth;
    height = source.videoHeight;
  }
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Das Foto konnte nicht verarbeitet werden.');
  context.drawImage(bitmap ?? (source as HTMLVideoElement), 0, 0, canvas.width, canvas.height);
  bitmap?.close();
  return toBlob(canvas, quality);
}
