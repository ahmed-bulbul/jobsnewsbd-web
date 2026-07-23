'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getBookListings } from '@/lib/api';
import type { BookListing, BookCondition } from '@/lib/types';

const CONDITION_META: Record<BookCondition, { bn: string; en: string }> = {
  NEW:      { bn: 'নতুন',        en: 'New' },
  LIKE_NEW: { bn: 'প্রায় নতুন',  en: 'Like New' },
  GOOD:     { bn: 'ভালো',        en: 'Good' },
  FAIR:     { bn: 'মোটামুটি',    en: 'Fair' },
};

function ListingCard({ listing }: { listing: BookListing }) {
  const { t } = useLanguage();
  const cond = CONDITION_META[listing.condition];
  return (
    <Link
      href={`/study-corner/book-marketplace/${listing.id}`}
      className="group bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-md transition-all overflow-hidden flex flex-col relative"
    >
      {listing.sold && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-gray-900/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {t('বিক্রি হয়ে গেছে', 'Sold')}
          </span>
        </div>
      )}
      <div className="aspect-[4/3] bg-warm-bg flex items-center justify-center overflow-hidden relative">
        {listing.photoUrl ? (
          <Image src={listing.photoUrl} alt={listing.title} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-4xl select-none">📚</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-sm leading-snug text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
          {listing.title}
        </h3>
        {listing.author && <p className="text-xs text-warm-muted line-clamp-1">{listing.author}</p>}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-sm font-bold text-primary">৳{listing.price}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {t(cond.bn, cond.en)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BookMarketplaceListPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [listings, setListings] = useState<BookListing[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBookListings({ q: q || undefined, page, size: 20 })
      .then((res) => { setListings(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setListings([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [q, page]);

  const handleSellClick = () => {
    if (!user) { openModal('login'); return; }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/study-corner" className="hover:text-primary transition-colors">{t('স্টাডি কর্নার', 'Study Corner')}</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">{t('পুরাতন বই কেনাবেচা', 'Book Marketplace')}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('পুরাতন বই কেনাবেচা', 'Book Marketplace')}</h1>
            <p className="mt-1 text-sm text-warm-muted">
              {t('পুরাতন প্রস্তুতির বই কিনুন বা বিক্রি করুন', 'Buy or sell used preparation books')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <Link href="/study-corner/book-marketplace/mine" className="btn-outline text-xs sm:text-sm px-3 py-2">
                {t('আমার বিজ্ঞাপন', 'My Listings')}
              </Link>
            )}
            {user && (
              <Link href="/study-corner/book-marketplace/orders" className="btn-outline text-xs sm:text-sm px-3 py-2">
                {t('আমার অর্ডার', 'My Orders')}
              </Link>
            )}
            {user ? (
              <Link href="/study-corner/book-marketplace/submit" className="btn-primary text-xs sm:text-sm px-3 py-2">
                + {t('বিক্রি করুন', 'Sell a Book')}
              </Link>
            ) : (
              <button onClick={handleSellClick} className="btn-primary text-xs sm:text-sm px-3 py-2">
                + {t('বিক্রি করুন', 'Sell a Book')}
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
            placeholder={t('বইয়ের নাম বা লেখক দিয়ে খুঁজুন', 'Search by book title or author')}
            className="input text-sm w-full"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[4/3] bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('কোনো বিজ্ঞাপন পাওয়া যায়নি', 'No listings found')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}
