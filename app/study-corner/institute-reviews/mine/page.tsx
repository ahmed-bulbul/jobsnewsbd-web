'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getMyInstituteReviews } from '@/lib/api';
import type { MyInstituteReview, InstituteReviewStatus } from '@/lib/types';

const STATUS_META: Record<InstituteReviewStatus, { bn: string; en: string; bg: string; color: string }> = {
  PENDING:  { bn: 'অপেক্ষমাণ',  en: 'Pending',  bg: '#FFFBEB', color: '#B45309' },
  APPROVED: { bn: 'অনুমোদিত',  en: 'Approved', bg: '#ECFDF5', color: '#059669' },
  REJECTED: { bn: 'বাতিল',     en: 'Rejected', bg: '#FEF2F2', color: '#DC2626' },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500 text-sm tracking-tight" aria-label={`${rating}/5`}>
      {'★'.repeat(rating)}
      <span className="text-gray-300">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

function MyReviewCard({ r }: { r: MyInstituteReview }) {
  const { t, lang } = useLanguage();
  const meta = STATUS_META[r.status];
  return (
    <div className="bg-white rounded-2xl border border-warm-border p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-gray-900 leading-snug">{r.title}</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: meta.bg, color: meta.color }}>
          {t(meta.bn, meta.en)}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-warm-muted">{r.instituteName}</p>
        <Stars rating={r.rating} />
      </div>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{r.body}</p>
      {r.status === 'REJECTED' && r.adminNote && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">{t('কারণ', 'Reason')}: {r.adminNote}</p>
      )}
      <p className="text-xs text-warm-muted">
        {new Date(r.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        {r.status === 'APPROVED' && <> • 👁 {r.viewCount}</>}
      </p>
    </div>
  );
}

export default function MyInstituteReviewsPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [reviews, setReviews] = useState<MyInstituteReview[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) { setLoading(false); return; }
    setLoading(true);
    getMyInstituteReviews(user.token, page, 20)
      .then((res) => { setReviews(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setReviews([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [user, page]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/institute-reviews" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('ইনস্টিটিউট রিভিউ', 'Institute Reviews')}
        </Link>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{t('আমার রিভিউসমূহ', 'My Reviews')}</h1>
          {user && (
            <Link href="/study-corner/institute-reviews/submit" className="btn-primary text-sm px-3 py-2">
              + {t('নতুন রিভিউ', 'New Review')}
            </Link>
          )}
        </div>

        {!user ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t('লগইন প্রয়োজন', 'Login Required')}</h2>
            <button onClick={() => openModal('login')} className="btn-primary px-8 py-2.5 mt-2">
              {t('লগইন করুন', 'Login')}
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('আপনি এখনো কোনো রিভিউ লেখেননি', "You haven't written any reviews yet")}
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => <MyReviewCard key={r.id} r={r} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}
