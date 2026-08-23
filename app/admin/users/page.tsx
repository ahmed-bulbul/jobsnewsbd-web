'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';
import { adminGetUsers, adminGetUserStats, adminToggleUserActive } from '@/lib/api';
import type { AdminUser, AdminUserStats } from '@/lib/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [role, setRole] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const fmt = (n: number) => n.toLocaleString('bn-BD');

  const load = useCallback(async (t: string, query: string, r: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminGetUsers(t, query || undefined, r === 'ALL' ? undefined : r, p, 20);
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
    adminGetUserStats(t).then(setStats).catch(() => {});
    load(t, '', 'ALL', 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(qInput);
    setPage(0);
    load(token, qInput, role, 0);
  };

  const handleRoleChange = (r: typeof role) => {
    setRole(r);
    setPage(0);
    load(token, q, r, 0);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    load(token, q, role, p);
  };

  const handleToggleActive = async (u: AdminUser) => {
    setActingId(u.id);
    try {
      const updated = await adminToggleUserActive(token, u.id);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'মোট ব্যবহারকারী', value: stats?.total ?? 0, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            { label: 'আজ রেজিস্টার্ড', value: stats?.today ?? 0, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'এই সপ্তাহে', value: stats?.thisWeek ?? 0, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
            { label: 'এই মাসে', value: stats?.thisMonth ?? 0, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
          ].map((s) => (
            <div key={s.label} className={`card p-5 border ${s.bg}`}>
              <p className="text-xs text-warm-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{fmt(s.value)}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="font-bold text-gray-900 text-lg">ব্যবহারকারী তালিকা ({fmt(totalElements)})</h1>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              {(['ALL', 'USER', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${role === r ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {r === 'ALL' ? 'সব' : r === 'ADMIN' ? 'অ্যাডমিন' : 'ইউজার'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
              className="flex-1 border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors">
              খুঁজুন
            </button>
          </form>

          {loading ? (
            <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-warm-muted py-4 text-center">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-warm-muted border-b border-warm-border">
                    <th className="py-2 pr-3 font-semibold">নাম</th>
                    <th className="py-2 pr-3 font-semibold">ইমেইল / ফোন</th>
                    <th className="py-2 pr-3 font-semibold">রোল</th>
                    <th className="py-2 pr-3 font-semibold">স্ট্যাটাস</th>
                    <th className="py-2 pr-3 font-semibold">যোগদান</th>
                    <th className="py-2 pr-3 font-semibold text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border">
                  {items.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          {u.profilePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.profilePhotoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {(u.name || u.email)[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{u.name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-600">
                        <p>{u.email}</p>
                        {u.phone && <p className="text-xs text-warm-muted">{u.phone}</p>}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'ADMIN' ? 'অ্যাডমিন' : 'ইউজার'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {u.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-warm-muted whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={actingId === u.id}
                            className={`text-xs font-semibold rounded-lg px-2.5 py-1 disabled:opacity-50 ${u.active ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
                          >
                            {actingId === u.id ? '...' : u.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
