'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getExamQuestions, submitExamAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { ExamQuestionPublic, ExamResult, QuestionResult } from '@/lib/types';

// ── Timer ────────────────────────────────────────────────────────────────────

function useTimer(totalSeconds: number, active: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset remaining when totalSeconds changes (e.g. after fetch)
  useEffect(() => { setRemaining(totalSeconds); }, [totalSeconds]);

  useEffect(() => {
    if (!active) return;
    ref.current = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { clearInterval(ref.current!); onExpireRef.current(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [active]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return { label: `${mm}:${ss}`, urgent: remaining <= 60 };
}

// ── Result view ───────────────────────────────────────────────────────────────

function ResultView({ result, backHref }: { result: ExamResult; backHref: string }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<number | null>(null);
  const wrong = result.questions.filter((q) => q.selectedOption !== null && !q.correct).length;
  const skipped = result.questions.filter((q) => q.selectedOption === null).length;
  const pct = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;
  const scoreColor = pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626';

  const optionText = (q: QuestionResult, opt: string) =>
    ({ A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt] ?? '');

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="bg-white rounded-2xl border border-warm-border p-6 text-center">
        <p className="text-5xl font-black" style={{ color: scoreColor }}>{result.score}/{result.totalQuestions}</p>
        <p className="text-lg font-bold mt-1" style={{ color: scoreColor }}>{pct}% {t('সঠিক', 'correct')}</p>
        <div className="flex justify-center gap-8 mt-4 text-sm">
          <div><p className="font-bold text-green-600">{result.score}</p><p className="text-warm-muted text-xs">{t('সঠিক', 'Correct')}</p></div>
          <div className="w-px bg-warm-border" />
          <div><p className="font-bold text-red-500">{wrong}</p><p className="text-warm-muted text-xs">{t('ভুল', 'Wrong')}</p></div>
          <div className="w-px bg-warm-border" />
          <div><p className="font-bold text-gray-400">{skipped}</p><p className="text-warm-muted text-xs">{t('এড়িয়ে', 'Skipped')}</p></div>
        </div>
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

                <div className="grid grid-cols-2 gap-1.5 mt-3">
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

// ── Main exam page ────────────────────────────────────────────────────────────

function ExamTakingInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const examSetId = Number(id);
  const { t } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const examTitle = searchParams.get('title') ?? '';
  const duration = Number(searchParams.get('duration') ?? 30);
  const backSlug = searchParams.get('slug') ?? '';

  const [questions, setQuestions] = useState<ExamQuestionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getExamQuestions(examSetId)
      .then((qs) => setQuestions(qs))
      .catch(() => setError(t('প্রশ্ন লোড করা যায়নি', 'Failed to load questions')))
      .finally(() => setLoading(false));
  }, [examSetId, t]);

  const handleSubmit = async () => {
    if (!user?.token) { setError(t('পরীক্ষা দিতে লগইন করুন', 'Please login to submit')); return; }
    setSubmitting(true);

    const payload = questions.map((q) => ({
      questionId: q.id,
      selectedOption: answers[q.id] ?? null,
    }));

    try {
      const res = await submitExamAttempt(examSetId, payload, user.token);
      setResult(res);
    } catch {
      setError(t('জমা দিতে ব্যর্থ। আবার চেষ্টা করুন।', 'Submission failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const answered = Object.values(answers).filter(Boolean).length;

  const autoSubmit = () => { if (!result) handleSubmit(); };
  const timer = useTimer(duration * 60, started, autoSubmit);

  const optionText = (q: ExamQuestionPublic, opt: string) =>
    ({ A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt] ?? '');

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Back */}
        <Link href={backSlug ? `/prep/topics/${backSlug}/exam` : '/prep'}
          className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('পরীক্ষার তালিকা', 'Exam list')}
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            {[1,2,3].map((i) => <div key={i} className="h-40 bg-white rounded-2xl border border-warm-border" />)}
          </div>
        ) : !user ? (
          /* Login wall */
          <div className="bg-white rounded-2xl border border-warm-border p-10 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-50">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('লগইন প্রয়োজন', 'Login Required')}</h2>
            <p className="text-sm text-warm-muted mb-6 max-w-xs mx-auto">
              {t('পরীক্ষায় অংশ নিতে ও ফলাফল সংরক্ষণ করতে আগে লগইন করুন।', 'Please login to take the exam and save your results.')}
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/prep/exam/${examSetId}?title=${encodeURIComponent(examTitle)}&duration=${duration}&slug=${backSlug}`)}`}
              className="inline-block px-8 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
              {t('লগইন করুন', 'Login')}
            </Link>
            <p className="text-xs text-warm-muted mt-4">
              {t('অ্যাকাউন্ট নেই?', "Don't have an account?")}{' '}
              <Link href="/register" className="text-primary hover:underline">{t('নিবন্ধন করুন', 'Register')}</Link>
            </p>
          </div>
        ) : error && !result ? (
          <div className="text-center py-20">
            <p className="text-red-500 font-medium mb-4">{error}</p>
          </div>
        ) : result ? (
          <ResultView result={result} backHref={backSlug ? `/prep/topics/${backSlug}/exam` : '/prep'} />
        ) : !started ? (
          /* Start screen */
          <div className="bg-white rounded-2xl border border-warm-border p-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{examTitle || t('পরীক্ষা', 'Exam')}</h1>
            <div className="flex justify-center gap-6 text-sm text-warm-muted mt-4 mb-6">
              <span>📋 {questions.length} {t('টি প্রশ্ন', 'questions')}</span>
              <span>⏱ {duration} {t('মিনিট', 'min')}</span>
            </div>
            <ul className="text-sm text-gray-600 text-left space-y-2 mb-8 max-w-sm mx-auto">
              <li className="flex gap-2"><span className="text-amber-500">•</span>{t('প্রতিটি প্রশ্নে চারটি অপশন আছে।', 'Each question has 4 options.')}</li>
              <li className="flex gap-2"><span className="text-amber-500">•</span>{t('যেকোনো প্রশ্ন এড়িয়ে যেতে পারবেন।', 'You can skip any question.')}</li>
              <li className="flex gap-2"><span className="text-amber-500">•</span>{t('সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা হবে।', 'Auto-submits when time expires.')}</li>
              <li className="flex gap-2"><span className="text-amber-500">•</span>{t('লগইন ছাড়া জমা দেওয়া যাবে না।', 'Login required to submit.')}</li>
            </ul>
            <button onClick={() => setStarted(true)}
              className="px-8 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
              {t('পরীক্ষা শুরু করুন', 'Start Exam')}
            </button>
          </div>
        ) : (
          /* Exam in progress */
          <>
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 bg-white border border-warm-border rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 shadow-sm">
              <div className="flex-1">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%`, background: '#D97706' }} />
                </div>
                <p className="text-xs text-warm-muted mt-1">{answered}/{questions.length} {t('উত্তর দিয়েছেন', 'answered')}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
                style={{ background: timer.urgent ? '#FEE2E2' : '#FFF7ED', color: timer.urgent ? '#DC2626' : '#D97706' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {timer.label}
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4 mb-6">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl border border-warm-border p-5"
                  style={{ borderColor: answers[q.id] ? '#D97706' : undefined }}>
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 bg-amber-50 text-amber-600">{i + 1}</span>
                    <p className="text-sm font-semibold text-gray-900 leading-relaxed">{q.questionText}</p>
                  </div>
                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button key={opt} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all border"
                          style={{
                            background: selected ? '#FFF7ED' : '#F9FAFB',
                            borderColor: selected ? '#D97706' : '#E5E7EB',
                            color: selected ? '#B45309' : '#374151',
                            fontWeight: selected ? 700 : 400,
                          }}>
                          <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: selected ? '#D97706' : '#E5E7EB', color: selected ? '#fff' : '#6B7280' }}>
                            {opt}
                          </span>
                          {optionText(q, opt)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
              {submitting ? t('জমা দেওয়া হচ্ছে...', 'Submitting...') : `${t('উত্তর জমা দিন', 'Submit')} (${answered}/${questions.length})`}
            </button>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ExamTakingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <ExamTakingInner params={params} />
    </Suspense>
  );
}
