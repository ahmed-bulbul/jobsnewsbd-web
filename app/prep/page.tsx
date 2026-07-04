'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getPrepCategories } from '@/lib/api';
import type { PrepCategory } from '@/lib/types';

const FALLBACK_COLORS: Record<string, string> = {
  bcs:         '#1D4ED8',
  govt:        '#0F766E',
  bank:        '#7C3AED',
  it:          '#B45309',
  'teacher-reg': '#BE185D',
};

function CategoryCard({ cat }: { cat: PrepCategory }) {
  const { t } = useLanguage();
  const color = cat.colorHex ?? FALLBACK_COLORS[cat.slug] ?? '#374151';

  return (
    <Link
      href={`/prep/${cat.slug}`}
      className="group bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-lg transition-all overflow-hidden flex flex-col"
    >
      <div
        className="h-24 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)` }}
      >
        <span
          className="text-4xl font-black select-none"
          style={{ color }}
        >
          {cat.nameBn.charAt(0)}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors leading-snug">
          {cat.nameBn}
        </h3>
        {cat.nameEn && (
          <p className="text-xs text-warm-muted">{cat.nameEn}</p>
        )}
        <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-medium" style={{ color }}>
          {t('বিষয় দেখুন', 'View topics')}
          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-border overflow-hidden animate-pulse">
      <div className="h-24 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function PrepPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<PrepCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPrepCategories()
      .then(setCategories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('চাকরির প্রস্তুতি', 'Job Preparation')}
          </h1>
          <p className="text-warm-muted mt-1 text-sm">
            {t('ক্যাটাগরি বেছে নিন এবং প্রস্তুতি শুরু করুন', 'Choose a category and start preparing')}
          </p>
        </div>

        {error ? (
          <div className="text-center py-20 text-warm-muted">
            {t('লোড করতে ব্যর্থ হয়েছে', 'Failed to load')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
              : categories.map((cat) => <CategoryCard key={cat.id} cat={cat} />)
            }
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
