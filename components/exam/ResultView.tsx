'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import type { ExamResult, QuestionResult } from '@/lib/types';

export function ResultView({ result, backHref, examTitle }: { result: ExamResult; backHref: string; examTitle: string }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const skipped = result.questions.filter((q) => q.selectedOption === null).length;
  const wrong = result.wrongCount ?? result.questions.filter((q) => q.selectedOption !== null && !q.correct).length;
  const negativeMarkingActive = (result.negativeMarksPerWrong ?? 0) > 0;
  const displayScore = negativeMarkingActive ? result.finalScore : result.score;
  const pct = result.totalQuestions > 0 ? Math.round((displayScore / result.totalQuestions) * 100) : 0;
  const scoreColor = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';
  const passed = pct >= 50;
  const totalDeducted = negativeMarkingActive ? wrong * result.negativeMarksPerWrong : 0;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { downloadExamResultPdf } = await import('@/lib/examPdf');
      await downloadExamResultPdf(result, examTitle);
    } catch { /* best-effort — a failed export shouldn't block the rest of the page */ }
    finally { setDownloading(false); }
  };

  const optionText = (q: QuestionResult, opt: string) =>
    ({ A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt] ?? '');

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="bg-white rounded-2xl border border-warm-border p-6 text-center">
        <p className="text-5xl font-black" style={{ color: scoreColor }}>
          {negativeMarkingActive ? result.finalScore.toFixed(2) : result.score}/{result.totalQuestions}
        </p>
        <p className="text-lg font-bold mt-1" style={{ color: scoreColor }}>{pct}% {t('সঠিক', 'correct')}</p>
        {negativeMarkingActive && (
          <p className="text-xs text-warm-muted mt-1">
            {t(
              `প্রতি ভুল উত্তরে −${result.negativeMarksPerWrong} নম্বর কাটা হয়েছে • মোট কর্তন: −${totalDeducted.toFixed(2)}`,
              `−${result.negativeMarksPerWrong} deducted per wrong answer • Total deducted: −${totalDeducted.toFixed(2)}`
            )}
          </p>
        )}
        <span
          className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${
            passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {passed ? t('উত্তীর্ণ', 'Pass') : t('অনুত্তীর্ণ', 'Fail')}
        </span>
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <div><p className="font-bold text-green-600">{result.score}</p><p className="text-warm-muted text-xs">{t('সঠিক', 'Correct')}</p></div>
          <div className="w-px bg-warm-border" />
          <div><p className="font-bold text-red-500">{wrong}</p><p className="text-warm-muted text-xs">{t('ভুল', 'Wrong')}</p></div>
          <div className="w-px bg-warm-border" />
          <div><p className="font-bold text-gray-400">{skipped}</p><p className="text-warm-muted text-xs">{t('এড়িয়ে', 'Skipped')}</p></div>
        </div>

        <button onClick={handleDownloadPdf} disabled={downloading}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary-300 text-primary font-semibold text-sm hover:bg-primary-50 transition-colors disabled:opacity-60">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          {downloading ? t('PDF তৈরি হচ্ছে...', 'Preparing PDF...') : t('প্রশ্নপত্র PDF ডাউনলোড করুন', 'Download question paper (PDF)')}
        </button>
      </div>

      {/* Per-question review */}
      <h2 className="font-bold text-gray-900">{t('প্রশ্নের বিস্তারিত', 'Question review')}</h2>
      <div className="space-y-3">
        {result.questions.map((q, i) => {
          const isSkipped = q.selectedOption === null;
          const borderColor = isSkipped ? '#E5E7EB' : q.correct ? '#059669' : '#DC2626';
          return (
            <div key={q.questionId} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor }}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: `${borderColor}20`, color: borderColor }}>
                    {i + 1}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed flex-1">{q.questionText}</p>
                  <span className="text-base shrink-0">{isSkipped ? '⏭' : q.correct ? '✅' : '❌'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const txt = optionText(q, opt);
                    const isCorrect = q.correctOption === opt;
                    const isUser = q.selectedOption === opt;
                    return (
                      <div key={opt} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{
                          background: isCorrect ? '#DCFCE7' : isUser && !isCorrect ? '#FEE2E2' : '#F9FAFB',
                          color: isCorrect ? '#059669' : isUser && !isCorrect ? '#DC2626' : '#6B7280',
                          border: `1px solid ${isCorrect ? '#059669' : isUser && !isCorrect ? '#DC2626' : '#E5E7EB'}`,
                        }}>
                        <span className="font-bold mr-1">{opt}.</span>{txt}
                        {isCorrect && ' ✓'}{isUser && !isCorrect && ' ✗'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {(q.explanationText || q.explanationImageUrl) && (
                <div className="border-t" style={{ borderColor }}>
                  <button onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors text-left">
                    <span>💡</span>
                    {expanded === i ? t('ব্যাখ্যা লুকান', 'Hide explanation') : t('ব্যাখ্যা দেখুন', 'Show explanation')}
                  </button>
                  {expanded === i && (
                    <div className="px-4 pb-4 space-y-2">
                      {q.explanationText && <p className="text-sm text-gray-700 leading-relaxed">{q.explanationText}</p>}
                      {q.explanationImageUrl && (
                        <img src={q.explanationImageUrl} alt="explanation" className="rounded-xl max-w-full" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Link href={backHref} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
        {t('ফিরে যান', 'Go back')}
      </Link>
    </div>
  );
}
