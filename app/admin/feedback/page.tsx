'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Badge from '@/components/admin/Badge';
import { adminGetFeedback, adminMarkFeedbackRead } from '@/lib/api';
import type { AdminFeedback, FeedbackStatus } from '@/lib/types';

const STATUS_META: Record<FeedbackStatus, { label: string; bg: string; color: string }> = {
  NEW:  { label: 'নতুন',   bg: '#FFFBEB', color: '#B45309' },
  READ: { label: 'দেখা হয়েছে', bg: '#ECFDF5', color: '#059669' },
};

function stars(rating: number | null): string {
  if (!rating) return '';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'ALL' | FeedbackStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async (t: string, f: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminGetFeedback(t, f === 'ALL' ? undefined : f, p, 20);
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

  const handleMarkRead = async (item: AdminFeedback) => {
    setActingId(item.id);
    try {
      await adminMarkFeedbackRead(token, item.id);
      load(token, filter, page);
    } catch { /* ignore */ } finally { setActingId(null); }
  };

  return (
    <AdminShell title="মতামত" subtitle="ব্যবহারকারীর মতামত পর্যালোচনা" adminName={adminName} token={token}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader title={`ব্যবহারকারীর মতামত (${totalElements})`} />

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-end flex-wrap gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              {(['ALL', 'NEW', 'READ'] as const).map((f) => (
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
            <p className="text-sm text-warm-muted py-4 text-center">কোনো মতামত নেই</p>
          ) : (
            <div className="space-y-3">
              {items.map((f) => (
                <div key={f.id} className="border border-warm-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{f.submitterName}</p>
                      {f.submitterEmail && <p className="text-xs text-warm-muted">{f.submitterEmail}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {f.rating && <span className="text-sm text-yellow-500">{stars(f.rating)}</span>}
                      <Badge tone={f.status === 'READ' ? 'success' : 'warning'}>{STATUS_META[f.status].label}</Badge>
                      <span className="text-xs text-warm-muted">{new Date(f.createdAt).toLocaleString('bn-BD')}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.message}</p>

                  {f.pageUrl && <p className="text-[11px] text-warm-muted">পাতা: {f.pageUrl}</p>}

                  {f.status === 'NEW' && (
                    <button
                      onClick={() => handleMarkRead(f)}
                      disabled={actingId === f.id}
                      className="text-xs font-semibold bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
                    >
                      {actingId === f.id ? '...' : 'দেখা হয়েছে হিসেবে চিহ্নিত করুন'}
                    </button>
                  )}
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
