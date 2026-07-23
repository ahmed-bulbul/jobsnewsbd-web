'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getMyBookOrders, cancelBookOrder } from '@/lib/api';
import type { BookOrder, BookOrderStatus } from '@/lib/types';

const STATUS_META: Record<BookOrderStatus, { bn: string; en: string; bg: string; color: string }> = {
  PENDING:   { bn: 'সক্রিয়',   en: 'Active',    bg: '#ECFDF5', color: '#059669' },
  CANCELLED: { bn: 'বাতিল',    en: 'Cancelled', bg: '#FEF2F2', color: '#DC2626' },
  CLOSED:    { bn: 'বন্ধ',     en: 'Closed',    bg: '#F3F4F6', color: '#6B7280' },
};

export default function MyBookOrdersPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = () => {
    if (!user?.token) { setLoading(false); return; }
    setLoading(true);
    getMyBookOrders(user.token, page, 20)
      .then((res) => { setOrders(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setOrders([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const handleCancel = async (id: number) => {
    if (!user?.token || !confirm('অর্ডারটি বাতিল করবেন?')) return;
    try {
      await cancelBookOrder(user.token, id);
      flash('অর্ডার বাতিল করা হয়েছে');
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

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('আমার অর্ডারসমূহ', 'My Orders')}</h1>

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
            {[1, 2].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('আপনি এখনো কোনো বই অর্ডার করেননি', "You haven't ordered any books yet")}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-warm-border p-4 flex gap-3">
                <Link href={`/study-corner/book-marketplace/${order.listingId}`} className="w-16 h-20 bg-warm-bg rounded-lg overflow-hidden relative shrink-0">
                  {order.listingPhotoUrl ? (
                    <Image src={order.listingPhotoUrl} alt={order.listingTitle} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📚</div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/study-corner/book-marketplace/${order.listingId}`} className="text-sm font-semibold text-gray-900 truncate hover:text-primary">
                      {order.listingTitle}
                    </Link>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: STATUS_META[order.status].bg, color: STATUS_META[order.status].color }}>
                      {t(STATUS_META[order.status].bn, STATUS_META[order.status].en)}
                    </span>
                  </div>
                  <p className="text-xs text-warm-muted">
                    ৳{order.listingPrice}
                    {order.listingSold && <> • <span className="font-semibold">{t('বিক্রি হয়ে গেছে', 'Sold')}</span></>}
                  </p>
                  {order.status === 'PENDING' && (
                    <button onClick={() => handleCancel(order.id)} className="text-xs text-red-500 hover:underline font-semibold mt-2">
                      {t('অর্ডার বাতিল করুন', 'Cancel order')}
                    </button>
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
