'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { adminCreateNotice, adminGetNotices } from '@/lib/api';
import type { Notice } from '@/lib/types';

export default function AdminNoticesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [items, setItems] = useState<Notice[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (t: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminGetNotices(t, p, 20);
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
    load(t, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handlePageChange = (p: number) => {
    setPage(p);
    load(token, p);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    setSentInfo(null);
    try {
      const notice = await adminCreateNotice(token, title.trim(), body.trim());
      setSentInfo(`পাঠানো হয়েছে — ${notice.recipientCount} জন ব্যবহারকারীকে`);
      setTitle('');
      setBody('');
      setPage(0);
      load(token, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'পাঠাতে ব্যর্থ হয়েছে');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminShell title="নোটিশ" subtitle="সব ব্যবহারকারীকে push notification পাঠান" adminName={adminName} token={token}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <PageHeader title="নোটিশ" />

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">নতুন নোটিশ পাঠান</h1>
            <p className="text-xs text-warm-muted mt-0.5">
              সব ব্যবহারকারীকে push notification হিসেবে পাঠানো হবে — যারা Announcements বন্ধ রেখেছেন বা যাদের কোনো ডিভাইস রেজিস্টার্ড নেই, তারা বাদে।
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">শিরোনাম</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
                className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="যেমন: সার্ভার মেইনটেন্যান্স"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">বিস্তারিত</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={4}
                className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="নোটিশের বিস্তারিত লিখুন..."
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}
            {sentInfo && <p className="text-xs text-green-700">{sentInfo}</p>}

            <button
              type="submit"
              disabled={sending || !title.trim() || !body.trim()}
              className="btn-primary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'পাঠানো হচ্ছে...' : 'সবাইকে পাঠান'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">পাঠানো নোটিশ ({totalElements})</h2>

          {loading ? (
            <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-warm-muted py-4 text-center">এখনো কোনো নোটিশ পাঠানো হয়নি</p>
          ) : (
            <div className="divide-y divide-warm-border">
              {items.map((n) => (
                <div key={n.id} className="py-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{n.title}</h3>
                    <span className="text-xs text-warm-muted whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-warm-muted">
                    <span>👤 {n.createdByEmail}</span>
                    <span className="font-semibold text-primary">📤 {n.recipientCount} জন প্রাপক</span>
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
