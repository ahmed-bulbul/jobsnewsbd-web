'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Badge from '@/components/admin/Badge';
import { adminGetBookOrders } from '@/lib/api';
import type { AdminBookOrder, BookOrderStatus } from '@/lib/types';

const STATUS_META: Record<BookOrderStatus, { label: string; bg: string; color: string }> = {
  PENDING:   { label: 'সক্রিয়',        bg: '#FFFBEB', color: '#B45309' },
  CLOSED:    { label: 'বিক্রি সম্পন্ন', bg: '#ECFDF5', color: '#059669' },
  CANCELLED: { label: 'বাতিল',          bg: '#FEF2F2', color: '#DC2626' },
};

export default function AdminBookOrdersPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [items, setItems] = useState<AdminBookOrder[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'ALL' | BookOrderStatus>('ALL');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (t: string, f: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminGetBookOrders(t, f === 'ALL' ? undefined : f, p, 20);
      setItems(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    const n = localStorage.getItem('admin_name');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    setAdminName(n ?? 'Admin');
    load(t, filter, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    setPage(0);
    load(token, f, 0);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    load(token, filter, p);
  };

  return (
    <AdminShell title="বই অর্ডার" subtitle="বই কেনাবেচার অর্ডার তালিকা" adminName={adminName} token={token}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title={`বই কেনাবেচার অর্ডার (${totalElements})`}
          actions={<Link href="/admin/book-listings" className="btn-outline text-xs">বই বিজ্ঞাপন মডারেশন →</Link>}
        />

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-end flex-wrap gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              {(['ALL', 'PENDING', 'CLOSED', 'CANCELLED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {f === 'ALL' ? 'সব' : STATUS_META[f].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-warm-muted py-4 text-center">কোনো অর্ডার নেই</p>
          ) : (
            <div className="space-y-3">
              {items.map((o) => (
                <div key={o.id} className="border border-warm-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{o.listingTitle}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={o.status === 'CLOSED' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'warning'}>
                        {STATUS_META[o.status].label}
                      </Badge>
                      <span className="text-xs text-warm-muted">{new Date(o.createdAt).toLocaleString('bn-BD')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-warm-muted">৳{o.listingPrice}{o.listingSold && <> • বিক্রি হয়ে গেছে</>}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-warm-border">
                    <div className="bg-green-50 rounded-lg px-3 py-2">
                      <p className="text-[11px] font-bold text-green-700 mb-1">ক্রেতা</p>
                      <p className="text-xs text-gray-700">{o.buyerName}</p>
                      <p className="text-xs text-gray-500">{o.buyerEmail}</p>
                      {o.buyerPhone && <p className="text-xs text-gray-500">{o.buyerPhone}</p>}
                      {o.deliveryAddress && <p className="text-xs text-gray-500">ঠিকানা: {o.deliveryAddress}</p>}
                    </div>
                    <div className="bg-amber-50 rounded-lg px-3 py-2">
                      <p className="text-[11px] font-bold text-amber-700 mb-1">বিক্রেতা</p>
                      <p className="text-xs text-gray-700">{o.sellerName}</p>
                      <p className="text-xs text-gray-500">{o.sellerEmail}</p>
                      {o.sellerPhone && <p className="text-xs text-gray-500">{o.sellerPhone}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>
    </AdminShell>
  );
}
