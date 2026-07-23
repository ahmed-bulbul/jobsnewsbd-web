'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getMyBookListings, setBookListingSold, deleteMyBookListing, getBookListingOrders } from '@/lib/api';
import type { MyBookListing, BookListingStatus, BookCondition, BookOrderBuyerInfo } from '@/lib/types';

const STATUS_META: Record<BookListingStatus, { bn: string; en: string; bg: string; color: string }> = {
  PENDING:  { bn: 'অপেক্ষমাণ',  en: 'Pending',  bg: '#FFFBEB', color: '#B45309' },
  APPROVED: { bn: 'অনুমোদিত',  en: 'Approved', bg: '#ECFDF5', color: '#059669' },
  REJECTED: { bn: 'বাতিল',     en: 'Rejected', bg: '#FEF2F2', color: '#DC2626' },
};

const CONDITION_META: Record<BookCondition, { bn: string; en: string }> = {
  NEW:      { bn: 'নতুন',        en: 'New' },
  LIKE_NEW: { bn: 'প্রায় নতুন',  en: 'Like New' },
  GOOD:     { bn: 'ভালো',        en: 'Good' },
  FAIR:     { bn: 'মোটামুটি',    en: 'Fair' },
};

export default function MyBookListingsPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [listings, setListings] = useState<MyBookListing[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [ordersMap, setOrdersMap] = useState<Record<number, BookOrderBuyerInfo[]>>({});
  const [ordersLoading, setOrdersLoading] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const toggleOrders = async (listingId: number) => {
    if (expandedId === listingId) { setExpandedId(null); return; }
    setExpandedId(listingId);
    if (!ordersMap[listingId] && user?.token) {
      setOrdersLoading(true);
      try {
        const orders = await getBookListingOrders(user.token, listingId);
        setOrdersMap((prev) => ({ ...prev, [listingId]: orders }));
      } catch { /* ignore — section will just show empty */ }
      finally { setOrdersLoading(false); }
    }
  };

  const load = () => {
    if (!user?.token) { setLoading(false); return; }
    setLoading(true);
    getMyBookListings(user.token, page, 20)
      .then((res) => { setListings(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setListings([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const handleToggleSold = async (listing: MyBookListing) => {
    if (!user?.token) return;
    try {
      await setBookListingSold(user.token, listing.id, !listing.sold);
      flash(listing.sold ? 'বিক্রি হয়নি হিসেবে চিহ্নিত হয়েছে' : 'বিক্রি হয়েছে হিসেবে চিহ্নিত হয়েছে');
      load();
    } catch { flash('ব্যর্থ হয়েছে'); }
  };

  const handleDelete = async (id: number) => {
    if (!user?.token || !confirm('বিজ্ঞাপনটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    try {
      await deleteMyBookListing(user.token, id);
      flash('মুছে ফেলা হয়েছে');
      load();
    } catch { flash('ব্যর্থ হয়েছে'); }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/book-marketplace" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('পুরাতন বই কেনাবেচা', 'Book Marketplace')}
        </Link>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{t('আমার বিজ্ঞাপনসমূহ', 'My Listings')}</h1>
          {user && (
            <Link href="/study-corner/book-marketplace/submit" className="btn-primary text-sm px-3 py-2">
              + {t('নতুন বিজ্ঞাপন', 'New Listing')}
            </Link>
          )}
        </div>

        {msg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{msg}</div>
        )}

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
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('আপনি এখনো কোনো বই বিক্রির জন্য দেননি', "You haven't listed any books yet")}
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl border border-warm-border p-4 flex gap-3">
                <div className="w-16 h-20 bg-warm-bg rounded-lg overflow-hidden relative shrink-0">
                  {listing.photoUrl ? (
                    <Image src={listing.photoUrl} alt={listing.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: STATUS_META[listing.status].bg, color: STATUS_META[listing.status].color }}>
                      {t(STATUS_META[listing.status].bn, STATUS_META[listing.status].en)}
                    </span>
                  </div>
                  <p className="text-xs text-warm-muted">
                    ৳{listing.price} • {t(CONDITION_META[listing.condition].bn, CONDITION_META[listing.condition].en)}
                    {listing.sold && <> • <span className="font-semibold">{t('বিক্রি হয়ে গেছে', 'Sold')}</span></>}
                  </p>
                  {listing.status === 'REJECTED' && listing.adminNote && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1 mt-1">{t('কারণ', 'Reason')}: {listing.adminNote}</p>
                  )}
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {listing.status === 'APPROVED' && (
                      <button onClick={() => handleToggleSold(listing)} className="text-xs text-primary hover:underline font-semibold">
                        {listing.sold ? t('বিক্রি হয়নি চিহ্নিত করুন', 'Mark as available') : t('বিক্রি হয়েছে চিহ্নিত করুন', 'Mark as sold')}
                      </button>
                    )}
                    {listing.status === 'APPROVED' && (
                      <button onClick={() => toggleOrders(listing.id)} className="text-xs text-primary hover:underline font-semibold">
                        {expandedId === listing.id ? t('অনুরোধ লুকান', 'Hide requests') : t('ক্রয়ের অনুরোধ দেখুন', 'View buy requests')}
                      </button>
                    )}
                    <button onClick={() => handleDelete(listing.id)} className="text-xs text-red-500 hover:underline font-semibold">
                      {t('মুছুন', 'Delete')}
                    </button>
                  </div>

                  {expandedId === listing.id && (
                    <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
                      {ordersLoading && !ordersMap[listing.id] ? (
                        <p className="text-xs text-warm-muted">{t('লোড হচ্ছে...', 'Loading...')}</p>
                      ) : !ordersMap[listing.id] || ordersMap[listing.id].length === 0 ? (
                        <p className="text-xs text-warm-muted">{t('এখনো কেউ অর্ডার করেনি', 'No one has ordered yet')}</p>
                      ) : (
                        ordersMap[listing.id].map((o) => (
                          <div key={o.id} className="text-xs bg-white rounded-lg px-3 py-2 border border-warm-border">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900">{o.buyerName}</p>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{
                                background: o.status === 'CLOSED' ? '#ECFDF5' : '#FFFBEB',
                                color: o.status === 'CLOSED' ? '#059669' : '#B45309',
                              }}>
                                {o.status === 'CLOSED' ? t('বিক্রি সম্পন্ন', 'Sold') : t('সক্রিয়', 'Active')}
                              </span>
                            </div>
                            <p className="text-warm-muted">{o.buyerEmail}</p>
                            {o.buyerPhone && <p className="text-warm-muted">{o.buyerPhone}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}
