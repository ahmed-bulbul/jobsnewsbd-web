'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminCreatePost, getCategoryTypes, getCategories, getPostTypes } from '@/lib/api';
import type { CategoryType, Category, PostType } from '@/lib/types';

export default function NewPostPage() {
  const router = useRouter();
  const [token, setToken]         = useState('');
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [postTypes, setPostTypes]         = useState<PostType[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  const [form, setForm] = useState({
    titleBn: '', titleEn: '', organizationName: '', categoryId: '',
    postTypeId: '', district: '', qualification: '', description: '',
    applicationStart: '', applicationEnd: '', sourceUrl: '', publish: false,
  });

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    Promise.all([getCategoryTypes(), getCategories(), getPostTypes()]).then(([ct, c, pt]) => {
      setCategoryTypes(ct); setCategories(c); setPostTypes(pt);
    });
  }, [router]);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) { setError('বিভাগ বেছে নিন'); return; }
    setSubmitting(true);
    setError('');
    try {
      await adminCreatePost({
        ...form,
        categoryId:  Number(form.categoryId),
        postTypeId:  form.postTypeId ? Number(form.postTypeId) : null,
        applicationStart: form.applicationStart || null,
        applicationEnd:   form.applicationEnd   || null,
      }, token);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'ত্রুটি হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-primary-300 hover:text-white text-sm">← ড্যাশবোর্ড</Link>
        <h1 className="font-bold">নতুন বিজ্ঞপ্তি যুক্ত করুন</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">শিরোনাম (বাংলা)</label>
              <input value={form.titleBn} onChange={(e) => set('titleBn', e.target.value)} className="input" placeholder="বাংলায় শিরোনাম লিখুন" />
            </div>
            <div className="md:col-span-2">
              <label className="label">শিরোনাম (English) *</label>
              <input value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} required className="input" placeholder="Title in English" />
            </div>

            <div>
              <label className="label">প্রতিষ্ঠানের নাম</label>
              <input value={form.organizationName} onChange={(e) => set('organizationName', e.target.value)} className="input" placeholder="যেমন: Bangladesh Bank" />
            </div>
            <div>
              <label className="label">জেলা</label>
              <input value={form.district} onChange={(e) => set('district', e.target.value)} className="input" placeholder="যেমন: Dhaka" />
            </div>

            <div>
              <label className="label">বিভাগ *</label>
              <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required className="input">
                <option value="">বিভাগ বেছে নিন</option>
                {categoryTypes.map((ct) => (
                  <optgroup key={ct.id} label={ct.nameBn}>
                    {categories.filter((c) => c.categoryTypeId === ct.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.nameBn}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="label">বিজ্ঞপ্তির ধরন</label>
              <select value={form.postTypeId} onChange={(e) => set('postTypeId', e.target.value)} className="input">
                <option value="">ধরন বেছে নিন</option>
                {postTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">যোগ্যতা</label>
              <input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} className="input" placeholder="যেমন: স্নাতক" />
            </div>
            <div>
              <label className="label">সোর্স লিংক</label>
              <input value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} type="url" className="input" placeholder="https://..." />
            </div>

            <div>
              <label className="label">আবেদন শুরু</label>
              <input value={form.applicationStart} onChange={(e) => set('applicationStart', e.target.value)} type="datetime-local" className="input" />
            </div>
            <div>
              <label className="label">আবেদনের শেষ তারিখ</label>
              <input value={form.applicationEnd} onChange={(e) => set('applicationEnd', e.target.value)} type="datetime-local" className="input" />
            </div>

            <div className="md:col-span-2">
              <label className="label">বিবরণ</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={6}
                className="input resize-none"
                placeholder="বিস্তারিত বিবরণ লিখুন..."
              />
            </div>
          </div>

          <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            💡 PDF বিজ্ঞপ্তি আপলোড করতে প্রথমে সংরক্ষণ করুন, তারপর সম্পাদনা পৃষ্ঠা থেকে PDF যুক্ত করুন।
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-warm-border">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => set('publish', e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-medium text-gray-700">এখনই প্রকাশ করুন</span>
            </label>
            <span className="text-xs text-warm-muted">(না করলে ড্রাফট হিসেবে থাকবে)</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
              {submitting ? 'সংরক্ষণ হচ্ছে...' : form.publish ? 'প্রকাশ করুন' : 'ড্রাফট সংরক্ষণ করুন'}
            </button>
            <Link href="/admin/dashboard" className="btn-outline px-6 py-3">বাতিল</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
