'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getJobExperience } from '@/lib/api';
import type { JobExperience, JobExperienceOutcome } from '@/lib/types';

const OUTCOME_META: Record<JobExperienceOutcome, { bn: string; en: string; bg: string; color: string }> = {
  SELECTED: { bn: 'নির্বাচিত', en: 'Selected', bg: '#ECFDF5', color: '#059669' },
  REJECTED: { bn: 'প্রত্যাখ্যাত', en: 'Rejected', bg: '#FEF2F2', color: '#DC2626' },
  WAITING:  { bn: 'অপেক্ষমান',   en: 'Waiting',  bg: '#FFFBEB', color: '#B45309' },
};

const STAGE_META: Record<string, { bn: string; en: string }> = {
  WRITTEN: { bn: 'লিখিত পরীক্ষা', en: 'Written Exam' },
  VIVA:    { bn: 'ভাইভা',         en: 'Viva' },
  FINAL:   { bn: 'চূড়ান্ত ফলাফল', en: 'Final Result' },
};

export default function JobExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, lang } = useLanguage();
  const [exp, setExp] = useState<JobExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJobExperience(Number(id))
      .then(setExp)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/job-experience" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('চাকরির অভিজ্ঞতা', 'Job Experiences')}
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-40 bg-white rounded-2xl border border-warm-border" />
          </div>
        ) : error || !exp ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('অভিজ্ঞতাটি পাওয়া যায়নি', 'Experience not found')}
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{exp.title}</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: OUTCOME_META[exp.outcome].bg, color: OUTCOME_META[exp.outcome].color }}>
                {t(OUTCOME_META[exp.outcome].bn, OUTCOME_META[exp.outcome].en)}
              </span>
            </div>

            <p className="text-sm text-warm-muted">
              {exp.organizationName}{exp.positionTitle ? ` • ${exp.positionTitle}` : ''}
            </p>

            <div className="flex items-center gap-3 text-xs text-warm-muted flex-wrap pb-4 border-b border-warm-border">
              <span>{exp.isAnonymous ? t('বেনামী', 'Anonymous') : exp.authorName}</span>
              <span>•</span>
              <span>{t(STAGE_META[exp.stageReached]?.bn ?? exp.stageReached, STAGE_META[exp.stageReached]?.en ?? exp.stageReached)}</span>
              <span>•</span>
              <span>{new Date(exp.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>•</span>
              <span>👁 {exp.viewCount} {t('দেখেছেন', 'views')}</span>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{exp.body}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
