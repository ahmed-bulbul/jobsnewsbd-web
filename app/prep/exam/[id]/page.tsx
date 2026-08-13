'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ResultView } from '@/components/exam/ResultView';
import { useLanguage } from '@/context/LanguageContext';
import { getExamQuestions, getExamSets, getPrepTopic, startExamAttempt, syncExamAnswers, submitExamAttempt } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { ExamQuestionPublic, ExamResult, ExamSet } from '@/lib/types';

function examStatus(s: Pick<ExamSet, 'startsAt' | 'endsAt'>): 'upcoming' | 'live' | 'ended' {
  const now = new Date();
  if (new Date(s.startsAt) > now) return 'upcoming';
  if (new Date(s.endsAt) < now) return 'ended';
  return 'live';
}

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

// ── Main exam page ────────────────────────────────────────────────────────────

function ExamTakingInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const examSetId = Number(id);
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const examTitle = searchParams.get('title') ?? '';
  const duration = Number(searchParams.get('duration') ?? 30);
  const backSlug = searchParams.get('slug') ?? '';
  const storageKey = `exam-attempt-${examSetId}`;

  const [questions, setQuestions] = useState<ExamQuestionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [initialRemaining, setInitialRemaining] = useState<number | null>(null);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [examSet, setExamSet] = useState<ExamSet | null>(null);
  const [examSetChecked, setExamSetChecked] = useState(false);

  useEffect(() => {
    getExamQuestions(examSetId)
      .then((qs) => setQuestions(qs))
      .catch(() => setLoadError(t('প্রশ্ন লোড করা যায়নি', 'Failed to load questions')))
      .finally(() => setLoading(false));
  }, [examSetId, t]);

  // Look up this exam set's own window/attempt-count so we can block a repeat
  // live attempt client-side too (the backend rejects it either way — this is
  // just so the user sees it before typing answers, not after submitting).
  useEffect(() => {
    if (!backSlug) { setExamSetChecked(true); return; }
    getPrepTopic(backSlug)
      .then((topic) => getExamSets(topic.id))
      .then((sets) => setExamSet(sets.find((s) => s.id === examSetId) ?? null))
      .catch(() => {})
      .finally(() => setExamSetChecked(true));
  }, [backSlug, examSetId]);

  const alreadyAttemptedLive = !!examSet && examStatus(examSet) === 'live' && examSet.userAttemptCount > 0;
  const examInProgress = started && !result;

  const handleSubmit = async (
    answersOverride?: Record<number, string | null>,
    attemptIdOverride?: number | null,
  ) => {
    if (!user?.token) { setSubmitError(t('পরীক্ষা দিতে লগইন করুন', 'Please login to submit')); return; }
    setSubmitting(true);

    const effectiveAnswers = answersOverride ?? answers;
    const effectiveAttemptId = attemptIdOverride !== undefined ? attemptIdOverride : attemptId;
    const payload = questions.map((q) => ({
      questionId: q.id,
      selectedOption: effectiveAnswers[q.id] ?? null,
    }));

    try {
      const res = await submitExamAttempt(examSetId, payload, user.token, effectiveAttemptId);
      setResult(res);
    } catch (err) {
      setSubmitError(err instanceof Error && err.message
        ? err.message
        : t('জমা দিতে ব্যর্থ। আবার চেষ্টা করুন।', 'Submission failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Resume-in-progress support: once an exam is started we persist
  // {startedAt, answers} to localStorage so closing the tab, losing
  // connectivity, or navigating away never lets someone dodge submission —
  // reopening this same exam resumes the running clock from where it really
  // is, and if time already ran out while they were away it force-submits
  // immediately with whatever was answered.
  useEffect(() => {
    if (loading || resumeChecked) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          startedAt: number;
          answers: Record<number, string | null>;
          attemptId?: number | null;
        };
        if (saved && typeof saved.startedAt === 'number') {
          const elapsedMs = Date.now() - saved.startedAt;
          const totalMs = duration * 60 * 1000;
          setAnswers(saved.answers ?? {});
          setStartedAt(saved.startedAt);
          setAttemptId(saved.attemptId ?? null);
          setStarted(true);
          if (elapsedMs >= totalMs) {
            setResumeChecked(true);
            void handleSubmit(saved.answers ?? {}, saved.attemptId ?? null);
            return;
          }
          setInitialRemaining(Math.max(0, Math.floor((totalMs - elapsedMs) / 1000)));
        }
      }
    } catch {
      // Corrupt/unavailable localStorage — fall back to a normal fresh start.
    }
    setResumeChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Keep localStorage in sync with the live attempt so a resume (tab
  // reopened, browser restarted, connection dropped) picks up exactly where
  // the answers were left off.
  useEffect(() => {
    if (!started || startedAt === null || result) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ startedAt, answers, attemptId }));
    } catch {
      // ignore — worst case a resume starts from scratch instead of crashing
    }
  }, [answers, started, startedAt, result, storageKey, attemptId]);

  // Best-effort push of the latest answers to the server so
  // ExamAttemptAutoSubmitScheduler has real answers to score from if this
  // tab is closed and never reopened past the exam's end time. Failures are
  // swallowed inside syncExamAnswers itself — this must never interrupt
  // someone actively taking the exam.
  useEffect(() => {
    if (!started || !attemptId || result || questions.length === 0 || !user?.token) return;
    const payload = questions.map((q) => ({ questionId: q.id, selectedOption: answers[q.id] ?? null }));
    void syncExamAnswers(attemptId, payload, user.token);
  }, [answers, started, attemptId, result, questions, user]);

  // Attempt resolved (submitted) — nothing left to resume, clear saved state.
  useEffect(() => {
    if (result) {
      try { localStorage.removeItem(storageKey); } catch {}
    }
  }, [result, storageKey]);

  const startExam = async () => {
    const now = Date.now();
    setStartedAt(now);
    setInitialRemaining(null);
    setStarted(true);

    let newAttemptId: number | null = null;
    if (user?.token) {
      try {
        const res = await startExamAttempt(examSetId, user.token);
        newAttemptId = res.attemptId;
        setAttemptId(res.attemptId);
      } catch {
        // Falls back to a client-only attempt — final submit will create a
        // fresh server-side row instead of finalizing a tracked one.
      }
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({ startedAt: now, answers: {}, attemptId: newAttemptId }));
    } catch {}
  };

  const confirmLeave = () => {
    const ok = window.confirm(t(
      'পরীক্ষা চলাকালীন ছেড়ে গেলেও সময় চলতে থাকবে এবং সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে। আপনি কি নিশ্চিত যে এখন ছেড়ে যেতে চান?',
      'Leaving now does not stop the clock — it will auto-submit once time runs out. Are you sure you want to leave?'
    ));
    if (ok) router.push(backSlug ? `/prep/topics/${backSlug}/exam` : '/prep');
  };

  // Warn on tab close/refresh while an attempt is running — the browser's own
  // (non-customizable) confirmation dialog, paired with the resume logic
  // above so leaving never actually lets the exam go unsubmitted.
  useEffect(() => {
    if (!examInProgress) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [examInProgress]);

  // Scroll back to the top when the result appears — otherwise the user is
  // left wherever they were scrolled to when they hit submit (often the very
  // bottom of a long question list) and never actually sees their result.
  useEffect(() => {
    if (result) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [result]);

  const answered = Object.values(answers).filter(Boolean).length;

  const autoSubmit = () => { if (!result) handleSubmit(); };
  const timer = useTimer(initialRemaining ?? duration * 60, started, autoSubmit);

  const optionText = (q: ExamQuestionPublic, opt: string) =>
    ({ A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt] ?? '');

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Back — during an active attempt, confirm first so leaving isn't accidental */}
        {examInProgress ? (
          <button onClick={confirmLeave}
            className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('পরীক্ষার তালিকা', 'Exam list')}
          </button>
        ) : (
          <Link href={backSlug ? `/prep/topics/${backSlug}/exam` : '/prep'}
            className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('পরীক্ষার তালিকা', 'Exam list')}
          </Link>
        )}

        {loading || !examSetChecked || !resumeChecked ? (
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
            <button
              onClick={() => openModal('login')}
              className="inline-block px-8 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
              {t('লগইন করুন', 'Login')}
            </button>
            <p className="text-xs text-warm-muted mt-4">
              {t('অ্যাকাউন্ট নেই?', "Don't have an account?")}{' '}
              <button onClick={() => openModal('register')} className="text-primary hover:underline">{t('নিবন্ধন করুন', 'Register')}</button>
            </p>
          </div>
        ) : loadError && !result ? (
          <div className="text-center py-20">
            <p className="text-red-500 font-medium mb-4">{loadError}</p>
          </div>
        ) : result ? (
          <ResultView result={result} backHref={backSlug ? `/prep/topics/${backSlug}/exam` : '/prep'} examTitle={examTitle} />
        ) : alreadyAttemptedLive ? (
          /* Blocked: already attempted this live exam once — no reattempt until it ends */
          <div className="bg-white rounded-2xl border border-warm-border p-10 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-100">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('ইতিমধ্যে পরীক্ষা দিয়েছেন', 'Already Attempted')}</h2>
            <p className="text-sm text-warm-muted mb-6 max-w-xs mx-auto">
              {t('এই পরীক্ষা চলাকালীন সময়ে আপনি একবার অংশ নিয়েছেন। সময়সীমা শেষ হলে অনুশীলন হিসেবে আবার দিতে পারবেন।', "You've already taken this exam during its live window. You'll be able to practice it again once the time period ends.")}
            </p>
            <Link href={backSlug ? `/prep/topics/${backSlug}/exam` : '/prep'}
              className="inline-block px-8 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #64748B, #475569)' }}>
              {t('পরীক্ষার তালিকায় ফিরে যান', 'Back to exam list')}
            </Link>
          </div>
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
              <li className="flex gap-2"><span className="text-amber-500">•</span>{t('একটি অপশন নির্বাচন করার পর সেটি আর পরিবর্তন করা যাবে না।', 'Once an option is selected, it cannot be changed.')}</li>
              <li className="flex gap-2"><span className="text-amber-500">•</span>{t('সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা হবে।', 'Auto-submits when time expires.')}</li>
              <li className="flex gap-2"><span className="text-amber-500">•</span>{t('লগইন ছাড়া জমা দেওয়া যাবে না।', 'Login required to submit.')}</li>
            </ul>
            <button onClick={startExam}
              className="px-8 py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
              {t('পরীক্ষা শুরু করুন', 'Start Exam')}
            </button>
          </div>
        ) : (
          /* Exam in progress */
          <>
            {/* Sticky top bar */}
            <div className="sticky top-16 z-10 bg-white border border-warm-border rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 shadow-sm">
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
                    {(() => {
                      // One-time selection: once an option is chosen for this
                      // question, it's locked — the exam taker can't change
                      // their mind, matching real proctored-exam behavior.
                      const locked = !!answers[q.id];
                      return (['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const selected = answers[q.id] === opt;
                        return (
                          <button key={opt}
                            onClick={() => { if (!locked) setAnswers((a) => ({ ...a, [q.id]: opt })); }}
                            disabled={locked}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all border disabled:cursor-not-allowed"
                            style={{
                              background: selected ? '#FFF7ED' : '#F9FAFB',
                              borderColor: selected ? '#D97706' : '#E5E7EB',
                              color: selected ? '#B45309' : '#374151',
                              fontWeight: selected ? 700 : 400,
                              opacity: locked && !selected ? 0.5 : 1,
                            }}>
                            <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: selected ? '#D97706' : '#E5E7EB', color: selected ? '#fff' : '#6B7280' }}>
                              {opt}
                            </span>
                            {optionText(q, opt)}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  {answers[q.id] && (
                    <p className="text-[11px] text-warm-muted mt-2">🔒 {t('উত্তর একবার নির্বাচন করার পর পরিবর্তন করা যাবে না', 'Answer locked once selected')}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Submit */}
            {submitError && <p className="text-red-500 text-sm text-center mb-3">{submitError}</p>}
            <button onClick={() => handleSubmit()} disabled={submitting}
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
