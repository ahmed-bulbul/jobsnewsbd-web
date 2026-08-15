'use client';

import type { AdminExamAttempt } from './types';

/**
 * Builds a downloadable marks-sheet PDF for an admin reviewing one exam
 * set's attempts. Same render-then-screenshot approach as examPdf.ts (see
 * that file for why: Bengali names need real browser text shaping, which
 * PDF text-embedding libraries don't handle correctly out of the box).
 *
 * The "Job Radar BD • jobradarbd.com" footer is drawn as native PDF text on
 * every page — reliable regardless of how many attempts span how many
 * pages.
 */

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function buildMarksSheetHtml(examTitle: string, attempts: AdminExamAttempt[]): string {
  const generatedAt = new Date().toLocaleString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const avgPct = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.totalQuestions ? (a.finalScore / a.totalQuestions) * 100 : 0), 0) / attempts.length)
    : 0;

  const rowsHtml = attempts.map((a, i) => {
    const pct = a.totalQuestions > 0 ? Math.round((a.finalScore / a.totalQuestions) * 100) : 0;
    const pctColor = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';
    const typeLabel = a.attemptType === 'LIVE' ? 'লাইভ' : 'অনুশীলন';
    const submitted = new Date(a.submittedAt).toLocaleString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const zebra = i % 2 === 1 ? 'background:#FAFAF9;' : '';
    return `<tr style="${zebra}">
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#6B7280;">${i + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#111827;font-weight:600;">${escapeHtml(a.userName || '—')}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#111827;font-weight:700;">${a.score}/${a.totalQuestions}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#DC2626;">${a.wrongCount}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#111827;font-weight:700;">${a.finalScore}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;font-weight:700;color:${pctColor};">${pct}%</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280;">${typeLabel}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280;">${formatDuration(a.timeTakenSeconds)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280;">${submitted}</td>
    </tr>`;
  }).join('');

  return `
    <div style="width:860px;background:#ffffff;padding:32px;color:#111827;">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid #D97706;padding-bottom:16px;margin-bottom:20px;">
        <img src="/icon.png" width="44" height="44" style="border-radius:10px;display:block;" />
        <div>
          <div style="font-size:19px;font-weight:800;color:#B45309;">Job Radar BD</div>
          <div style="font-size:12px;color:#6B7280;">jobradarbd.com — মার্কশীট / Exam Marks Sheet</div>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <div style="font-size:17px;font-weight:700;color:#111827;">${escapeHtml(examTitle)}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:2px;">তৈরি হয়েছে: ${generatedAt} • মোট অংশগ্রহণকারী: ${attempts.length} • গড় স্কোর: ${avgPct}%</div>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#FFF7ED;">
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">#</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">নাম</th>
<!--            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">ইমেইল</th>-->
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">স্কোর</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">ভুল</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">নেট স্কোর</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">%</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">ধরন</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">সময়</th>
            <th style="text-align:left;padding:8px 10px;font-size:11px;color:#92400E;border-bottom:2px solid #FDBA74;">জমার তারিখ</th>
          </tr>
        </thead>
        <tbody>${rowsHtml || `<tr><td colspan="10" style="padding:20px;text-align:center;color:#9CA3AF;font-size:13px;">কোনো অ্যাটেম্পট নেই</td></tr>`}</tbody>
      </table>
    </div>`;
}

export async function downloadExamMarksPdf(examTitle: string, attempts: AdminExamAttempt[]): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.zIndex = '-1';
  container.innerHTML = buildMarksSheetHtml(examTitle, attempts);
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
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

    const marginMm = 10;
    const pdfWidthMm = 210;
    const contentWidthMm = pdfWidthMm - marginMm * 2;
    const usableHeightMm = 297 - marginMm * 2;
    const imgHeightMm = (canvas.height * contentWidthMm) / canvas.width;
    const totalPages = Math.max(1, Math.ceil(imgHeightMm / usableHeightMm));

    pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const y = marginMm - page * usableHeightMm;
      pdf.addImage(imgData, 'PNG', marginMm, y, contentWidthMm, imgHeightMm);

      pdf.setFontSize(8);
      pdf.setTextColor(130);
      pdf.text('Job Radar BD  •  jobradarbd.com', marginMm, 292);
      pdf.text(`Page ${page + 1}/${totalPages}`, pdfWidthMm - marginMm, 292, { align: 'right' });
    }
  } finally {
    document.body.removeChild(container);
  }

  const safeName = (examTitle || 'exam-marks').replace(/[^\w-]+/g, '-').slice(0, 60);
  pdf.save(`jobradarbd-marksheet-${safeName}.pdf`);
}
