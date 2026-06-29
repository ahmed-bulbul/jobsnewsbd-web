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
      {/* Decorative circles — smaller, less intrusive */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-accent/10 rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">
        {/* Single row: headline left, search right on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-10">

          {/* Left: title + pulse badge */}
          <div className="shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs mb-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              {t('প্রতিদিন আপডেট', 'Updated daily')}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold leading-snug">
              {lang === 'bn' ? (
                <>আজকের সেরা <span className="text-accent">চাকরির বিজ্ঞপ্তি</span></>
              ) : (
                <>Today&apos;s Best <span className="text-accent">Job Circulars</span></>
              )}
            </h1>
          </div>

          {/* Right: search bar — fills remaining space */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('পদের নাম বা প্রতিষ্ঠান খুঁজুন...', 'Search by post or organization...')}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent shadow-md"
              />
            </div>
            <button type="submit" className="px-5 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors shadow-md whitespace-nowrap text-sm">
              {t('খুঁজুন', 'Search')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
