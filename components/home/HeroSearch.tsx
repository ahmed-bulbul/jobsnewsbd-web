'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import GooglePlayCta from '@/components/ui/GooglePlayCta';
import PhoneMockup from '@/components/ui/PhoneMockup';
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
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_45%,rgba(218,245,232,0.95),rgba(240,251,246,0.76)_38%,transparent_68%)]" />
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-primary-100/50 rounded-full blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 -left-16 w-56 h-56 bg-accent/10 rounded-full blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-11 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center">
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

          {/* Right: app-download panel — phone mockups, QR code, Google Play badge */}
          <div className="hidden lg:flex items-center justify-center lg:-mr-4">
            <div className="flex items-center gap-6">
              <div className="max-w-[240px]">
                <h2 className="font-bold text-2xl leading-tight mb-2.5">
                  <span className="block text-ink">{t('Job Radar', 'Job Radar')}</span>
                  <span className="block text-primary">{t('অ্যাপ ডাউনলোড করুন', 'Download the app')}</span>
                </h2>
                <p className="text-sm text-warm-muted mb-5 leading-relaxed">
                  {t(
                    'চাকরির খবর, প্রস্তুতি, নোটিশ এবং সবকিছু এক অ্যাপে — যেখানেই থাকুন, বেখেয়াল থাকুন।',
                    'Job news, exam prep, notices and everything else in one app.'
                  )}
                </p>
                <div className="flex items-center gap-3.5">
                  <div className="bg-white rounded-xl p-2 shadow-[0_2px_12px_rgba(16,24,32,0.08)] border border-warm-border/70 shrink-0">
                    <Image
                      src="/qr-google-play.png"
                      alt={t('Google Play QR কোড', 'Google Play QR code')}
                      width={64}
                      height={64}
                      className="rounded-md block"
                    />
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-[11px] text-warm-muted leading-snug">
                      {t('স্ক্যান করুন, অথবা —', 'Scan, or —')}
                    </span>
                    <GooglePlayCta compact />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <PhoneMockup size="lg" />
                <PhoneMockup size="lg" stacked />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
