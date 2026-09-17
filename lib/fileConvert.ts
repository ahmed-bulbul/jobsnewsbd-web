// Client-side file conversion helpers — everything runs in the browser,
// nothing is ever uploaded to the server.
'use client';

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import type { PDFPage, PDFFont } from 'pdf-lib';

export interface ZipEntry {
  name: string;
  blob: Blob;
}

// ── Watermarking ─────────────────────────────────────────────────────────
// A single diagonal watermark stamp, centered on the page — not tiled. A
// full-page repeating grid (the original approach) made scanned government
// notices look like they'd been stamped all over as if claiming ownership
// of the document, which read badly on an official circular. One centered
// mark reads as a normal "converted via this tool" watermark instead.

/** Draw one centered diagonal watermark onto a 2D canvas context (PDF→JPG path). */
function drawCanvasWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, text: string) {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let fontSize = Math.max(20, Math.round(Math.min(width, height) / 8));
  ctx.font = `bold ${fontSize}px sans-serif`;
  const maxTextWidth = Math.min(width, height) * 0.9;
  const measured = ctx.measureText(text).width;
  if (measured > maxTextWidth) {
    fontSize = Math.max(14, Math.floor(fontSize * (maxTextWidth / measured)));
    ctx.font = `bold ${fontSize}px sans-serif`;
  }

  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6); // -30deg
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Draw one centered diagonal watermark onto a pdf-lib page (image→PDF path). */
function drawPdfPageWatermark(page: PDFPage, font: PDFFont, text: string) {
  const { width, height } = page.getSize();
  let fontSize = Math.max(16, Math.round(Math.min(width, height) / 8));
  const maxTextWidth = Math.min(width, height) * 0.9;
  let textWidth = font.widthOfTextAtSize(text, fontSize);
  if (textWidth > maxTextWidth) {
    fontSize = Math.max(12, Math.floor(fontSize * (maxTextWidth / textWidth)));
    textWidth = font.widthOfTextAtSize(text, fontSize);
  }
  const textHeight = font.heightAtSize(fontSize);

  // drawText's (x, y) is the pre-rotation bottom-left of the text, and it
  // rotates around that point — so to land the text's own center on the
  // page's center, offset the anchor by the text's half-size vector
  // rotated by the same angle (standard 2D rotation transform).
  const angleRad = (-30 * Math.PI) / 180;
  const dx = (textWidth / 2) * Math.cos(angleRad) - (textHeight / 2) * Math.sin(angleRad);
  const dy = (textWidth / 2) * Math.sin(angleRad) + (textHeight / 2) * Math.cos(angleRad);

  page.drawText(text, {
    x: width / 2 - dx,
    y: height / 2 - dy,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
    opacity: 0.15,
    rotate: degrees(-30),
  });
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
export async function imagesToPdf(files: File[], watermarkText?: string): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const trimmedWatermark = watermarkText?.trim();
  const watermarkFont = trimmedWatermark ? await pdfDoc.embedFont(StandardFonts.HelveticaBold) : null;

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

    if (trimmedWatermark && watermarkFont) {
      drawPdfPageWatermark(page, watermarkFont, trimmedWatermark);
    }
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
  watermarkText?: string,
): Promise<ZipEntry[]> {
  const { pdfjs } = await import('react-pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await readAsArrayBuffer(file);
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const results: ZipEntry[] = [];
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const baseName = file.name.replace(/\.pdf$/i, '');
  const trimmedWatermark = watermarkText?.trim();

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    if (trimmedWatermark) {
      drawCanvasWatermark(ctx, canvas.width, canvas.height, trimmedWatermark);
    }

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
