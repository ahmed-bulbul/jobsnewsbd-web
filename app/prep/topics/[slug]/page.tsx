'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getPrepTopic } from '@/lib/api';
import type { PrepContent, PrepTopicDetail } from '@/lib/types';

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

export default function PrepTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const [data, setData] = useState<PrepTopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPrepTopic(slug)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

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
              <p className="text-xs text-warm-muted mt-3">
                {data.contents.length} {t('টি কন্টেন্ট', 'contents')}
              </p>
            </div>

            {/* Exam banner */}
            <Link
              href={`/prep/topics/${slug}/exam`}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 mb-6 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' }}
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-base">{t('পরীক্ষা দিন', 'Take Exam')}</p>
                <p className="text-white/75 text-xs mt-0.5">{t('MCQ পরীক্ষায় অংশ নিন ও নিজেকে যাচাই করুন', 'Take MCQ exam and test yourself')}</p>
              </div>
              <svg className="w-5 h-5 text-white/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

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
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
