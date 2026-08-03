'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getQuestionBankCategory } from '@/lib/api';
import type { QuestionBankCategoryDetail, QuestionBankQuestion, QuestionBankType } from '@/lib/types';

type FilterTab = 'ALL' | QuestionBankType;

const TYPE_BADGE: Record<QuestionBankType, { bn: string; en: string; color: string; bg: string }> = {
  MCQ: { bn: 'MCQ', en: 'MCQ', color: '#1D4ED8', bg: '#EFF6FF' },
  WRITTEN: { bn: 'লিখিত', en: 'Written', color: '#0F766E', bg: '#F0FDFA' },
  LAB: { bn: 'ল্যাব', en: 'Lab', color: '#B45309', bg: '#FFFBEB' },
};

function QuestionCard({ q, index }: { q: QuestionBankQuestion; index: number }) {
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const badge = TYPE_BADGE[q.questionType];

  return (
    <div className="bg-white rounded-2xl border border-warm-border p-4 sm:p-5">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xs font-bold text-gray-400 mt-0.5 shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: badge.color, background: badge.bg }}>
              {t(badge.bn, badge.en)}
            </span>
            {(q.examInstitute || q.examYear) && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {[q.examInstitute, q.examYear].filter(Boolean).join(' ')}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">{q.questionText}</p>
        </div>
      </div>

      {q.questionType === 'MCQ' && (
        <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
            const text = opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
            if (!text) return null;
            const isCorrect = revealed && q.correctOption === opt;
            return (
              <span
                key={opt}
                className={`text-xs px-2.5 py-1.5 rounded-lg ${isCorrect ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-50 text-gray-600'}`}
              >
                {opt}. {text}
              </span>
            );
          })}
        </div>
      )}

      {revealed && q.questionType !== 'MCQ' && q.answerText && (
        <div className="ml-6 mt-3 bg-primary-50/50 border border-primary-100 rounded-xl p-3">
          <p className="text-[10px] font-bold text-primary mb-1">
            {q.questionType === 'LAB' ? t('সমাধান', 'Solution') : t('মডেল উত্তর', 'Model Answer')}
          </p>
          <p className={`text-sm text-gray-800 whitespace-pre-wrap leading-relaxed ${q.questionType === 'LAB' ? 'font-mono text-xs' : ''}`}>
            {q.answerText}
          </p>
        </div>
      )}

      {revealed && q.explanationText && (
        <div className="ml-6 mt-2">
          <p className="text-xs text-gray-500 leading-relaxed"><span className="font-semibold">{t('ব্যাখ্যা:', 'Explanation:')}</span> {q.explanationText}</p>
        </div>
      )}

      <div className="ml-6 mt-3">
        <button
          onClick={() => setRevealed((r) => !r)}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {revealed ? t('উত্তর লুকান', 'Hide answer') : t('উত্তর দেখুন →', 'Show answer →')}
        </button>
      </div>
    </div>
  );
}

export default function QuestionBankCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const [data, setData] = useState<QuestionBankCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [examKey, setExamKey] = useState('ALL');

  useEffect(() => {
    getQuestionBankCategory(slug)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Reset filters whenever the category changes, so a stale selection from a
  // previous category doesn't silently hide everything.
  useEffect(() => { setExamKey('ALL'); setTab('ALL'); }, [slug]);

  // One button per distinct (institute, post, year) combo actually tagged on
  // a question — e.g. "Bangladesh Bank - AD (ICT) 2025" — so a user can jump
  // straight to everything from one specific real-world exam in one click.
  const examCombos = data ? (() => {
    const map = new Map<string, { key: string; label: string; institute: string | null; post: string | null; year: number | null }>();
    data.questions.forEach((q) => {
      if (!q.examInstitute && !q.examPost && !q.examYear) return;
      const key = `${q.examInstitute ?? ''}|${q.examPost ?? ''}|${q.examYear ?? ''}`;
      if (map.has(key)) return;
      const namePart = [q.examInstitute, q.examPost].filter(Boolean).join(' - ');
      const label = [namePart, q.examYear].filter(Boolean).join(' ');
      map.set(key, { key, label: label || namePart, institute: q.examInstitute, post: q.examPost, year: q.examYear });
    });
    return Array.from(map.values()).sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.label.localeCompare(b.label));
  })() : [];

  const selectedCombo = examCombos.find((c) => c.key === examKey) ?? null;

  const byType = data ? data.questions.filter((q) => tab === 'ALL' || q.questionType === tab) : [];
  const filtered = byType.filter((q) => {
    if (!selectedCombo) return true;
    return q.examInstitute === selectedCombo.institute && q.examPost === selectedCombo.post && q.examYear === selectedCombo.year;
  });

  const counts = data ? {
    ALL: data.questions.length,
    MCQ: data.questions.filter((q) => q.questionType === 'MCQ').length,
    WRITTEN: data.questions.filter((q) => q.questionType === 'WRITTEN').length,
    LAB: data.questions.filter((q) => q.questionType === 'LAB').length,
  } : { ALL: 0, MCQ: 0, WRITTEN: 0, LAB: 0 };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6 flex-wrap">
          <Link href="/study-corner" className="hover:text-primary transition-colors">{t('স্টাডি কর্নার', 'Study Corner')}</Link>
          <span>›</span>
          <Link href="/study-corner/question-bank" className="hover:text-primary transition-colors">{t('প্রশ্ন ব্যাংক', 'Question Bank')}</Link>
          {data && <><span>›</span><span className="text-gray-700 font-medium">{data.nameBn}</span></>}
        </nav>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48" />
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-warm-border" />)}
          </div>
        ) : error || !data ? (
          <div className="text-center py-20 text-warm-muted">{t('ক্যাটাগরি পাওয়া যায়নি', 'Category not found')}</div>
        ) : (
          <>
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-gray-900">{data.nameBn}</h1>
              {data.nameEn && <p className="text-sm text-warm-muted mt-0.5">{data.nameEn}</p>}
              {data.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{data.description}</p>}
            </div>

            <div className="flex gap-1 bg-white border border-warm-border rounded-xl p-1 mb-3 w-fit flex-wrap">
              {(['ALL', 'MCQ', 'WRITTEN', 'LAB'] as FilterTab[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTab(f)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === f ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'}`}
                >
                  {f === 'ALL' ? t('সব', 'All') : t(TYPE_BADGE[f].bn, TYPE_BADGE[f].en)} ({counts[f]})
                </button>
              ))}
            </div>

            {examCombos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setExamKey('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${examKey === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'border-warm-border text-gray-600 hover:border-gray-400 bg-white'}`}
                >
                  {t('সব পরীক্ষা', 'All exams')}
                </button>
                {examCombos.map((combo) => (
                  <button
                    key={combo.key}
                    onClick={() => setExamKey(examKey === combo.key ? 'ALL' : combo.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${examKey === combo.key ? 'bg-amber-600 text-white border-amber-600' : 'border-amber-200 text-amber-700 bg-amber-50 hover:border-amber-400'}`}
                  >
                    {combo.label}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-warm-muted text-sm">
                {t('এই ফিল্টারে কোনো প্রশ্ন নেই', 'No questions match this filter')}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
