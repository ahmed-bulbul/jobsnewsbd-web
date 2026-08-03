'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CopyGuard from '@/components/questionbank/CopyGuard';
import { useLanguage } from '@/context/LanguageContext';
import { getQuestionBankCategory } from '@/lib/api';
import type { QuestionBankCategoryDetail, QuestionBankQuestion, QuestionBankType } from '@/lib/types';

type FilterTab = 'ALL' | QuestionBankType;

const TYPE_BADGE: Record<QuestionBankType, { bn: string; en: string; color: string; bg: string }> = {
  MCQ: { bn: 'MCQ', en: 'MCQ', color: '#1D4ED8', bg: '#EFF6FF' },
  WRITTEN: { bn: 'লিখিত', en: 'Written', color: '#0F766E', bg: '#F0FDFA' },
  LAB: { bn: 'ল্যাব', en: 'Lab', color: '#B45309', bg: '#FFFBEB' },
};

// A "post group" = every question sharing the same (institute, post) pair,
// regardless of year — e.g. all "AD (ICT) — Bangladesh Bank" questions
// across 2023/2024/2025 live under one card. Untagged questions (no
// institute/post at all) fall into their own group with a generic label.
interface PostGroup {
  key: string;
  institute: string | null;
  post: string | null;
  years: number[];
  count: number;
}

function buildPostGroups(questions: QuestionBankQuestion[]): PostGroup[] {
  const map = new Map<string, PostGroup>();
  for (const q of questions) {
    const key = `${q.examInstitute ?? ''}|${q.examPost ?? ''}`;
    let group = map.get(key);
    if (!group) {
      group = { key, institute: q.examInstitute, post: q.examPost, years: [], count: 0 };
      map.set(key, group);
    }
    group.count++;
    if (q.examYear && !group.years.includes(q.examYear)) group.years.push(q.examYear);
  }
  for (const g of map.values()) g.years.sort((a, b) => b - a);
  return Array.from(map.values()).sort((a, b) => {
    // Tagged groups first (institute or post set), untagged last.
    const aTagged = !!(a.institute || a.post);
    const bTagged = !!(b.institute || b.post);
    if (aTagged !== bTagged) return aTagged ? -1 : 1;
    return (b.years[0] ?? 0) - (a.years[0] ?? 0);
  });
}

function groupTitle(g: PostGroup, t: (bn: string, en: string) => string) {
  if (!g.institute && !g.post) return t('সাধারণ প্রশ্ন', 'General Questions');
  return [g.post, g.institute].filter(Boolean).join(' — ');
}

function PostCard({ group, onClick, t }: { group: PostGroup; onClick: () => void; t: (bn: string, en: string) => string }) {
  const yearsLabel = group.years.length > 0
    ? group.years.length === 1 ? String(group.years[0]) : `${group.years[group.years.length - 1]}–${group.years[0]}`
    : null;

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-md transition-all p-4 flex flex-col gap-1.5"
    >
      <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg select-none">
        📄
      </div>
      <h3 className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors leading-snug">
        {groupTitle(group, t)}
      </h3>
      <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
        {yearsLabel && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{yearsLabel}</span>
        )}
        <span className="text-xs text-warm-muted">{group.count} {t('টি প্রশ্ন', 'questions')}</span>
      </div>
    </button>
  );
}

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
            {q.examYear && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{q.examYear}</span>
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

  const [groupKey, setGroupKey] = useState<string | null>(null); // null = card grid view
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [year, setYear] = useState('ALL');

  useEffect(() => {
    getQuestionBankCategory(slug)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Reset everything whenever the category changes.
  useEffect(() => { setGroupKey(null); setTab('ALL'); setYear('ALL'); }, [slug]);

  const groups = data ? buildPostGroups(data.questions) : [];
  const activeGroup = groups.find((g) => g.key === groupKey) ?? null;

  const openGroup = (g: PostGroup) => { setGroupKey(g.key); setTab('ALL'); setYear('ALL'); window.scrollTo(0, 0); };
  const backToGrid = () => setGroupKey(null);

  const groupQuestions = activeGroup && data
    ? data.questions.filter((q) => `${q.examInstitute ?? ''}|${q.examPost ?? ''}` === activeGroup.key)
    : [];

  const byYear = groupQuestions.filter((q) => year === 'ALL' || String(q.examYear) === year);
  const filtered = byYear.filter((q) => tab === 'ALL' || q.questionType === tab);

  const counts = {
    ALL: byYear.length,
    MCQ: byYear.filter((q) => q.questionType === 'MCQ').length,
    WRITTEN: byYear.filter((q) => q.questionType === 'WRITTEN').length,
    LAB: byYear.filter((q) => q.questionType === 'LAB').length,
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <CopyGuard />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 select-none">
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
        ) : !activeGroup ? (
          <>
            {/* ── Card grid: one card per job post ── */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-gray-900">{data.nameBn}</h1>
              {data.nameEn && <p className="text-sm text-warm-muted mt-0.5">{data.nameEn}</p>}
              {data.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{data.description}</p>}
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-16 text-warm-muted text-sm">{t('এখনো কোনো প্রশ্ন যোগ করা হয়নি', 'No questions added yet')}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((g) => <PostCard key={g.key} group={g} onClick={() => openGroup(g)} t={t} />)}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── Question view for one job post ── */}
            <button onClick={backToGrid} className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('সব পদ', 'All posts')}
            </button>

            <h1 className="text-xl font-bold text-gray-900 mb-4">{groupTitle(activeGroup, t)}</h1>

            {activeGroup.years.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setYear('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${year === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'border-warm-border text-gray-600 hover:border-gray-400 bg-white'}`}
                >
                  {t('সব বছর', 'All years')}
                </button>
                {activeGroup.years.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setYear(String(yr))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${year === String(yr) ? 'bg-amber-600 text-white border-amber-600' : 'border-amber-200 text-amber-700 bg-amber-50 hover:border-amber-400'}`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-1 bg-white border border-warm-border rounded-xl p-1 mb-5 w-fit flex-wrap">
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
