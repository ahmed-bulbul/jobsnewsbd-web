'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Pagination from '@/components/ui/Pagination';
import {
  getRecommendedBooks,
  adminCreateRecommendedBook,
  adminUpdateRecommendedBook,
  adminDeleteRecommendedBook,
  adminUploadBookCover,
} from '@/lib/api';
import type { RecommendedBook, RecommendedBookRequest } from '@/lib/types';

const EMPTY_FORM: RecommendedBookRequest = { title: '', author: '', category: '', description: '', purchaseLink: '' };

export default function AdminRecommendedBooksPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<RecommendedBookRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCoverFor, setUploadingCoverFor] = useState<number | null>(null);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = useCallback(async (t: string, p: number) => {
    setLoading(true);
    try {
      const res = await getRecommendedBooks({ page: p, size: 20 });
      setBooks(res.content);
      setTotalPages(res.totalPages);
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

  const startCreate = () => { setEditingId('new'); setForm(EMPTY_FORM); };
  const startEdit = (book: RecommendedBook) => {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author ?? '',
      category: book.category ?? '',
      description: book.description ?? '',
      purchaseLink: book.purchaseLink ?? '',
    });
  };
  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.title.trim()) { flash('শিরোনাম আবশ্যক'); return; }
    setSaving(true);
    try {
      const body: RecommendedBookRequest = {
        title: form.title.trim(),
        author: form.author?.trim() || undefined,
        category: form.category?.trim() || undefined,
        description: form.description?.trim() || undefined,
        purchaseLink: form.purchaseLink?.trim() || undefined,
      };
      if (editingId === 'new') {
        await adminCreateRecommendedBook(token, body);
        flash('বই যোগ করা হয়েছে');
      } else if (typeof editingId === 'number') {
        await adminUpdateRecommendedBook(token, editingId, body);
        flash('আপডেট হয়েছে');
      }
      cancelEdit();
      load(token, page);
    } catch (e: unknown) {
      flash((e as Error).message || 'ব্যর্থ হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('বইটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    try {
      await adminDeleteRecommendedBook(token, id);
      flash('মুছে ফেলা হয়েছে');
      load(token, page);
    } catch { flash('ব্যর্থ হয়েছে'); }
  };

  const handleCoverPick = (id: number) => {
    setUploadingCoverFor(id);
    fileInputRef.current?.click();
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploadingCoverFor == null) return;
    try {
      await adminUploadBookCover(token, uploadingCoverFor, file);
      flash('কভার আপলোড হয়েছে');
      load(token, page);
    } catch (err: unknown) {
      flash((err as Error).message || 'আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploadingCoverFor(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />

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
            <h1 className="font-bold text-gray-900 text-lg">প্রস্তাবিত বই ক্যাটালগ</h1>
            {editingId === null && (
              <button onClick={startCreate} className="bg-primary text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-primary-700 transition-colors">
                + নতুন বই যোগ করুন
              </button>
            )}
          </div>

          {editingId !== null && (
            <div className="border border-warm-border rounded-xl p-4 space-y-3 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="বইয়ের নাম *"
                  className="border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="লেখক"
                  className="border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="ক্যাটাগরি (যেমনঃ বিসিএস, ব্যাংক)"
                  className="border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  value={form.purchaseLink}
                  onChange={(e) => setForm({ ...form, purchaseLink: e.target.value })}
                  placeholder="কেনার লিংক (ঐচ্ছিক)"
                  className="border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
                rows={3}
                className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'সেভ হচ্ছে...' : editingId === 'new' ? 'যোগ করুন' : 'আপডেট করুন'}
                </button>
                <button onClick={cancelEdit} className="border border-warm-border rounded-lg px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors">
                  বাতিল
                </button>
              </div>
              {typeof editingId === 'number' && (
                <p className="text-xs text-warm-muted">কভার ছবি পরিবর্তন করতে নিচের তালিকায় "কভার আপলোড" বাটন ব্যবহার করুন।</p>
              )}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
          ) : books.length === 0 ? (
            <p className="text-sm text-warm-muted py-4 text-center">কোনো বই নেই</p>
          ) : (
            <div className="space-y-3">
              {books.map((book) => (
                <div key={book.id} className="border border-warm-border rounded-xl p-4 flex gap-3">
                  <div className="w-14 h-20 bg-warm-bg rounded-lg overflow-hidden relative shrink-0">
                    {book.coverImageUrl ? (
                      <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📖</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{book.title}</p>
                    <p className="text-xs text-warm-muted truncate">
                      {book.author}{book.category ? ` • ${book.category}` : ''}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button onClick={() => startEdit(book)} className="text-xs text-primary hover:underline font-semibold">সম্পাদনা</button>
                      <button onClick={() => handleCoverPick(book.id)} className="text-xs text-primary hover:underline font-semibold">কভার আপলোড</button>
                      <button onClick={() => handleDelete(book.id)} className="text-xs text-red-500 hover:underline font-semibold">মুছুন</button>
                    </div>
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
