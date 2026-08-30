'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import Table, { type TableColumn } from '@/components/admin/Table';
import Badge from '@/components/admin/Badge';
import { UsersIcon } from '@/components/admin/icons';
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

  const columns: TableColumn<AdminUser>[] = [
    {
      key: 'name',
      header: 'নাম',
      render: (u) => (
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
      ),
    },
    {
      key: 'contact',
      header: 'ইমেইল / ফোন',
      render: (u) => (
        <>
          <p className="text-gray-600">{u.email}</p>
          {u.phone && <p className="text-xs text-warm-muted">{u.phone}</p>}
        </>
      ),
    },
    {
      key: 'role',
      header: 'রোল',
      render: (u) => <Badge tone={u.role === 'ADMIN' ? 'violet' : 'neutral'}>{u.role === 'ADMIN' ? 'অ্যাডমিন' : 'ইউজার'}</Badge>,
    },
    {
      key: 'status',
      header: 'স্ট্যাটাস',
      render: (u) => <Badge tone={u.active ? 'success' : 'danger'}>{u.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge>,
    },
    {
      key: 'joined',
      header: 'যোগদান',
      render: (u) => (
        <span className="text-xs text-warm-muted whitespace-nowrap">
          {new Date(u.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'অ্যাকশন',
      align: 'right',
      render: (u) =>
        u.role !== 'ADMIN' ? (
          <button
            onClick={() => handleToggleActive(u)}
            disabled={actingId === u.id}
            className={`text-xs font-semibold rounded-lg px-2.5 py-1 disabled:opacity-50 ${u.active ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {actingId === u.id ? '...' : u.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
          </button>
        ) : null,
    },
  ];

  return (
    <AdminShell title="ব্যবহারকারী" subtitle="সব নিবন্ধিত ব্যবহারকারীর তালিকা ও স্ট্যাটাস" adminName={adminName} token={token}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="মোট ব্যবহারকারী" value={stats?.total ?? 0} color="blue" icon={UsersIcon} />
          <StatCard label="আজ রেজিস্টার্ড" value={stats?.today ?? 0} color="emerald" icon={UsersIcon} />
          <StatCard label="এই সপ্তাহে" value={stats?.thisWeek ?? 0} color="amber" icon={UsersIcon} />
          <StatCard label="এই মাসে" value={stats?.thisMonth ?? 0} color="violet" icon={UsersIcon} />
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PageHeader title={`ব্যবহারকারী তালিকা (${fmt(totalElements)})`} />
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap -mt-6">
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
              className="input flex-1"
            />
            <button type="submit" className="btn-primary shrink-0">খুঁজুন</button>
          </form>

          {loading ? (
            <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
          ) : (
            <Table columns={columns} data={items} rowKey={(u) => u.id} emptyMessage="কোনো ব্যবহারকারী পাওয়া যায়নি" />
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>
    </AdminShell>
  );
}
