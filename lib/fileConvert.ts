// Client-side file conversion helpers — everything runs in the browser,
// nothing is ever uploaded to the server.
'use client';

import { PDFDocument } from 'pdf-lib';

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read failed'));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}

/** Rasterize any browser-decodable image (webp, gif, bmp, ...) to a PNG Uint8Array via canvas. */
function rasterizeToPng(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decode failed')); };
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(async (blob) => {
        URL.revokeObjectURL(url);
        if (!blob) { reject(new Error('Canvas export failed')); return; }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, 'image/png');
    };
    img.src = url;
  });
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 24;

/**
 * Convert one or more images (JPG/PNG/WebP/etc.) into a single multi-page PDF,
 * one image per A4 page, centered and scaled to fit.
 */
export async function imagesToPdf(files: File[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await readAsArrayBuffer(file));
    let embedded;

    try {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        embedded = await pdfDoc.embedJpg(bytes);
      } else if (file.type === 'image/png') {
        embedded = await pdfDoc.embedPng(bytes);
      } else {
        const png = await rasterizeToPng(file);
        embedded = await pdfDoc.embedPng(png);
      }
    } catch {
      // Fallback for formats pdf-lib can't embed directly (e.g. CMYK JPEGs) —
      // rasterize through canvas and embed as PNG instead.
      const png = await rasterizeToPng(file);
      embedded = await pdfDoc.embedPng(png);
    }

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const maxW = A4_WIDTH - MARGIN * 2;
    const maxH = A4_HEIGHT - MARGIN * 2;
    const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    page.drawImage(embedded, {
      x: (A4_WIDTH - w) / 2,
      y: (A4_HEIGHT - h) / 2,
      width: w,
      height: h,
    });
  }

  const bytes = await pdfDoc.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: 'application/pdf' });
}

/**
 * Render every page of a PDF to an image (JPEG or PNG).
 * scale ~2 gives good quality for on-screen/print use without huge file sizes.
 */
export async function pdfToImages(
  file: File,
  format: 'jpeg' | 'png' = 'jpeg',
  scale = 2,
): Promise<ZipEntry[]> {
  const { pdfjs } = await import('react-pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await readAsArrayBuffer(file);
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const results: ZipEntry[] = [];
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const baseName = file.name.replace(/\.pdf$/i, '');

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
        mime,
        format === 'jpeg' ? 0.92 : undefined,
      );
    });

    const suffix = doc.numPages > 1 ? `-page-${i}` : '';
    results.push({ name: `${baseName}${suffix}.${ext}`, blob });
  }

  return results;
}

/** Bundle multiple files into a single .zip Blob. */
export async function zipFiles(entries: ZipEntry[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const entry of entries) zip.file(entry.name, entry.blob);
  return zip.generateAsync({ type: 'blob' });
}
