'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getRecommendedBook } from '@/lib/api';
import type { RecommendedBook } from '@/lib/types';

export default function RecommendedBookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [book, setBook] = useState<RecommendedBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getRecommendedBook(Number(id))
      .then(setBook)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/recommended-books" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('প্রস্তাবিত বই', 'Recommended Books')}
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-64 bg-gray-200 rounded-2xl w-48 mx-auto" />
            <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto" />
          </div>
        ) : error || !book ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('বইটি পাওয়া যায়নি', 'Book not found')}
          </div>
        ) : (
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-40 aspect-[3/4] bg-warm-bg rounded-xl overflow-hidden relative mx-auto sm:mx-0 shrink-0">
                {book.coverImageUrl ? (
                  <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">📖</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-snug mb-1">{book.title}</h1>
                {book.author && <p className="text-sm text-warm-muted mb-2">{book.author}</p>}
                {book.category && (
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">
                    {book.category}
                  </span>
                )}
                {book.description && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{book.description}</p>
                )}
                {book.purchaseLink && (
                  <a
                    href={book.purchaseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex px-5 py-2.5 text-sm"
                  >
                    {t('কিনুন', 'Buy Now')} →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
