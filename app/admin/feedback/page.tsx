'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';
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
    <div className="min-h-screen bg-cream">
      <header className="bg-primary-900 text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-y-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold shrink-0">চ</div>
          <div>
            <span className="font-bold">Job Radar</span>
            <span className="text-primary-300 text-xs ml-2">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap w-full sm:w-auto">
          <span className="text-primary-300 text-sm">👤 {adminName}</span>
          <Link href="/admin/dashboard" className="text-xs text-primary-300 hover:text-white whitespace-nowrap">← ড্যাশবোর্ড</Link>
          <AdminNotificationBell token={token} />
          <button
            onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login'); }}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            লগআউট
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="font-bold text-gray-900 text-lg">ব্যবহারকারীর মতামত ({totalElements})</h1>
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
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: STATUS_META[f.status].bg, color: STATUS_META[f.status].color }}
                      >
                        {STATUS_META[f.status].label}
                      </span>
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
      </main>
    </div>
  );
}
