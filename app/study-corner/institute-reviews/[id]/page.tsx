'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getInstituteReview } from '@/lib/api';
import type { InstituteReview } from '@/lib/types';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500 text-lg tracking-tight shrink-0" aria-label={`${rating}/5`}>
      {'★'.repeat(rating)}
      <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function InstituteReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, lang } = useLanguage();
  const [review, setReview] = useState<InstituteReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getInstituteReview(Number(id))
      .then(setReview)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/institute-reviews" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('ইনস্টিটিউট রিভিউ', 'Institute Reviews')}
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-40 bg-white rounded-2xl border border-warm-border" />
          </div>
        ) : error || !review ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('রিভিউটি পাওয়া যায়নি', 'Review not found')}
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{review.title}</h1>
              <Stars rating={review.rating} />
            </div>

            <p className="text-sm text-warm-muted">{review.instituteName}</p>

            <div className="flex items-center gap-3 text-xs text-warm-muted flex-wrap pb-4 border-b border-warm-border">
              <span>{review.isAnonymous ? t('বেনামী', 'Anonymous') : review.authorName}</span>
              <span>•</span>
              <span>{new Date(review.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>•</span>
              <span>👁 {review.viewCount} {t('দেখেছেন', 'views')}</span>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review.body}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
