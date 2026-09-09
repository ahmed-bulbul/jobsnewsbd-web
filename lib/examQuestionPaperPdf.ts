'use client';

import type { ExamSet, ExamQuestion } from './types';
import { PDF_BRAND, PDF_INK, PDF_DEFAULT_ACCENT, escapeHtml, drawPdfFooter } from './pdfBranding';

/**
 * Builds a downloadable, printable question-paper PDF for an exam set —
 * used from the admin panel so admins can hand out a real paper copy or
 * keep an offline record, complete with an answer key on the closing page.
 * Same render-then-screenshot approach as routinePdf.ts (the reference
 * layout): real browser text shaping for Bengali via html2canvas, only the
 * page-footer text is drawn as native jsPDF text. Pagination is
 * question-aware (breaks only between questions, never mid-question) using
 * the same DOM-measurement technique as routinePdf.ts.
 */

// Must match the fixed `width` set on the wrapper <div> in buildQuestionPaperHtml
// below — used to convert measured DOM pixel offsets into PDF millimeters.
const CONTENT_PX_WIDTH = 860;

function optionText(q: ExamQuestion, opt: 'A' | 'B' | 'C' | 'D'): string {
  return { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt] ?? '';
}

function buildQuestionPaperHtml(examSet: ExamSet, questions: ExamQuestion[], accentColor?: string): string {
  const accent = accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : PDF_DEFAULT_ACCENT;
  const generatedAt = new Date().toLocaleString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const startsAt = new Date(examSet.startsAt);
  const dateBn = startsAt.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeBn = startsAt.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
  const hasNegative = (examSet.negativeMarksPerWrong ?? 0) > 0;

  const questionsHtml = questions.map((q, i) => `
    <div class="qp-question" style="padding:14px 0;border-bottom:1px solid ${PDF_INK.border};">
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="width:26px;height:26px;line-height:26px;text-align:center;border-radius:50%;background:${accent};color:#ffffff;font-size:12px;font-weight:800;flex:none;">${i + 1}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:${PDF_INK.dark};line-height:1.55;margin-bottom:9px;">${escapeHtml(q.questionText)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${(['A', 'B', 'C', 'D'] as const).map((opt) => `
              <div style="width:calc(50% - 4px);box-sizing:border-box;display:flex;align-items:center;gap:8px;border:1px solid ${PDF_INK.border};border-radius:8px;padding:6px 10px;background:${PDF_INK.zebra};">
                <span style="display:inline-block;width:20px;height:20px;box-sizing:border-box;line-height:18px;text-align:center;border-radius:6px;background:#ffffff;border:1px solid ${PDF_INK.border};font-size:10.5px;font-weight:800;color:${PDF_INK.muted};flex:none;">${opt}</span>
                <span style="font-size:11.5px;color:${PDF_INK.body};line-height:1.4;">${escapeHtml(optionText(q, opt))}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`).join('');

  const answerKeyHtml = `
    <div class="qp-question" style="margin-top:20px;border:1px solid ${PDF_INK.border};border-radius:12px;padding:16px;">
      <div style="font-size:14px;font-weight:800;color:${PDF_INK.dark};margin-bottom:10px;">✅ উত্তরমালা (Answer Key)</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${questions.map((q, i) => `
          <div style="min-width:64px;border:1px solid ${accent}44;background:${accent}0F;border-radius:8px;padding:6px 10px;text-align:center;">
            <div style="font-size:9.5px;color:${PDF_INK.muted};">প্রশ্ন ${i + 1}</div>
            <div style="font-size:13px;font-weight:800;color:${accent};">${escapeHtml(q.correctOption)}</div>
          </div>`).join('')}
      </div>
    </div>`;

  return `
    <div style="width:${CONTENT_PX_WIDTH}px;background:#ffffff;padding:36px;color:${PDF_INK.body};font-family:'Hind','Noto Sans Bengali',sans-serif;">

      <!-- ── Header band ─────────────────────────────────────────────── -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
        <div style="max-width:560px;">
          <div style="font-size:32px;font-weight:900;line-height:1.1;letter-spacing:-0.5px;">
            <span style="color:${accent};">প্রশ্নপত্র</span>
          </div>
          <div style="font-size:15px;font-weight:700;color:${PDF_INK.body};margin-top:6px;">${escapeHtml(examSet.titleBn)}</div>
          ${examSet.topicNameBn ? `<div style="font-size:12px;color:${PDF_INK.muted};margin-top:2px;">${escapeHtml(examSet.topicNameBn)}</div>` : ''}
          <div style="width:64px;height:3px;background:${accent};border-radius:2px;margin:10px 0;"></div>
          <div style="font-size:11.5px;color:${PDF_INK.muted};">${dateBn} • ${timeBn}</div>
        </div>

        <div style="text-align:right;flex:none;">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;">
            <div>
              <div style="font-size:15px;font-weight:800;color:${accent};">${PDF_BRAND.name}</div>
              <div style="font-size:9.5px;color:${PDF_INK.muted};">${PDF_BRAND.tagline}</div>
            </div>
            <img src="${PDF_BRAND.logoSrc}" width="34" height="34" style="border-radius:8px;display:block;" />
          </div>
          <div style="margin-top:12px;border:1px solid ${PDF_INK.border};border-radius:10px;padding:8px 12px;min-width:190px;display:flex;justify-content:space-between;gap:10px;">
            <div>
              <div style="font-size:9.5px;color:${PDF_INK.muted};">সময়সীমা</div>
              <div style="font-size:13px;font-weight:800;color:${PDF_INK.body};">${examSet.durationMinutes} মিনিট</div>
            </div>
            <div>
              <div style="font-size:9.5px;color:${PDF_INK.muted};">প্রশ্ন</div>
              <div style="font-size:13px;font-weight:800;color:${accent};">${questions.length} টি</div>
            </div>
          </div>
          <div style="margin-top:6px;border:1px solid ${PDF_INK.border};border-radius:10px;padding:8px 12px;min-width:190px;">
            <div style="font-size:9.5px;color:${PDF_INK.muted};">নেগেটিভ মার্কিং</div>
            <div style="font-size:11.5px;font-weight:700;color:${hasNegative ? '#DC2626' : PDF_INK.body};">
              ${hasNegative ? `-${examSet.negativeMarksPerWrong} প্রতি ভুল উত্তরে` : 'নেই'}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Instructions ────────────────────────────────────────────── -->
      <div style="border:1px solid ${PDF_INK.border};border-radius:12px;padding:12px 16px;margin-bottom:20px;background:${accent}0A;">
        <div style="font-size:12px;font-weight:800;color:${PDF_INK.body};margin-bottom:6px;">📋 নির্দেশনা</div>
        <div style="font-size:11px;color:${PDF_INK.muted};line-height:1.85;">
          মোট প্রশ্ন <strong style="color:${PDF_INK.body};">${questions.length} টি</strong> — প্রতিটি প্রশ্নের মান সমান বলে বিবেচিত হবে।
          সময়সীমা <strong style="color:${PDF_INK.body};">${examSet.durationMinutes} মিনিট</strong>।
          ${hasNegative ? `প্রতিটি ভুল উত্তরের জন্য <strong style="color:#DC2626;">${examSet.negativeMarksPerWrong} নম্বর</strong> কর্তন করা হবে — অনিশ্চিত প্রশ্নে অনুমাননির্ভর উত্তর দেওয়ার আগে ভেবে দেখুন।` : 'ভুল উত্তরের জন্য কোনো নম্বর কর্তন করা হবে না।'}
          সঠিক উত্তরের ঘরে টিক/বৃত্ত পূরণ করুন।
        </div>
      </div>

      <!-- ── Questions ───────────────────────────────────────────────── -->
      ${questionsHtml || `<div style="padding:24px;text-align:center;color:${PDF_INK.faint};font-size:13px;">কোনো প্রশ্ন যোগ করা হয়নি</div>`}

      <!-- ── Answer key ──────────────────────────────────────────────── -->
      ${answerKeyHtml}

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
          "সততার সাথে অনুশীলন করুন, প্রকৃত পরীক্ষায় সফল হোন"
        </div>
      </div>
      <div style="font-size:9.5px;color:${PDF_INK.faint};margin-top:8px;">তৈরি হয়েছে: ${generatedAt}</div>
    </div>`;
}

export async function downloadExamQuestionPaperPdf(examSet: ExamSet, questions: ExamQuestion[], accentColor?: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-99999px';
  container.style.zIndex = '-1';
  container.innerHTML = buildQuestionPaperHtml(examSet, questions, accentColor);
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
    // block never sits flush against (or under) the native footer text.
    const usableHeightMm = 297 - marginMm * 2 - 6;

    // Question-aware pagination: instead of blindly slicing the screenshot
    // every fixed usableHeightMm chunk (which can cut a question in half
    // across two pages), find the actual .qp-question boundaries in the
    // rendered DOM and only break pages between them.
    const containerRect = container.getBoundingClientRect();
    const blocks = Array.from(container.querySelectorAll('.qp-question'));
    const pxToMm = contentWidthMm / containerRect.width;
    const usableHeightPx = usableHeightMm / pxToMm;

    const pageBreaksPx: number[] = [0];
    let pageStartPx = 0;
    for (const block of blocks) {
      const r = block.getBoundingClientRect();
      const blockTop = r.top - containerRect.top;
      const blockBottom = blockTop + r.height;
      if (blockBottom - pageStartPx > usableHeightPx && blockTop > pageStartPx) {
        pageBreaksPx.push(blockTop);
        pageStartPx = blockTop;
      }
    }

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    // Canvas px per CSS px — normally equal to the `scale` option above, but
    // measured directly so a mismatch there can never cause mis-cropped
    // slices.
    const canvasScale = canvas.width / containerRect.width;
    const totalPages = pageBreaksPx.length;

    pdf = new jsPDF('p', 'mm', 'a4');

    // Each page gets its own independently-cropped image slice (rather than
    // the whole screenshot repositioned per page) so pages can never overlap
    // or duplicate content at their boundary — the previous shifted-image
    // approach could bleed a sliver of the prior page's content into the
    // next page's top margin.
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();
      const startPx = pageBreaksPx[page];
      const endPx = page + 1 < totalPages ? pageBreaksPx[page + 1] : containerRect.height;
      const sliceHeightPx = Math.max(1, endPx - startPx);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.max(1, Math.round(sliceHeightPx * canvasScale));
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, Math.round(startPx * canvasScale), canvas.width, sliceCanvas.height,
          0, 0, canvas.width, sliceCanvas.height,
        );
      }
      const sliceImgData = sliceCanvas.toDataURL('image/png');
      const sliceHeightMm = sliceHeightPx * pxToMm;
      pdf.addImage(sliceImgData, 'PNG', marginMm, marginMm, contentWidthMm, sliceHeightMm);
      drawPdfFooter(pdf, pdfWidthMm, marginMm, page + 1, totalPages);
    }
  } finally {
    document.body.removeChild(container);
  }

  const safeName = (examSet.titleBn || 'question-paper').replace(/[^\w-]+/g, '-').slice(0, 60);
  pdf.save(`jobradarbd-questionpaper-${safeName}.pdf`);
}
