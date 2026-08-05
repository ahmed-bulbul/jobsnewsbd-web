'use client';

import type { ExamRoutineEntry } from './types';

/**
 * Builds a downloadable "full routine" PDF for a prep category, listing
 * every published routine entry (not just the still-upcoming ones shown on
 * screen — this is meant as a printable reference of the whole schedule).
 * Same render-then-screenshot approach as examMarksPdf.ts/examPdf.ts: real
 * browser text shaping for Bengali via html2canvas, only the page-footer
 * text is drawn as native jsPDF text.
 */

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// Must match the fixed `width` set on the wrapper <div> in buildRoutineHtml
// below — used to convert measured DOM pixel offsets into PDF millimeters.
const CONTENT_PX_WIDTH = 860;

function buildRoutineHtml(categoryTitle: string, routine: ExamRoutineEntry[]): string {
  const generatedAt = new Date().toLocaleString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const sorted = [...routine].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const rowsHtml = sorted.map((entry, i) => {
    const scheduled = new Date(entry.scheduledAt);
    const dateBn = scheduled.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeBn = scheduled.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
    const isPast = scheduled.getTime() < Date.now();
    const zebra = i % 2 === 1 ? 'background:#FAFAF9;' : '';
    const fadedColor = isPast ? '#9CA3AF' : '#111827';
    return `<tr style="${zebra}">
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">${i + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:${fadedColor};">${dateBn}<br/><span style="color:#9CA3AF;font-size:11px;">${timeBn}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:${fadedColor};font-weight:600;">${escapeHtml(entry.titleBn)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280;">${entry.topicNameBn ? escapeHtml(entry.topicNameBn) : '—'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280;">${entry.description ? escapeHtml(entry.description) : '—'}</td>
    </tr>`;
  }).join('');

  return `
    <div style="width:860px;background:#ffffff;padding:32px;color:#111827;">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid #1D4ED8;padding-bottom:16px;margin-bottom:20px;">
        <img src="/icon.png" width="44" height="44" style="border-radius:10px;display:block;" />
        <div>
          <div style="font-size:19px;font-weight:800;color:#1D4ED8;">Job Radar BD</div>
          <div style="font-size:12px;color:#6B7280;">jobradarbd.com — পরীক্ষার রুটিন / Exam Routine</div>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <div style="font-size:17px;font-weight:700;color:#111827;">${escapeHtml(categoryTitle)}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:2px;">তৈরি হয়েছে: ${generatedAt} • মোট এন্ট্রি: ${sorted.length}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#EFF6FF;">
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#1E40AF;border-bottom:2px solid #BFDBFE;">#</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#1E40AF;border-bottom:2px solid #BFDBFE;">তারিখ ও সময়</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#1E40AF;border-bottom:2px solid #BFDBFE;">শিরোনাম</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#1E40AF;border-bottom:2px solid #BFDBFE;">বিষয়</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#1E40AF;border-bottom:2px solid #BFDBFE;">বিবরণ</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || `<tr><td colspan="5" style="padding:20px;text-align:center;color:#9CA3AF;font-size:13px;">কোনো রুটিন এন্ট্রি নেই</td></tr>`}</tbody>
      </table>
    </div>`;
}

export async function downloadExamRoutinePdf(categoryTitle: string, routine: ExamRoutineEntry[]): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.zIndex = '-1';
  container.innerHTML = buildRoutineHtml(categoryTitle, routine);
  document.body.appendChild(container);

  const img = container.querySelector('img');
  if (img && !(img as HTMLImageElement).complete) {
    await new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  }

  let pdf: InstanceType<typeof jsPDF>;
  try {
    const marginMm = 10;
    const pdfWidthMm = 210;
    const contentWidthMm = pdfWidthMm - marginMm * 2;
    // Leave a bit of extra clearance above the footer line so a page's last
    // row never sits flush against (or under) the "Job Radar BD" footer.
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

      pdf.setFontSize(8);
      pdf.setTextColor(130);
      pdf.text('Job Radar BD  •  jobradarbd.com', marginMm, 292);
      pdf.text(`Page ${page + 1}/${totalPages}`, pdfWidthMm - marginMm, 292, { align: 'right' });
    }
  } finally {
    document.body.removeChild(container);
  }

  const safeName = (categoryTitle || 'routine').replace(/[^\w-]+/g, '-').slice(0, 60);
  pdf.save(`jobradarbd-routine-${safeName}.pdf`);
}
