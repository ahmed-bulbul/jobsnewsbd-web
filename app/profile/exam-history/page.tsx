'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getMyAttempts, getAttemptResult } from '@/lib/api';
import { ResultView } from '@/components/exam/ResultView';
import type { ExamAttemptSummary, ExamResult } from '@/lib/types';

function StatBox({ value, bn, en }: { value: string | number; bn: string; en: string }) {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-2xl border border-warm-border p-4 text-center">
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-warm-muted mt-0.5">{t(bn, en)}</div>
    </div>
  );
}

const PASS_THRESHOLD = 50;

function AttemptRow({ attempt, onOpen }: { attempt: ExamAttemptSummary; onOpen: () => void }) {
  const { lang, t } = useLanguage();
  const pct = attempt.totalQuestions > 0 ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0;
  const pctColor = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';
  const passed = pct >= PASS_THRESHOLD;
  const date = new Date(attempt.submittedAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-warm-border p-4 hover:border-primary hover:shadow-sm transition-all flex items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm truncate">{attempt.examSetTitleBn}</p>
          <span
            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              attempt.attemptType === 'LIVE' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {attempt.attemptType === 'LIVE' ? t('লাইভ', 'LIVE') : t('অনুশীলন', 'Practice')}
          </span>
        </div>
        <p className="text-xs text-warm-muted mt-1 truncate">{attempt.topicNameBn}</p>
        <p className="text-xs text-warm-muted mt-0.5">{date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-bold" style={{ color: pctColor }}>{attempt.score}/{attempt.totalQuestions}</p>
        <p className="text-xs font-semibold" style={{ color: pctColor }}>{pct}%</p>
        <span
          className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {passed ? t('উত্তীর্ণ', 'Pass') : t('অনুত্তীর্ণ', 'Fail')}
        </span>
      </div>
      <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function ExamHistoryInner() {
  const { user, openModal } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const openAttemptId = searchParams.get('attempt');

  const [attempts, setAttempts] = useState<ExamAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<ExamResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    if (!user?.token) { setLoading(false); return; }
    getMyAttempts(user.token)
      .then((rows) => setAttempts(rows.slice().sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt))))
      .catch(() => setError(t('লোড করা যায়নি', 'Failed to load')))
      .finally(() => setLoading(false));
  }, [user, t]);

  useEffect(() => {
    if (!openAttemptId || !user?.token) { setDetail(null); return; }
    setDetailLoading(true);
    setDetailError('');
    getAttemptResult(user.token, Number(openAttemptId))
      .then(setDetail)
      .catch(() => setDetailError(t('ফলাফল লোড করা যায়নি', 'Failed to load result')))
      .finally(() => setDetailLoading(false));
  }, [openAttemptId, user, t]);

  const stats = useMemo(() => {
    const total = attempts.length;
    const live = attempts.filter((a) => a.attemptType === 'LIVE').length;
    const pcts = attempts.map((a) => (a.totalQuestions > 0 ? (a.score / a.totalQuestions) * 100 : 0));
    const avg = pcts.length ? Math.round(pcts.reduce((s, v) => s + v, 0) / pcts.length) : 0;
    const best = pcts.length ? Math.round(Math.max(...pcts)) : 0;
    return { total, live, avg, best };
  }, [attempts]);

  if (!loading && !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-xl font-bold text-gray-900">{t('লগইন প্রয়োজন', 'Login required')}</h2>
            <button onClick={() => openModal('login')} className="btn-primary px-6 py-3">
              {t('লগইন করুন', 'Login')}
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const activeSummary = attempts.find((a) => String(a.attemptId) === openAttemptId);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div>
            <Link href="/profile" className="text-sm text-warm-muted hover:text-primary transition-colors">
              ← {t('প্রোফাইলে ফিরুন', 'Back to profile')}
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mt-2">📊 {t('পরীক্ষার ফলাফল', 'Exam History')}</h1>
            <p className="text-sm text-warm-muted mt-1">
              {t('আপনার দেওয়া সব পরীক্ষা ও ফলাফল এখানে দেখুন', 'View all the exams you have taken and your results')}
            </p>
          </div>

          {openAttemptId ? (
            detailLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-white rounded-2xl border border-warm-border" />
                {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-warm-border" />)}
              </div>
            ) : detailError ? (
              <div className="text-center py-16">
                <p className="text-red-500 font-medium mb-4">{detailError}</p>
                <button onClick={() => router.push('/profile/exam-history')} className="btn-outline px-6 py-2.5">
                  {t('ফিরে যান', 'Go back')}
                </button>
              </div>
            ) : detail ? (
              <ResultView
                result={detail}
                backHref="/profile/exam-history"
                examTitle={activeSummary?.examSetTitleBn ?? t('পরীক্ষা', 'Exam')}
              />
            ) : null
          ) : (
            <>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

              {loading ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
                  </div>
                </>
              ) : attempts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-warm-border p-12 text-center text-warm-muted">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="font-medium text-gray-700 mb-1">{t('এখনো কোনো পরীক্ষা দেননি', 'No exams taken yet')}</p>
                  <p className="text-sm mb-4">{t('প্রস্তুতি কর্নার থেকে পরীক্ষা দিন', 'Take an exam from Job Preparation')}</p>
                  <Link href="/prep" className="btn-primary inline-flex px-6 py-2.5">
                    {t('পরীক্ষা খুঁজুন', 'Find exams')}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatBox value={stats.total} bn="মোট পরীক্ষা" en="Total exams" />
                    <StatBox value={stats.live} bn="লাইভ পরীক্ষা" en="Live exams" />
                    <StatBox value={`${stats.avg}%`} bn="গড় স্কোর" en="Average score" />
                    <StatBox value={`${stats.best}%`} bn="সেরা স্কোর" en="Best score" />
                  </div>

                  <div className="space-y-3">
                    {attempts.map((a) => (
                      <AttemptRow
                        key={a.attemptId}
                        attempt={a}
                        onOpen={() => router.push(`/profile/exam-history?attempt=${a.attemptId}`)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ExamHistoryPage() {
  return (
    <Suspense fallback={null}>
      <ExamHistoryInner />
    </Suspense>
  );
}
