'use client';

import type { ExamResult, QuestionResult } from './types';

/**
 * Builds a downloadable "question paper" PDF from a finished exam attempt.
 *
 * Why render-then-screenshot instead of drawing text directly into the PDF
 * (like pdf-lib elsewhere in this app): question/option text can be Bengali,
 * and Bengali needs proper conjunct/matra shaping that PDF text-embedding
 * libraries don't handle out of the box (bitter lesson from the OG-image work
 * earlier — same root issue). The browser's own text engine already renders
 * this correctly everywhere else on the site, so we reuse it: lay the paper
 * out off-screen with real DOM/CSS, capture it with html2canvas, then slice
 * that image across real A4 pages with jsPDF.
 *
 * The "Job Radar BD • jobradarbd.com" footer is drawn as native PDF text
 * (plain ASCII) rather than baked into the captured image, so it reliably
 * repeats on every page regardless of how many pages the questions span.
 */

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function optionText(q: QuestionResult, opt: 'A' | 'B' | 'C' | 'D'): string {
  return { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt] ?? '';
}

function buildQuestionPaperHtml(result: ExamResult, examTitle: string): string {
  const pct = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
  const date = new Date(result.submittedAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });

  const questionsHtml = result.questions.map((q, i) => {
    const optionsHtml = (['A', 'B', 'C', 'D'] as const).map((opt) => {
      const isCorrect = q.correctOption === opt;
      const isUser = q.selectedOption === opt;
      const bg = isCorrect ? '#DCFCE7' : isUser && !isCorrect ? '#FEE2E2' : '#F9FAFB';
      const border = isCorrect ? '#059669' : isUser && !isCorrect ? '#DC2626' : '#E5E7EB';
      const color = isCorrect ? '#059669' : isUser && !isCorrect ? '#DC2626' : '#374151';
      const mark = isCorrect ? ' &#10003;' : isUser ? ' &#10007;' : '';
      return `<div style="flex:0 0 48%;box-sizing:border-box;background:${bg};border:1px solid ${border};color:${color};border-radius:8px;padding:8px 12px;font-size:13px;margin-bottom:6px;">
        <b>${opt}.</b> ${escapeHtml(optionText(q, opt))}${mark}
      </div>`;
    }).join('');

    const explanation = q.explanationText
      ? `<div style="margin-top:6px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:8px 12px;font-size:12px;color:#92400E;"><b>ব্যাখ্যা:</b> ${escapeHtml(q.explanationText)}</div>`
      : '';

    return `
      <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #E5E7EB;">
        <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:8px;">${i + 1}. ${escapeHtml(q.questionText)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:2%;">${optionsHtml}</div>
        ${explanation}
      </div>`;
  }).join('');

  return `
    <div style="width:780px;background:#ffffff;padding:32px;color:#111827;">
      <div style="display:flex;align-items:center;gap:12px;border-bottom:3px solid #D97706;padding-bottom:16px;margin-bottom:20px;">
        <img src="/icon.png" width="48" height="48" style="border-radius:10px;display:block;" />
        <div>
          <div style="font-size:20px;font-weight:800;color:#B45309;">Job Radar BD</div>
          <div style="font-size:12px;color:#6B7280;">jobradarbd.com — বাংলাদেশের চাকরির প্রস্তুতি প্ল্যাটফর্ম</div>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:18px;font-weight:700;color:#111827;">${escapeHtml(examTitle)}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:2px;">জমা দেওয়ার তারিখ: ${date} • মোট প্রশ্ন: ${result.totalQuestions}</div>
        <div style="margin-top:10px;display:inline-block;background:#FFF7ED;border:1px solid #FDBA74;border-radius:10px;padding:10px 16px;">
          <span style="font-size:22px;font-weight:800;color:#B45309;">${result.score}/${result.totalQuestions}</span>
          <span style="font-size:13px;color:#B45309;margin-left:6px;">(${pct}% সঠিক)</span>
        </div>
      </div>

      ${questionsHtml}
    </div>`;
}

export async function downloadExamResultPdf(result: ExamResult, examTitle: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.zIndex = '-1';
  container.innerHTML = buildQuestionPaperHtml(result, examTitle || 'পরীক্ষার ফলাফল');
  document.body.appendChild(container);

  // Give the logo <img> a chance to finish loading before the screenshot.
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

  const safeName = (examTitle || 'exam-result').replace(/[^\w-]+/g, '-').slice(0, 60);
  pdf.save(`jobradarbd-${safeName}.pdf`);
}
