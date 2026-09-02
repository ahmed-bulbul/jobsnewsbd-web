// Shared branding + small helpers for every generated PDF report (exam
// routine, marks sheet, question paper, and anything after this one) — the
// user asked that all PDF exports follow one consistent visual identity
// going forward, so the constants and utilities that make up that identity
// live in exactly one place instead of being copy-pasted (and drifting)
// across each *_Pdf.ts generator.
//
// This module is browser-only (it's imported by generators that build DOM
// nodes and draw into a jsPDF instance) — don't import it from server code.

// Type-only import — erased at build time, so this doesn't force jsPDF's
// actual implementation to load eagerly for anything importing this module.
import type { jsPDF } from 'jspdf';

export const PDF_BRAND = {
  name: 'Job Radar',
  tagline: 'Smarter Preparation, Better Future',
  domain: 'jobradarbd.com',
  // Public static asset — same path every *_Pdf.ts generator already used.
  logoSrc: '/icon.png',
} as const;

// Neutral palette shared across every report, independent of whichever
// per-document accent color (category color, exam-type color, ...) a given
// report also uses.
export const PDF_INK = {
  dark: '#0F172A',   // headline / strongest text
  body: '#111827',   // default body text
  muted: '#6B7280',  // secondary text, labels
  faint: '#9CA3AF',  // placeholders, faded/past-dated content
  border: '#E5E7EB', // hairline row/box borders
  zebra: '#FAFAF9',  // alternating table row tint
} as const;

// Default brand blue, used whenever a report has no per-document accent
// color of its own (e.g. a category with no colorHex set).
export const PDF_DEFAULT_ACCENT = '#1D4ED8';

export function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Every *_Pdf.ts generator already leans on the "#RRGGBB" + 2-hex-digit
// alpha suffix trick used throughout the rest of this codebase (see e.g.
// `${color}22` on the category page) rather than pulling in a color-math
// dependency just for PDF tinting — keeping that same convention here.
export function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}

// Native jsPDF footer, identical on every page of every report: brand +
// domain on the left, "Page N/Total" on the right. Kept as real PDF text
// (not part of the html2canvas screenshot) so it's crisp and reliably
// present even if a page's screenshot content is short.
export function drawPdfFooter(
  pdf: jsPDF,
  pageWidthMm: number,
  marginMm: number,
  pageNum: number,
  totalPages: number,
  footerY = 292,
): void {
  pdf.setFontSize(8);
  pdf.setTextColor(130);
  pdf.text(`${PDF_BRAND.name}  •  ${PDF_BRAND.domain}`, marginMm, footerY);
  pdf.text(`Page ${pageNum}/${totalPages}`, pageWidthMm - marginMm, footerY, { align: 'right' });
}
