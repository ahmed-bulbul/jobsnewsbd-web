'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import TodaySummaryCard from '@/components/home/TodaySummaryCard';
import type { CategoryType, PostSummary } from '@/lib/types';

export interface TodaySummary {
  newToday: number;
  closingToday: number;
  active: number;
  liveExamCount: number;
}

interface Props {
  categoryTypes?: CategoryType[];
  summary: TodaySummary;
  latestList: PostSummary[];
}

const TRUST_BADGES: Array<{ bn: string; en: string }> = [
  { bn: 'প্রতিটি বিজ্ঞপ্তির সাথে PDF', en: 'Original PDF included' },
  { bn: 'শেষ তারিখের অ্যালার্ট', en: 'Deadline alerts' },
  { bn: 'যাচাইকৃত তথ্য', en: 'Verified info' },
];

export default function HeroSearch({ categoryTypes = [], summary, latestList }: Props) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [categoryTypeId, setCategoryTypeId] = useState('');

  const goSearch = (query: string, ctId?: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (ctId) params.set('categoryTypeId', ctId);
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : '/jobs');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(q, categoryTypeId);
  };

  return (
    <section className="relative overflow-hidden bg-[#fbfdfb] border-b border-emerald-100/70">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_45%,rgba(218,245,232,0.95),rgba(240,251,246,0.76)_38%,transparent_68%)]" />
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-primary-100/50 rounded-full blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 -left-16 w-56 h-56 bg-accent/10 rounded-full blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-11 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center">
          {/* Left: headline + search */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 text-xs font-medium text-primary-700 mb-4">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              {t('প্রতিদিন যাচাই করে আপডেট', 'Verified & updated daily')}
            </div>

            <h1 className="max-w-xl text-4xl sm:text-5xl font-bold leading-[1.17] tracking-tight text-ink">
              {lang === 'bn' ? (
                <>
                  বাংলাদেশের সরকারি চাকরির বিজ্ঞপ্তি<br />
                  ও প্রস্তুতি — <span className="text-primary">এক জায়গায়</span>
                </>
              ) : (
                <>
                  Bangladesh govt job circulars<br />
                  <span className="text-primary">& prep, all in one place.</span>
                </>
              )}
            </h1>
            <p className="mt-4 text-sm sm:text-base text-warm-muted max-w-lg leading-relaxed">
              {t(
                'সরকারি, বেসরকারি, ব্যাংক ও অন্যান্য প্রতিষ্ঠানের সর্বশেষ নিয়োগ বিজ্ঞপ্তি, সেরা প্রস্তুতি এবং ক্যাটাগরিভিত্তিক জব আপডেট — সবই পাচ্ছেন এক প্ল্যাটফর্মে।',
                'Government, private, bank circulars, exam prep, and real-time updates — all simplified in one single dashboard.'
              )}
            </p>

            <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center bg-white rounded-2xl border border-warm-border shadow-card shadow-primary-950/[0.04] p-2">
              <div className="flex-1 flex items-center gap-2 px-2">
                <svg className="w-4 h-4 text-warm-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('পদের নাম বা প্রতিষ্ঠান খুঁজুন...', 'Search by post or organization...')}
                  className="w-full py-2.5 text-sm text-ink placeholder:text-warm-muted focus:outline-none bg-transparent"
                />
              </div>
              {categoryTypes.length > 0 && (
                <select
                  value={categoryTypeId}
                  onChange={(e) => setCategoryTypeId(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-gray-700 text-sm bg-cream sm:bg-transparent border-t sm:border-t-0 sm:border-l border-warm-border focus:outline-none sm:max-w-[150px]"
                  aria-label={t('সকল ধরন', 'All Categories')}
                >
                  <option value="">{t('সকল ধরন', 'All Categories')}</option>
                  {categoryTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {t(ct.nameBn, ct.nameEn ?? ct.nameBn)}
                    </option>
                  ))}
                </select>
              )}
              <button type="submit" className="btn-primary rounded-xl justify-center whitespace-nowrap">
                {t('চাকরি খুঁজুন', 'Search Jobs')}
              </button>
            </form>

            {/* Category quick-filter chips */}
            {categoryTypes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-4">
                {categoryTypes.map((ct) => (
                  <Link
                    key={ct.id}
                    href={`/jobs?categoryTypeId=${ct.id}`}
                    className="px-3 py-1.5 rounded-full border border-warm-border text-xs font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary-50 transition-colors"
                  >
                    {t(ct.nameBn, ct.nameEn ?? ct.nameBn)}
                  </Link>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4">
              {TRUST_BADGES.map((badge) => (
                <span key={badge.en} className="flex items-center gap-1.5 text-xs text-warm-muted">
                  <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t(badge.bn, badge.en)}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Today's Summary sidebar card */}
          <div className="lg:flex items-center justify-center">
            <TodaySummaryCard summary={summary} latestList={latestList} />
          </div>
        </div>
      </div>
    </section>
  );
}
