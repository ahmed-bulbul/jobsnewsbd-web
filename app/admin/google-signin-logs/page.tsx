'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Table, { type TableColumn } from '@/components/admin/Table';
import Badge from '@/components/admin/Badge';
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

  const columns: TableColumn<GoogleSignInLog>[] = [
    {
      key: 'time',
      header: 'সময়',
      render: (log) => <span className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString('bn-BD')}</span>,
    },
    {
      key: 'status',
      header: 'স্ট্যাটাস',
      render: (log) => <Badge tone={log.success ? 'success' : 'danger'}>{log.success ? 'সফল' : 'ব্যর্থ'}</Badge>,
    },
    {
      key: 'stage',
      header: 'ধাপ',
      render: (log) => <Badge tone="neutral">{STAGE_LABEL[log.stage] ?? log.stage}</Badge>,
    },
    { key: 'email', header: 'ইমেইল', render: (log) => <span className="whitespace-nowrap">{log.email ?? '—'}</span> },
    { key: 'appVersion', header: 'অ্যাপ ভার্সন', render: (log) => <span className="whitespace-nowrap">{log.appVersion ?? '—'}</span> },
    { key: 'os', header: 'OS', render: (log) => <span className="whitespace-nowrap">{log.osVersion ?? '—'}</span> },
    { key: 'platform', header: 'প্ল্যাটফর্ম', render: (log) => <span className="whitespace-nowrap">{log.platform ?? '—'}</span> },
    {
      key: 'error',
      header: 'এরর',
      className: 'max-w-xs',
      render: (log) => {
        const expanded = expandedId === log.id;
        const err = log.errorMessage ?? '';
        const errShort = err.length > 60 ? `${err.slice(0, 60)}…` : err;
        return log.errorMessage ? (
          <button
            onClick={() => setExpandedId(expanded ? null : log.id)}
            className="text-left text-red-600 hover:underline"
            title="বিস্তারিত দেখতে ক্লিক করুন"
          >
            {expanded ? err : errShort}
          </button>
        ) : (
          <span className="text-warm-muted">—</span>
        );
      },
    },
  ];

  return (
    <AdminShell title="Google সাইন-ইন লগ" subtitle="মোবাইল অ্যাপের প্রতিটি সাইন-ইন ধাপের রেকর্ড" adminName={adminName} token={token}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader title={`Google Sign-In লগ (${totalElements})`} />

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-end flex-wrap gap-3">
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
          ) : (
            <Table columns={columns} data={items} rowKey={(log) => log.id} emptyMessage="কোনো লগ পাওয়া যায়নি" />
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>
    </AdminShell>
  );
}
