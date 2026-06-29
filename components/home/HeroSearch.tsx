'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function HeroSearch() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [q, setQ] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/jobs?q=${encodeURIComponent(q.trim())}`);
    else router.push('/jobs');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 text-white">
      {/* Decorative circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-accent/10 rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            {t('প্রতিদিন নতুন বিজ্ঞপ্তি আপডেট হচ্ছে', 'Updated daily with new circulars')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
            {lang === 'bn' ? (
              <>আজকের সেরা<br /><span className="text-accent">চাকরির বিজ্ঞপ্তি</span></>
            ) : (
              <>Today&apos;s Best<br /><span className="text-accent">Job Circulars</span></>
            )}
          </h1>
          <p className="text-primary-100 text-lg mb-8">
            {t(
              'সরকারি, ব্যাংক, এনজিও ও বেসরকারি — সব চাকরির বিজ্ঞপ্তি এক জায়গায়।',
              'Government, Bank, NGO & Private — all job circulars in one place.',
            )}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('পদের নাম বা প্রতিষ্ঠান খুঁজুন...', 'Search by post or organization...')}
                className="w-full pl-11 pr-4 py-4 rounded-xl text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent shadow-lg"
              />
            </div>
            <button type="submit" className="px-6 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors shadow-lg whitespace-nowrap">
              {t('খুঁজুন', 'Search')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
