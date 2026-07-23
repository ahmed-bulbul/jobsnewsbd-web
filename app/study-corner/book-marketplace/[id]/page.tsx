'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getBookListing, placeBookOrder } from '@/lib/api';
import type { BookListingDetail, BookCondition } from '@/lib/types';

const CONDITION_META: Record<BookCondition, { bn: string; en: string }> = {
  NEW:      { bn: 'নতুন',        en: 'New' },
  LIKE_NEW: { bn: 'প্রায় নতুন',  en: 'Like New' },
  GOOD:     { bn: 'ভালো',        en: 'Good' },
  FAIR:     { bn: 'মোটামুটি',    en: 'Fair' },
};

export default function BookListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [listing, setListing] = useState<BookListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderMsg, setOrderMsg] = useState('');

  const load = () => {
    getBookListing(Number(id), user?.token)
      .then(setListing)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.token]);

  const handleOrder = async () => {
    if (!user?.token) return;
    setOrdering(true);
    setOrderMsg('');
    try {
      await placeBookOrder(user.token, Number(id));
      setOrderMsg(t('অর্ডার করা হয়েছে! বিক্রেতা আপনার তথ্য পেয়ে যোগাযোগ করবেন।', 'Order placed! The seller has been notified with your contact info.'));
      load();
    } catch (e) {
      setOrderMsg(e instanceof Error ? e.message : t('অর্ডার ব্যর্থ হয়েছে', 'Order failed'));
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/book-marketplace" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('পুরাতন বই কেনাবেচা', 'Book Marketplace')}
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-8 bg-gray-200 rounded w-2/3" />
          </div>
        ) : error || !listing ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('বিজ্ঞাপনটি পাওয়া যায়নি', 'Listing not found')}
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <div className="aspect-[4/3] bg-warm-bg rounded-xl overflow-hidden relative">
              {listing.photoUrl ? (
                <Image src={listing.photoUrl} alt={listing.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
              )}
              {listing.sold && (
                <div className="absolute top-3 right-3">
                  <span className="bg-gray-900/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t('বিক্রি হয়ে গেছে', 'Sold')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{listing.title}</h1>
              <span className="text-lg font-bold text-primary shrink-0">৳{listing.price}</span>
            </div>

            {listing.author && <p className="text-sm text-warm-muted">{listing.author}</p>}

            <span className="inline-block w-fit text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {t(CONDITION_META[listing.condition].bn, CONDITION_META[listing.condition].en)}
            </span>

            {listing.description && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pt-2 border-t border-warm-border">{listing.description}</p>
            )}

            {/* Seller contact */}
            <div className="pt-4 border-t border-warm-border">
              <h2 className="text-sm font-bold text-gray-900 mb-2">{t('বিক্রেতার তথ্য', 'Seller Info')}</h2>
              {!user ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  {t('বইটি কিনতে চাইলে লগইন করে অর্ডার করুন।', 'Login and place an order to see the seller\'s contact information.')}
                  <button onClick={() => openModal('login')} className="ml-2 font-semibold underline">
                    {t('লগইন করুন', 'Login')}
                  </button>
                </div>
              ) : listing.sellerEmail ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm space-y-1">
                    <p><span className="text-warm-muted">{t('নাম', 'Name')}:</span> {listing.sellerName}</p>
                    <p><span className="text-warm-muted">{t('ইমেইল', 'Email')}:</span> {listing.sellerEmail}</p>
                    {listing.sellerPhone && <p><span className="text-warm-muted">{t('ফোন', 'Phone')}:</span> {listing.sellerPhone}</p>}
                  </div>
                  <p className="text-xs text-warm-muted">
                    {t('আপনি এই বইয়ের জন্য অর্ডার করেছেন।', 'You\'ve placed an order on this listing.')}{' '}
                    <Link href="/study-corner/book-marketplace/orders" className="text-primary font-semibold hover:underline">
                      {t('আমার অর্ডারসমূহ দেখুন', 'View my orders')}
                    </Link>
                  </p>
                </div>
              ) : listing.sold ? (
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-warm-muted">
                  {t('বইটি ইতিমধ্যে বিক্রি হয়ে গেছে।', 'This book has already been sold.')}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-warm-muted">
                    {t('বইটি কিনতে চাইলে অর্ডার করুন — বিক্রেতা আপনার তথ্য পেয়ে যোগাযোগ করবেন এবং তারপর আপনি বিক্রেতার তথ্য দেখতে পাবেন।', 'Place an order to buy this book — the seller will get your contact info, and you\'ll then see theirs.')}
                  </p>
                  <button onClick={handleOrder} disabled={ordering} className="btn-primary text-sm px-4 py-2 disabled:opacity-60">
                    {ordering ? t('অর্ডার হচ্ছে...', 'Placing order...') : t('অর্ডার করুন', 'Place Order')}
                  </button>
                  {orderMsg && <p className="text-xs text-primary">{orderMsg}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
