'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Badge from '@/components/admin/Badge';
import {
  adminGetJobExperiences,
  adminApproveJobExperience,
  adminRejectJobExperience,
  adminDeleteJobExperience,
} from '@/lib/api';
import type { AdminJobExperience } from '@/lib/types';

const OUTCOME_LABEL: Record<string, string> = { SELECTED: 'নির্বাচিত', REJECTED: 'প্রত্যাখ্যাত', WAITING: 'অপেক্ষমান' };
const STAGE_LABEL: Record<string, string> = { WRITTEN: 'লিখিত', VIVA: 'ভাইভা', FINAL: 'চূড়ান্ত ফলাফল' };

export default function AdminJobExperiencesPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [items, setItems] = useState<AdminJobExperience[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [rejectNoteId, setRejectNoteId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = useCallback(async (t: string, f: string, p: number) => {
    setLoading(true);
    try {
      const res = await adminGetJobExperiences(t, f, p, 20);
      setItems(res.content);
      setTotalPages(res.totalPages);
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

  const handleApprove = async (id: number) => {
    if (!confirm('অনুমোদন করবেন?')) return;
    try {
      await adminApproveJobExperience(token, id);
      flash('অনুমোদন হয়েছে');
      load(token, filter, page);
    } catch (e: unknown) { flash((e as Error).message || 'ব্যর্থ'); }
  };

  const handleReject = async (id: number) => {
    try {
      await adminRejectJobExperience(token, id, rejectNote || undefined);
      flash('বাতিল হয়েছে');
      setRejectNoteId(null);
      setRejectNote('');
      load(token, filter, page);
    } catch { flash('ব্যর্থ'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('পোস্টটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    try {
      await adminDeleteJobExperience(token, id);
      flash('মুছে ফেলা হয়েছে');
      load(token, filter, page);
    } catch { flash('ব্যর্থ'); }
  };

  return (
    <AdminShell title="চাকরির অভিজ্ঞতা" subtitle="ব্যবহারকারীর পোস্ট মডারেশন" adminName={adminName} token={token}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {msg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{msg}</div>
        )}

        <PageHeader title="চাকরির অভিজ্ঞতা পোস্ট মডারেশন" />

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-end flex-wrap gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {f === 'PENDING' ? 'অপেক্ষমাণ' : f === 'APPROVED' ? 'অনুমোদিত' : 'বাতিল'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-warm-muted py-4 text-center">কোনো পোস্ট নেই</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="border border-warm-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-3 flex-wrap">
                    <Badge tone={item.outcome === 'SELECTED' ? 'success' : item.outcome === 'REJECTED' ? 'danger' : 'warning'}>
                      {OUTCOME_LABEL[item.outcome] ?? item.outcome}
                    </Badge>
                    <Badge tone="neutral">{STAGE_LABEL[item.stageReached] ?? item.stageReached}</Badge>
                    {item.isAnonymous && <Badge tone="violet">বেনামী পোস্ট</Badge>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-warm-muted">
                        {item.userName} <span className="font-normal">({item.userEmail})</span> • {item.organizationName}
                        {item.positionTitle ? ` • ${item.positionTitle}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-warm-muted shrink-0">{new Date(item.createdAt).toLocaleString('bn-BD')}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">{item.body}</p>
                  </div>

                  {item.adminNote && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">নোট: {item.adminNote}</p>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    {item.status === 'PENDING' && (
                      <>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="flex-1 bg-green-600 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-green-700 transition-colors"
                          >
                            অনুমোদন করুন
                          </button>
                          <button
                            onClick={() => setRejectNoteId(rejectNoteId === item.id ? null : item.id)}
                            className="flex-1 border border-red-300 text-red-600 rounded-lg py-1.5 text-xs font-semibold hover:bg-red-50 transition-colors"
                          >
                            বাতিল করুন
                          </button>
                        </div>
                        {rejectNoteId === item.id && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              placeholder="বাতিলের কারণ (ঐচ্ছিক)"
                              className="flex-1 border border-warm-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-400"
                            />
                            <button
                              onClick={() => handleReject(item.id)}
                              className="px-4 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                            >
                              নিশ্চিত করুন
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="self-start text-xs text-red-500 hover:text-red-700 underline"
                    >
                      স্থায়ীভাবে মুছুন
                    </button>
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
