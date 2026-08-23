'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import GooglePlayCta from '@/components/ui/GooglePlayCta';
import type { CategoryType } from '@/lib/types';

interface Props {
  categoryTypes?: CategoryType[];
}

const POPULAR_SEARCHES = ['BPSC', 'Bank', 'Police', 'NBR', 'Teacher', 'Engineer', 'IT', 'Army', 'NGO'];

export default function HeroSearch({ categoryTypes = [] }: Props) {
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
      {/* Soft decorative wash, kept subtle — light background instead of a
          solid dark gradient block, so the page opens with more whitespace
          and the illustration/search bar can carry the visual weight. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_45%,rgba(218,245,232,0.95),rgba(240,251,246,0.76)_38%,transparent_68%)]" />
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-primary-100/50 rounded-full blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 -left-16 w-56 h-56 bg-accent/10 rounded-full blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-11 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center">
          {/* Left: headline + search */}
          <div>
            <div className="inline-flex items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 text-xs font-medium text-primary-700 mb-4">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              {t('প্রতিদিন আপডেট', 'Updated daily')}
            </div>

              <h1 className="max-w-xl text-4xl sm:text-5xl font-bold leading-[1.17] tracking-tight text-ink">
                  {lang === 'bn' ? (
                      <>
                          জব রাডার<br />
                          ক্যারিয়ার গড়ুন <span className="text-primary">স্মার্ট ও নির্ভুল পথে</span>
                      </>
                  ) : (
                      <>
                          Your dream job is <span className="text-primary">already on our radar.</span>
                      </>
                  )}
              </h1>
              <p className="mt-4 text-sm sm:text-base text-warm-muted max-w-lg leading-relaxed">
                  {t(
                      'সরকারি, বেসরকারি, ব্যাংক ও অন্যান্য প্রতিষ্ঠানের সর্বশেষ নিয়োগ বিজ্ঞপ্তি, সেরা প্রস্তুতি এবং ক্যাটাগরিভিত্তিক জব আপডেট — সবই পাচ্ছেন এক প্ল্যাটফর্মে। চোখ রাখুন জব রাডারে, থাকুন এক ধাপ এগিয়ে।',
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
                {t('খুঁজুন', 'Search')}
              </button>
            </form>

            {/* Mobile app cross-promo — one calm line, not competing with search */}
            <div className="flex items-center gap-2.5 mt-5">
              <span className="text-xs text-warm-muted">
                {t('Job Radar এখন মোবাইলেও —', 'Job Radar is now on mobile too —')}
              </span>
              <GooglePlayCta compact />
            </div>

            {/* Popular searches */}
            <div className="flex items-center gap-1.5 flex-wrap mt-4">
              <span className="text-xs text-warm-muted mr-0.5">{t('জনপ্রিয় অনুসন্ধান:', 'Popular:')}</span>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => goSearch(term)}
                  className="px-2.5 py-1 rounded-full border border-warm-border text-gray-600 hover:border-primary hover:text-primary hover:bg-primary-50 text-xs transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Right: flat illustration — briefcase + application document,
              behind a soft dotted-ring backdrop. Inline SVG so there's no
              extra asset to ship or fetch. */}
          <div className="hidden lg:flex items-center justify-center lg:-mr-4">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <svg viewBox="0 0 340 300" className="w-full max-w-md h-auto" aria-hidden="true">
      {/* Dotted ring backdrop */}
      <circle cx="170" cy="150" r="130" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 10" className="text-primary-200" />
      <circle cx="170" cy="150" r="105" fill="currentColor" className="text-primary-50" />
      <path d="M102 84c36-44 120-54 167-8 48 48 37 131-14 161-51 29-137 12-164-40-23-44-15-83 11-113z" fill="currentColor" className="text-primary-100/70" />

      {/* Document / application form, tucked behind the briefcase */}
      <g transform="translate(150 55)">
        <rect x="0" y="0" width="110" height="150" rx="10" fill="white" stroke="currentColor" strokeWidth="2" className="text-primary-200" />
        <circle cx="30" cy="30" r="12" fill="currentColor" className="text-primary-100" />
        <rect x="50" y="24" width="45" height="6" rx="3" fill="currentColor" className="text-primary-200" />
        <rect x="50" y="36" width="30" height="5" rx="2.5" fill="currentColor" className="text-primary-100" />
        <rect x="16" y="60" width="78" height="5" rx="2.5" fill="currentColor" className="text-primary-100" />
        <rect x="16" y="72" width="78" height="5" rx="2.5" fill="currentColor" className="text-primary-100" />
        <rect x="16" y="84" width="55" height="5" rx="2.5" fill="currentColor" className="text-primary-100" />
        <rect x="16" y="106" width="40" height="16" rx="8" fill="currentColor" className="text-accent" />
      </g>

      {/* Briefcase */}
      <g transform="translate(55 120)">
        <rect x="10" y="30" width="130" height="90" rx="14" fill="currentColor" className="text-primary" />
        <rect x="10" y="30" width="130" height="28" rx="14" fill="currentColor" className="text-primary-600" />
        <rect x="55" y="10" width="40" height="26" rx="8" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary" />
        <rect x="65" y="66" width="20" height="16" rx="4" fill="currentColor" className="text-accent" />
      </g>

      {/* Magnifying glass accent, top-right of the briefcase */}
      <g transform="translate(205 90)">
        <circle cx="18" cy="18" r="16" fill="white" stroke="currentColor" strokeWidth="5" className="text-accent" />
        <line x1="30" y1="30" x2="42" y2="42" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-accent" />
      </g>

      {/* Floating dots */}
      <circle cx="60" cy="70" r="4" fill="currentColor" className="text-accent" />
      <circle cx="270" cy="200" r="5" fill="currentColor" className="text-primary-300" />
      <circle cx="90" cy="240" r="3.5" fill="currentColor" className="text-accent" />
    </svg>
  );
}
