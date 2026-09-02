'use client';

import type { ExamRoutineEntry } from './types';
import { PDF_BRAND, PDF_INK, PDF_DEFAULT_ACCENT, escapeHtml, drawPdfFooter } from './pdfBranding';

/**
 * Builds a downloadable "full routine" PDF for a prep category, listing
 * every published routine entry (not just the still-upcoming ones shown on
 * screen — this is meant as a printable reference of the whole schedule).
 * Same render-then-screenshot approach as examMarksPdf.ts/examPdf.ts: real
 * browser text shaping for Bengali via html2canvas, only the page-footer
 * text is drawn as native jsPDF text.
 *
 * Visual style: this is the reference layout every future *_Pdf.ts report
 * should follow — big two-tone title block, brand + at-a-glance stat boxes
 * up top, a numbered "plan" strip for the nearest upcoming entries, the
 * main schedule table, then a closing summary/notes pair of boxes and a
 * motivational footer quote. See pdfBranding.ts for the shared constants.
 */

// Must match the fixed `width` set on the wrapper <div> in buildRoutineHtml
// below — used to convert measured DOM pixel offsets into PDF millimeters.
const CONTENT_PX_WIDTH = 860;

const MONTHS_BN_SHORT = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে',
];

function formatDateBn(d: Date): string {
  return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildRoutineHtml(categoryTitle: string, routine: ExamRoutineEntry[], accentColor?: string): string {
  const accent = accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : PDF_DEFAULT_ACCENT;
  const generatedAt = new Date().toLocaleString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const now = Date.now();
  const sorted = [...routine].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const upcoming = sorted.filter((e) => new Date(e.scheduledAt).getTime() >= now);
  const completed = sorted.length - upcoming.length;

  const periodText = sorted.length
    ? `${formatDateBn(new Date(sorted[0].scheduledAt))} — ${formatDateBn(new Date(sorted[sorted.length - 1].scheduledAt))}`
    : '—';

  // Numbered "plan" strip — a quick-glance preview of what's coming next,
  // mirroring an "N EXAMS PLAN" overview. Prefers the nearest upcoming
  // entries; falls back to the first few overall if everything has passed
  // (still useful as a "what this routine covered" recap).
  const planEntries = (upcoming.length ? upcoming : sorted).slice(0, 4);
  const planStripHtml = planEntries.length
    ? `
      <div style="display:flex;align-items:center;gap:10px;background:${accent};border-radius:10px;padding:8px 16px;margin-bottom:14px;">
        <span style="font-size:12px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">${sorted.length} টি পরীক্ষার রুটিন</span>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:22px;">
        ${planEntries.map((e, i) => {
          const d = new Date(e.scheduledAt);
          return `
          <div style="flex:1;display:flex;align-items:center;gap:8px;border:1px solid ${PDF_INK.border};border-radius:10px;padding:10px 12px;background:#ffffff;">
            <div style="width:22px;height:22px;flex:none;border-radius:50%;background:${accent};color:#ffffff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;">${i + 1}</div>
            <div style="min-width:0;">
              <div style="font-size:11px;font-weight:700;color:${PDF_INK.body};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(e.titleBn)}</div>
              <div style="font-size:10px;color:${PDF_INK.muted};">${d.getDate()} ${MONTHS_BN_SHORT[d.getMonth()]}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`
    : '';

  const rowsHtml = sorted.map((entry, i) => {
    const scheduled = new Date(entry.scheduledAt);
    const dateBn = formatDateBn(scheduled);
    const timeBn = scheduled.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
    const isPast = scheduled.getTime() < now;
    const zebra = i % 2 === 1 ? `background:${PDF_INK.zebra};` : '';
    const fadedColor = isPast ? PDF_INK.faint : PDF_INK.body;
    const statusChip = isPast
      ? `<span style="display:inline-block;font-size:9.5px;font-weight:700;color:${PDF_INK.faint};background:#F3F4F6;border-radius:6px;padding:2px 7px;">শেষ</span>`
      : `<span style="display:inline-block;font-size:9.5px;font-weight:700;color:${accent};background:${accent}1A;border-radius:6px;padding:2px 7px;">আসন্ন</span>`;
    return `<tr style="${zebra}">
      <td style="padding:9px 10px;border-bottom:1px solid ${PDF_INK.border};font-size:12px;color:${PDF_INK.muted};">${i + 1}</td>
      <td style="padding:9px 10px;border-bottom:1px solid ${PDF_INK.border};font-size:12px;color:${fadedColor};">${dateBn}<br/><span style="color:${PDF_INK.faint};font-size:11px;">${timeBn}</span></td>
      <td style="padding:9px 10px;border-bottom:1px solid ${PDF_INK.border};font-size:12px;color:${fadedColor};font-weight:600;">${escapeHtml(entry.titleBn)}</td>
      <td style="padding:9px 10px;border-bottom:1px solid ${PDF_INK.border};font-size:11px;color:${PDF_INK.muted};">${entry.topicNameBn ? escapeHtml(entry.topicNameBn) : '—'}</td>
      <td style="padding:9px 10px;border-bottom:1px solid ${PDF_INK.border};font-size:11px;color:${PDF_INK.muted};">${entry.description ? escapeHtml(entry.description) : '—'}</td>
      <td style="padding:9px 10px;border-bottom:1px solid ${PDF_INK.border};text-align:center;">${statusChip}</td>
    </tr>`;
  }).join('');

  return `
    <div style="width:${CONTENT_PX_WIDTH}px;background:#ffffff;padding:36px;color:${PDF_INK.body};font-family:'Hind','Noto Sans Bengali',sans-serif;">

      <!-- ── Header band ─────────────────────────────────────────────── -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;">
        <div style="max-width:560px;">
          <div style="font-size:34px;font-weight:900;line-height:1.1;letter-spacing:-0.5px;">
            <span style="color:${PDF_INK.dark};">পরীক্ষার </span><span style="color:${accent};">রুটিন</span>
          </div>
          <div style="font-size:15px;font-weight:600;color:${PDF_INK.muted};margin-top:6px;">${escapeHtml(categoryTitle)}</div>
          <div style="width:64px;height:3px;background:${accent};border-radius:2px;margin:10px 0;"></div>
          <div style="font-size:12px;font-style:italic;color:${PDF_INK.muted};">"নিয়মিত প্রস্তুতি আজ, সাফল্য আগামীকাল"</div>
        </div>

        <div style="text-align:right;flex:none;">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;">
            <div>
              <div style="font-size:15px;font-weight:800;color:${accent};">${PDF_BRAND.name}</div>
              <div style="font-size:9.5px;color:${PDF_INK.muted};">${PDF_BRAND.tagline}</div>
            </div>
            <img src="${PDF_BRAND.logoSrc}" width="34" height="34" style="border-radius:8px;display:block;" />
          </div>
          <div style="margin-top:12px;border:1px solid ${PDF_INK.border};border-radius:10px;padding:8px 12px;min-width:190px;">
            <div style="font-size:9.5px;color:${PDF_INK.muted};">সময়কাল</div>
            <div style="font-size:11.5px;font-weight:700;color:${PDF_INK.body};">${periodText}</div>
          </div>
          <div style="margin-top:6px;border:1px solid ${PDF_INK.border};border-radius:10px;padding:8px 12px;min-width:190px;display:flex;justify-content:space-between;gap:10px;">
            <div>
              <div style="font-size:9.5px;color:${PDF_INK.muted};">মোট</div>
              <div style="font-size:13px;font-weight:800;color:${PDF_INK.body};">${sorted.length}</div>
            </div>
            <div>
              <div style="font-size:9.5px;color:${PDF_INK.muted};">আসন্ন</div>
              <div style="font-size:13px;font-weight:800;color:${accent};">${upcoming.length}</div>
            </div>
            <div>
              <div style="font-size:9.5px;color:${PDF_INK.muted};">শেষ হয়েছে</div>
              <div style="font-size:13px;font-weight:800;color:${PDF_INK.faint};">${completed}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Plan strip ──────────────────────────────────────────────── -->
      ${planStripHtml}

      <!-- ── Schedule table ──────────────────────────────────────────── -->
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:${accent}14;">
            <th style="text-align:left;padding:9px 10px;font-size:10.5px;font-weight:800;color:${accent};border-bottom:2px solid ${accent}55;">#</th>
            <th style="text-align:left;padding:9px 10px;font-size:10.5px;font-weight:800;color:${accent};border-bottom:2px solid ${accent}55;">তারিখ ও সময়</th>
            <th style="text-align:left;padding:9px 10px;font-size:10.5px;font-weight:800;color:${accent};border-bottom:2px solid ${accent}55;">শিরোনাম</th>
            <th style="text-align:left;padding:9px 10px;font-size:10.5px;font-weight:800;color:${accent};border-bottom:2px solid ${accent}55;">বিষয়</th>
            <th style="text-align:left;padding:9px 10px;font-size:10.5px;font-weight:800;color:${accent};border-bottom:2px solid ${accent}55;">বিবরণ</th>
            <th style="text-align:center;padding:9px 10px;font-size:10.5px;font-weight:800;color:${accent};border-bottom:2px solid ${accent}55;">অবস্থা</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || `<tr><td colspan="6" style="padding:24px;text-align:center;color:${PDF_INK.faint};font-size:13px;">কোনো রুটিন এন্ট্রি নেই</td></tr>`}</tbody>
      </table>

      <!-- ── Summary / notes ─────────────────────────────────────────── -->
      <div style="display:flex;gap:14px;margin-top:22px;">
        <div style="flex:1;border:1px solid ${PDF_INK.border};border-radius:12px;padding:14px 16px;">
          <div style="font-size:12.5px;font-weight:800;color:${PDF_INK.body};margin-bottom:8px;">📅 সারসংক্ষেপ</div>
          <div style="font-size:11.5px;color:${PDF_INK.muted};line-height:1.9;">
            মোট নির্ধারিত পরীক্ষা: <strong style="color:${PDF_INK.body};">${sorted.length}</strong><br/>
            আসন্ন: <strong style="color:${accent};">${upcoming.length}</strong> &nbsp;•&nbsp; শেষ হয়েছে: <strong style="color:${PDF_INK.faint};">${completed}</strong><br/>
            সময়কাল: <strong style="color:${PDF_INK.body};">${periodText}</strong>
          </div>
        </div>
        <div style="flex:1;border:1px solid ${PDF_INK.border};border-radius:12px;padding:14px 16px;">
          <div style="font-size:12.5px;font-weight:800;color:${PDF_INK.body};margin-bottom:8px;">📝 গুরুত্বপূর্ণ নির্দেশনা</div>
          <div style="font-size:11px;color:${PDF_INK.muted};line-height:1.85;">
            ✔ নিয়মিত রুটিন অনুসরণ করুন<br/>
            ✔ প্রতিটি পরীক্ষার আগে রিভিশন দিন<br/>
            ✔ সময়মতো প্রস্তুতি শুরু করুন<br/>
            ✔ প্রশ্নব্যাংক থেকে অনুশীলন করুন
          </div>
        </div>
      </div>

      <!-- ── Closing footer band ─────────────────────────────────────── -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:24px;padding-top:16px;border-top:1px solid ${PDF_INK.border};">
        <div style="display:flex;align-items:center;gap:8px;">
          <img src="${PDF_BRAND.logoSrc}" width="26" height="26" style="border-radius:6px;display:block;" />
          <div>
            <div style="font-size:12px;font-weight:800;color:${accent};">${PDF_BRAND.name}</div>
            <div style="font-size:9px;color:${PDF_INK.muted};">${PDF_BRAND.tagline}</div>
          </div>
        </div>
        <div style="background:${PDF_INK.dark};color:#ffffff;border-radius:10px;padding:8px 16px;font-size:10.5px;font-style:italic;max-width:320px;">
          "যত পরিশ্রম আজ, পরীক্ষা তত সহজ আগামীকাল"
        </div>
      </div>
      <div style="font-size:9.5px;color:${PDF_INK.faint};margin-top:8px;">তৈরি হয়েছে: ${generatedAt}</div>
    </div>`;
}

export async function downloadExamRoutinePdf(categoryTitle: string, routine: ExamRoutineEntry[], accentColor?: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.zIndex = '-1';
  container.innerHTML = buildRoutineHtml(categoryTitle, routine, accentColor);
  document.body.appendChild(container);

  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map((img) => (img as HTMLImageElement).complete ? Promise.resolve() : new Promise<void>((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  })));

  let pdf: InstanceType<typeof jsPDF>;
  try {
    const marginMm = 10;
    const pdfWidthMm = 210;
    const contentWidthMm = pdfWidthMm - marginMm * 2;
    // Leave a bit of extra clearance above the footer line so a page's last
    // row never sits flush against (or under) the native footer text.
    const usableHeightMm = 297 - marginMm * 2 - 6;

    // Row-aware pagination: instead of blindly slicing the screenshot every
    // fixed usableHeightMm chunk (which can cut a table row in half across
    // two pages), find the actual <tr> boundaries in the rendered DOM and
    // only break pages between rows.
    const containerRect = container.getBoundingClientRect();
    const rows = Array.from(container.querySelectorAll('tbody tr'));
    const pxToMm = contentWidthMm / CONTENT_PX_WIDTH;
    const usableHeightPx = usableHeightMm / pxToMm;

    const pageBreaksPx: number[] = [0];
    let pageStartPx = 0;
    for (const row of rows) {
      const r = row.getBoundingClientRect();
      const rowTop = r.top - containerRect.top;
      const rowBottom = rowTop + r.height;
      if (rowBottom - pageStartPx > usableHeightPx && rowTop > pageStartPx) {
        pageBreaksPx.push(rowTop);
        pageStartPx = rowTop;
      }
    }

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width;
    const imgData = canvas.toDataURL('image/png');
    const totalPages = pageBreaksPx.length;

    pdf = new jsPDF('p', 'mm', 'a4');

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const breakMm = pageBreaksPx[page] * pxToMm;
      const y = marginMm - breakMm;
      pdf.addImage(imgData, 'PNG', marginMm, y, contentWidthMm, imgHeightMm);
      drawPdfFooter(pdf, pdfWidthMm, marginMm, page + 1, totalPages);
    }
  } finally {
    document.body.removeChild(container);
  }

  const safeName = (categoryTitle || 'routine').replace(/[^\w-]+/g, '-').slice(0, 60);
  pdf.save(`jobradarbd-routine-${safeName}.pdf`);
}
