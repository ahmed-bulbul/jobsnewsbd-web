'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getPrepCategory } from '@/lib/api';
import type { PrepCategoryDetail } from '@/lib/types';

function TopicCard({ topic, color }: { topic: PrepCategoryDetail['topics'][0]; color: string }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/prep/topics/${topic.slug}`}
      className="group bg-white rounded-xl border border-warm-border hover:border-primary hover:shadow-md transition-all p-4 flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}22` }}
      >
        <span className="font-bold text-sm" style={{ color }}>{topic.displayOrder}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm leading-snug truncate">
          {topic.nameBn}
        </p>
        {topic.nameEn && (
          <p className="text-xs text-warm-muted truncate">{topic.nameEn}</p>
        )}
      </div>
      <svg className="w-4 h-4 text-warm-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function PrepCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const [data, setData] = useState<PrepCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPrepCategory(slug)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const color = data?.colorHex ?? '#1D4ED8';

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
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-warm-border" />
              ))}
            </div>
          </div>
        ) : error || !data ? (
          <div className="text-center py-20 text-warm-muted">
            {t('ক্যাটাগরি পাওয়া যায়নি', 'Category not found')}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: `${color}22`, color }}
              >
                {t('চাকরির প্রস্তুতি', 'Job Preparation')}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{data.nameBn}</h1>
              {data.nameEn && <p className="text-warm-muted text-sm mt-1">{data.nameEn}</p>}
              <p className="text-sm text-warm-muted mt-2">
                {data.topics.length} {t('টি বিষয়', 'topics')}
              </p>
            </div>

            <div className="space-y-2">
              {data.topics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} color={color} />
              ))}

              {data.topics.length === 0 && (
                <div className="text-center py-12 text-warm-muted text-sm">
                  {t('এখনো কোনো বিষয় যোগ করা হয়নি', 'No topics added yet')}
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
