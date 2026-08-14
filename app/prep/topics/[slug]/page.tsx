'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getPrepTopic, getExamSets, ApiError } from '@/lib/api';
import type { ExamSet, PrepContent, PrepTopicDetail } from '@/lib/types';

function ContentTypeBadge({ type }: { type: string }) {
  const { t } = useLanguage();
  const map: Record<string, { label: string; labelEn: string; color: string; bg: string }> = {
    VIDEO: { label: 'ভিডিও',   labelEn: 'Video',   color: '#DC2626', bg: '#FEF2F2' },
    POST:  { label: 'আর্টিকেল', labelEn: 'Article', color: '#0F766E', bg: '#F0FDFA' },
    PDF:   { label: 'পিডিএফ',  labelEn: 'PDF',     color: '#7C3AED', bg: '#F5F3FF' },
    QUIZ:  { label: 'কুইজ',    labelEn: 'Quiz',    color: '#D97706', bg: '#FFFBEB' },
  };
  const m = map[type] ?? { label: type, labelEn: type, color: '#6B7280', bg: '#F9FAFB' };
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: m.color, background: m.bg }}>
      {t(m.label, m.labelEn)}
    </span>
  );
}

function ContentCard({ content }: { content: PrepContent }) {
  const { t } = useLanguage();

  const isVideo = content.contentType === 'VIDEO';
  const icon = isVideo
    ? (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );

  return (
    <Link
      href={`/prep/content/${content.id}`}
      className="group bg-white rounded-xl border border-warm-border hover:border-primary hover:shadow-md transition-all p-4 flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-warm-border flex items-center justify-center shrink-0 group-hover:border-primary transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm leading-snug">
          {content.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <ContentTypeBadge type={content.contentType} />
          {content.durationSeconds && (
            <span className="text-xs text-warm-muted">
              {Math.floor(content.durationSeconds / 60)}{t('মি', 'm')}
            </span>
          )}
        </div>
      </div>
      <svg className="w-4 h-4 text-warm-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function examStatus(s: ExamSet): 'upcoming' | 'live' | 'ended' {
  const now = new Date();
  if (new Date(s.startsAt) > now) return 'upcoming';
  if (new Date(s.endsAt) < now) return 'ended';
  return 'live';
}

function ExamStatusBadge({ status }: { status: 'upcoming' | 'live' | 'ended' }) {
  const { t } = useLanguage();
  const cfg = {
    upcoming: { label: t('আসছে', 'Upcoming'), bg: '#F5F3FF', color: '#7C3AED' },
    live:     { label: t('চলছে', 'Live'),     bg: '#ECFDF5', color: '#059669' },
    ended:    { label: t('শেষ', 'Ended'),      bg: '#F3F4F6', color: '#6B7280' },
  }[status];
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function fmt(iso: string, lang: 'bn' | 'en') {
  return new Date(iso).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ExamCard({ examSet, slug }: { examSet: ExamSet; slug: string }) {
  const { t, lang } = useLanguage();
  const status = examStatus(examSet);
  const isLive = status === 'live';
  const alreadyAttemptedLive = isLive && examSet.userAttemptCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-warm-border p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-gray-900 text-base leading-snug">{examSet.titleBn}</h3>
        <ExamStatusBadge status={status} />
      </div>

      {examSet.descriptionBn && (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{examSet.descriptionBn}</p>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-warm-muted mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {examSet.questionCount} {t('টি প্রশ্ন', 'questions')}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {examSet.durationMinutes} {t('মিনিট', 'min')}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          {examSet.userAttemptCount} {t('বার দিয়েছেন', 'attempts')}
        </span>
      </div>

      <div className="text-xs text-warm-muted space-y-1 mb-4">
        <div className="flex gap-2"><span className="w-16 font-medium">{t('শুরু', 'Start')}:</span> {fmt(examSet.startsAt, lang)}</div>
        <div className="flex gap-2"><span className="w-16 font-medium">{t('শেষ', 'End')}:</span> {fmt(examSet.endsAt, lang)}</div>
      </div>

      {status === 'upcoming' ? (
        <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-purple-600 bg-purple-50 border border-purple-100">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {t('শীঘ্রই শুরু হবে', 'Starting soon')}
        </div>
      ) : alreadyAttemptedLive ? (
        <div className="flex flex-col items-center justify-center gap-1 w-full py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t('ইতিমধ্যে পরীক্ষা দিয়েছেন', 'Already Attempted')}
          </span>
          <span className="text-xs font-normal text-gray-400">
            {t('সময়সীমা শেষ হলে অনুশীলন করতে পারবেন', 'You can practice once the time period ends')}
          </span>
        </div>
      ) : (
        <Link
          href={`/prep/exam/${examSet.id}?title=${encodeURIComponent(examSet.titleBn)}&duration=${examSet.durationMinutes}&slug=${slug}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: isLive ? 'linear-gradient(135deg, #D97706, #B45309)' : 'linear-gradient(135deg, #64748B, #475569)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {isLive ? t('পরীক্ষা শুরু করুন', 'Start Exam') : t('অনুশীলন করুন', 'Practice')}
        </Link>
      )}
    </div>
  );
}

export default function PrepTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<PrepTopicDetail | null>(null);
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [examLoading, setExamLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [tab, setTab] = useState<'live' | 'archive' | 'materials'>('live');

  useEffect(() => {
    getPrepTopic(slug, user?.token ?? undefined)
      .then((d) => {
        setData(d);
        setLoading(false);
        getExamSets(d.id)
          .then(setExamSets)
          .catch(() => {})
          .finally(() => setExamLoading(false));
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) setAccessDenied(true);
        else setError(true);
        setLoading(false);
        setExamLoading(false);
      });
  }, [slug, user]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/prep" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('প্রস্তুতি', 'Preparation')}
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-xl border border-warm-border" />
              ))}
            </div>
          </div>
        ) : accessDenied ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('ভর্তি প্রয়োজন', 'Enrollment Required')}</h2>
            <p className="text-warm-muted text-sm mb-4 max-w-sm">
              {t('এই বিষয়বস্তু দেখতে প্রথমে বিভাগে ভর্তি হন। ভর্তির জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।', 'Enroll in the category to access this content. Contact admin to enroll.')}
            </p>
            <Link href="/prep" className="text-sm text-primary hover:underline font-medium">
              ← {t('সব ক্যাটাগরি দেখুন', 'View all categories')}
            </Link>
          </div>
        ) : error || !data ? (
          <div className="text-center py-20 text-warm-muted">
            {t('বিষয়টি পাওয়া যায়নি', 'Topic not found')}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{data.nameBn}</h1>
              {data.nameEn && <p className="text-warm-muted text-sm mt-1">{data.nameEn}</p>}
              {data.description && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{data.description}</p>
              )}
            </div>

            {(() => {
              const liveSets = examSets.filter((s) => examStatus(s) === 'live');
              const archiveSets = examSets.filter((s) => examStatus(s) === 'ended');

              return (
                <>
                  {/* Tabs — study materials, currently-live exams, and past
                      exams kept strictly separate so each tab only ever
                      shows what its label promises. */}
                  <div className="flex gap-1 bg-white rounded-xl border border-warm-border p-1 mb-6 w-fit overflow-x-auto">
                    <button
                      onClick={() => setTab('live')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        tab === 'live' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'
                      }`}
                    >
                      {t('লাইভ পরীক্ষা', 'Live Exam')} ({liveSets.length})
                    </button>
                    <button
                      onClick={() => setTab('archive')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        tab === 'archive' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'
                      }`}
                    >
                      {t('আর্কাইভ', 'Archive')} ({archiveSets.length})
                    </button>
                    <button
                      onClick={() => setTab('materials')}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        tab === 'materials' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'
                      }`}
                    >
                      {t('স্টাডি ম্যাটেরিয়াল', 'Study Materials')} ({data.contents.length})
                    </button>
                  </div>

                  {tab === 'materials' ? (
                    <div className="space-y-2">
                      {data.contents.map((c) => (
                        <ContentCard key={c.id} content={c} />
                      ))}

                      {data.contents.length === 0 && (
                        <div className="text-center py-12 text-warm-muted text-sm">
                          {t('এখনো কোনো কন্টেন্ট যোগ করা হয়নি', 'No content added yet')}
                        </div>
                      )}
                    </div>
                  ) : examLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-warm-border" />)}
                    </div>
                  ) : tab === 'live' ? (
                    liveSets.length === 0 ? (
                      <div className="text-center py-12 text-warm-muted text-sm">
                        {t('এই মুহূর্তে কোনো লাইভ পরীক্ষা নেই', 'No live exam right now')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {liveSets.map((s) => (
                          <ExamCard key={s.id} examSet={s} slug={slug} />
                        ))}
                      </div>
                    )
                  ) : archiveSets.length === 0 ? (
                    <div className="text-center py-12 text-warm-muted text-sm">
                      {t('এখনো কোনো পুরনো পরীক্ষা নেই', 'No past exams yet')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archiveSets.map((s) => (
                        <ExamCard key={s.id} examSet={s} slug={slug} />
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
