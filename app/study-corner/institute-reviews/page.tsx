'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getInstituteReviews } from '@/lib/api';
import type { InstituteReview } from '@/lib/types';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500 text-sm tracking-tight" aria-label={`${rating}/5`}>
      {'★'.repeat(rating)}
      <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewCard({ r }: { r: InstituteReview }) {
  const { t, lang } = useLanguage();
  return (
    <Link
      href={`/study-corner/institute-reviews/${r.id}`}
      className="block bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-md transition-all p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-gray-900 leading-snug">{r.title}</h3>
        <Stars rating={r.rating} />
      </div>
      <p className="text-sm text-warm-muted mb-2">{r.instituteName}</p>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{r.body}</p>
      <div className="flex items-center justify-between text-xs text-warm-muted flex-wrap gap-2">
        <span>{r.isAnonymous ? t('বেনামী', 'Anonymous') : r.authorName}</span>
        <span className="flex items-center gap-3">
          <span>👁 {r.viewCount}</span>
          <span>{new Date(r.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </span>
      </div>
    </Link>
  );
}

export default function InstituteReviewsListPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [reviews, setReviews] = useState<InstituteReview[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getInstituteReviews({ q: q || undefined, page, size: 10 })
      .then((res) => { setReviews(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setReviews([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [q, page]);

  const handleWriteClick = () => {
    if (!user) { openModal('login'); return; }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/study-corner" className="hover:text-primary transition-colors">{t('স্টাডি কর্নার', 'Study Corner')}</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">{t('ইনস্টিটিউট রিভিউ', 'Institute Reviews')}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('ইনস্টিটিউট রিভিউ', 'Institute Reviews')}</h1>
            <p className="mt-1 text-sm text-warm-muted">
              {t('কোচিং সেন্টার ও ইনস্টিটিউট সম্পর্কে অন্যদের রিভিউ পড়ুন ও নিজের অভিজ্ঞতা লিখুন', "Read others' reviews of coaching centers and institutes, and write your own")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <Link href="/study-corner/institute-reviews/mine" className="btn-outline text-xs sm:text-sm px-3 py-2">
                {t('আমার রিভিউ', 'My Reviews')}
              </Link>
            )}
            {user ? (
              <Link href="/study-corner/institute-reviews/submit" className="btn-primary text-xs sm:text-sm px-3 py-2">
                + {t('রিভিউ লিখুন', 'Write a Review')}
              </Link>
            ) : (
              <button onClick={handleWriteClick} className="btn-primary text-xs sm:text-sm px-3 py-2">
                + {t('রিভিউ লিখুন', 'Write a Review')}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder={t('ইনস্টিটিউটের নাম বা শিরোনাম দিয়ে খুঁজুন', 'Search by institute name or title')}
            className="input text-sm w-full"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('কোনো রিভিউ পাওয়া যায়নি', 'No reviews found')}
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}
