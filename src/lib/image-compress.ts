// Compress to WebP under max dimensions and target KB.
export async function compressImageToWebP(
  file: File,
  opts: { maxWidth?: number; maxHeight?: number; targetKB?: number; minQuality?: number } = {}
): Promise<Blob> {
  const maxWidth = opts.maxWidth ?? 1600;
  const maxHeight = opts.maxHeight ?? 1600;
  const targetKB = opts.targetKB ?? 300;
  const minQuality = opts.minQuality ?? 0.5;

  const arrayBuf = await file.arrayBuffer();
  const bitmap = await createImageBitmap(new Blob([arrayBuf]));
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Binary search quality for ~targetKB
  let lo = minQuality,
    hi = 0.95,
    best: Blob = await canvasToBlob(canvas, "image/webp", hi);
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, "image/webp", mid);
    const kb = Math.ceil(blob.size / 1024);
    if (kb > targetKB) {
      hi = mid - 0.05;
    } else {
      best = blob;
      lo = mid + 0.05;
    }
    if (hi < minQuality) break;
  }
  return best;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality)
  );
}
