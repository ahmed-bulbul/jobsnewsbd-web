'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';
import { adminGetGoogleSignInLogs } from '@/lib/api';
import type { GoogleSignInLog } from '@/lib/types';

const STAGE_LABEL: Record<string, string> = {
  initialize: 'Initialize',
  authenticate: 'Authenticate',
  token_null: 'Token Null',
  backend_exchange: 'Backend Exchange',
};

export default function AdminGoogleSignInLogsPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [items, setItems] = useState<GoogleSignInLog[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async (t: string, f: typeof filter, p: number) => {
    setLoading(true);
    try {
      const success = f === 'ALL' ? undefined : f === 'SUCCESS';
      const res = await adminGetGoogleSignInLogs(t, success, p, 50);
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Google Sign-In লগ ({totalElements})</h1>
              <p className="text-xs text-warm-muted mt-0.5">
                মোবাইল অ্যাপে Google সাইন-ইনের প্রতিটি ধাপ (initialize, authenticate, token check, backend exchange) এখানে রেকর্ড হয়।
              </p>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              {(['ALL', 'FAILED', 'SUCCESS'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {f === 'ALL' ? 'সব' : f === 'SUCCESS' ? 'সফল' : 'ব্যর্থ'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-warm-muted py-4 text-center">কোনো লগ পাওয়া যায়নি</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-warm-muted border-b border-warm-border">
                    <th className="py-2 pr-3 font-semibold">সময়</th>
                    <th className="py-2 pr-3 font-semibold">স্ট্যাটাস</th>
                    <th className="py-2 pr-3 font-semibold">ধাপ</th>
                    <th className="py-2 pr-3 font-semibold">ইমেইল</th>
                    <th className="py-2 pr-3 font-semibold">অ্যাপ ভার্সন</th>
                    <th className="py-2 pr-3 font-semibold">OS</th>
                    <th className="py-2 pr-3 font-semibold">প্ল্যাটফর্ম</th>
                    <th className="py-2 pr-3 font-semibold">এরর</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border">
                  {items.map((log) => {
                    const expanded = expandedId === log.id;
                    const err = log.errorMessage ?? '';
                    const errShort = err.length > 60 ? `${err.slice(0, 60)}…` : err;
                    return (
                      <tr key={log.id}>
                        <td className="py-2.5 pr-3 text-xs text-warm-muted whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('bn-BD')}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {log.success ? 'সফল' : 'ব্যর্থ'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">
                            {STAGE_LABEL[log.stage] ?? log.stage}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">{log.email ?? '—'}</td>
                        <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">{log.appVersion ?? '—'}</td>
                        <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">{log.osVersion ?? '—'}</td>
                        <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">{log.platform ?? '—'}</td>
                        <td className="py-2.5 pr-3 max-w-xs">
                          {log.errorMessage ? (
                            <button
                              onClick={() => setExpandedId(expanded ? null : log.id)}
                              className="text-left text-red-600 hover:underline"
                              title="বিস্তারিত দেখতে ক্লিক করুন"
                            >
                              {expanded ? err : errShort}
                            </button>
                          ) : (
                            <span className="text-warm-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </main>
    </div>
  );
}
