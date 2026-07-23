'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Pagination from '@/components/ui/Pagination';
import {
  adminGetBookListings,
  adminApproveBookListing,
  adminRejectBookListing,
  adminDeleteBookListing,
} from '@/lib/api';
import type { AdminBookListing } from '@/lib/types';

const CONDITION_LABEL: Record<string, string> = { NEW: 'নতুন', LIKE_NEW: 'প্রায় নতুন', GOOD: 'ভালো', FAIR: 'মোটামুটি' };

export default function AdminBookListingsPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [items, setItems] = useState<AdminBookListing[]>([]);
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
      const res = await adminGetBookListings(t, f, p, 20);
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
      await adminApproveBookListing(token, id);
      flash('অনুমোদন হয়েছে');
      load(token, filter, page);
    } catch (e: unknown) { flash((e as Error).message || 'ব্যর্থ'); }
  };

  const handleReject = async (id: number) => {
    try {
      await adminRejectBookListing(token, id, rejectNote || undefined);
      flash('বাতিল হয়েছে');
      setRejectNoteId(null);
      setRejectNote('');
      load(token, filter, page);
    } catch { flash('ব্যর্থ'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('বিজ্ঞাপনটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    try {
      await adminDeleteBookListing(token, id);
      flash('মুছে ফেলা হয়েছে');
      load(token, filter, page);
    } catch { flash('ব্যর্থ'); }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Admin header */}
      <header className="bg-primary-900 text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-y-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold shrink-0">চ</div>
          <div>
            <span className="font-bold">চাকরির খবর</span>
            <span className="text-primary-300 text-xs ml-2">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap w-full sm:w-auto">
          <span className="text-primary-300 text-sm">👤 {adminName}</span>
          <Link href="/admin/dashboard" className="text-xs text-primary-300 hover:text-white whitespace-nowrap">← ড্যাশবোর্ড</Link>
          <Link href="/" className="text-xs text-primary-300 hover:text-white whitespace-nowrap">সাইটে যান →</Link>
          <button
            onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login'); }}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            লগআউট
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {msg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{msg}</div>
        )}

        <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="font-bold text-gray-900 text-lg">বই বিজ্ঞাপন মডারেশন</h1>
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
            <p className="text-sm text-warm-muted py-4 text-center">কোনো বিজ্ঞাপন নেই</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="border border-warm-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="w-12 h-16 bg-warm-bg rounded-lg overflow-hidden relative shrink-0">
                      {item.photoUrl ? (
                        <Image src={item.photoUrl} alt={item.title} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-warm-muted">
                        {item.sellerName} <span className="font-normal">({item.sellerEmail})</span>
                      </p>
                      <p className="text-xs text-warm-muted">
                        ৳{item.price} • {CONDITION_LABEL[item.condition] ?? item.condition}
                        {item.sold && <> • বিক্রি হয়ে গেছে</>}
                      </p>
                    </div>
                    <p className="text-xs text-warm-muted shrink-0">{new Date(item.createdAt).toLocaleString('bn-BD')}</p>
                  </div>

                  {item.description && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">{item.description}</p>
                    </div>
                  )}

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
      </main>
    </div>
  );
}
