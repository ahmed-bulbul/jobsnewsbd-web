'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getPrepTopic, getExamSets } from '@/lib/api';
import type { ExamSet } from '@/lib/types';

function examStatus(s: ExamSet): 'upcoming' | 'live' | 'ended' {
  const now = new Date();
  if (new Date(s.startsAt) > now) return 'upcoming';
  if (new Date(s.endsAt) < now) return 'ended';
  return 'live';
}

function StatusBadge({ status }: { status: 'upcoming' | 'live' | 'ended' }) {
  const cfg = {
    upcoming: { label: 'আসছে',   bg: '#F5F3FF', color: '#7C3AED' },
    live:     { label: 'চলছে',   bg: '#ECFDF5', color: '#059669' },
    ended:    { label: 'শেষ',    bg: '#F3F4F6', color: '#6B7280' },
  }[status];
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('bn-BD', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ExamListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const [topicId, setTopicId] = useState<number | null>(null);
  const [topicName, setTopicName] = useState('');
  const [sets, setSets] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrepTopic(slug).then((topic) => {
      setTopicId(topic.id);
      setTopicName(topic.nameBn);
      return getExamSets(topic.id);
    }).then(setSets).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Back */}
        <Link href={`/prep/topics/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {topicName || t('বিষয়', 'Topic')}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('পরীক্ষা', 'Exams')}</h1>
        {topicName && <p className="text-warm-muted text-sm mb-6">{topicName}</p>}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-warm-border" />)}
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('এই বিষয়ে কোনো পরীক্ষা নেই', 'No exams available for this topic')}
          </div>
        ) : (
          <div className="space-y-3">
            {sets.map((s) => {
              const status = examStatus(s);
              const isLive = status === 'live';
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-warm-border p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="font-bold text-gray-900 text-base leading-snug">{s.titleBn}</h2>
                    <StatusBadge status={status} />
                  </div>

                  {s.descriptionBn && (
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{s.descriptionBn}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-warm-muted mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {s.questionCount} {t('টি প্রশ্ন', 'questions')}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {s.durationMinutes} {t('মিনিট', 'min')}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      {s.userAttemptCount} {t('বার দিয়েছেন', 'attempts')}
                    </span>
                  </div>

                  <div className="text-xs text-warm-muted space-y-1 mb-4">
                    <div className="flex gap-2"><span className="w-16 font-medium">{t('শুরু', 'Start')}:</span> {fmt(s.startsAt)}</div>
                    <div className="flex gap-2"><span className="w-16 font-medium">{t('শেষ', 'End')}:</span> {fmt(s.endsAt)}</div>
                  </div>

                  {status === 'upcoming' ? (
                    <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-purple-600 bg-purple-50 border border-purple-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t('শীঘ্রই শুরু হবে', 'Starting soon')}
                    </div>
                  ) : (
                    <Link
                      href={`/prep/exam/${s.id}?title=${encodeURIComponent(s.titleBn)}&duration=${s.durationMinutes}&slug=${slug}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: isLive ? 'linear-gradient(135deg, #D97706, #B45309)' : 'linear-gradient(135deg, #64748B, #475569)' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {isLive ? t('পরীক্ষা শুরু করুন', 'Start Exam') : t('অনুশীলন করুন', 'Practice')}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
