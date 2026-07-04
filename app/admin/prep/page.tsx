'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getPrepCategories,
  getPrepCategory,
  adminCreatePrepCategory,
  adminUpdatePrepCategory,
  adminDeletePrepCategory,
  adminCreatePrepTopic,
  adminUpdatePrepTopic,
  adminDeletePrepTopic,
  adminCreatePrepContent,
  adminUpdatePrepContent,
  adminDeletePrepContent,
} from '@/lib/api';
import type { PrepCategory, PrepCategoryDetail, PrepContent, PrepTopic } from '@/lib/types';

type Tab = 'categories' | 'topics' | 'content';

// Flat topic record enriched with its category name
interface FlatTopic extends PrepTopic { categoryNameBn: string }

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}

// ── Searchable topic picker ────────────────────────────────────────────────────
function TopicPicker({
  allTopics,
  categories,
  value,
  onChange,
}: {
  allTopics: FlatTopic[];
  categories: PrepCategory[];
  value: string;
  onChange: (topicId: string) => void;
}) {
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return allTopics.filter((t) => {
      const matchCat = !catFilter || String(t.categoryId) === catFilter;
      const matchSearch = !search ||
        t.nameBn.toLowerCase().includes(search.toLowerCase()) ||
        (t.nameEn ?? '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allTopics, catFilter, search]);

  const selected = allTopics.find((t) => String(t.id) === value);

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">বিষয় (Topic) *</label>

      {/* Selected display / toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition-colors ${
          open ? 'border-primary ring-1 ring-primary' : 'border-warm-border hover:border-gray-400'
        }`}
      >
        {selected ? (
          <span>
            <span className="font-medium text-gray-900">{selected.nameBn}</span>
            <span className="text-warm-muted ml-1.5 text-xs">— {selected.categoryNameBn}</span>
          </span>
        ) : (
          <span className="text-warm-muted">বিষয় বেছে নিন...</span>
        )}
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 border border-warm-border rounded-xl bg-white shadow-lg overflow-hidden z-10">
          {/* Filters */}
          <div className="p-2 space-y-2 border-b border-warm-border bg-gray-50">
            {/* Category filter */}
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="w-full border border-warm-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary bg-white"
            >
              <option value="">সব ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameBn}</option>
              ))}
            </select>
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="বিষয় খুঁজুন..."
                className="w-full border border-warm-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Topic list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-warm-muted py-4">কোনো বিষয় পাওয়া যায়নি</p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onChange(String(t.id)); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 transition-colors flex items-center justify-between ${
                    String(t.id) === value ? 'bg-primary-50 text-primary font-semibold' : 'text-gray-800'
                  }`}
                >
                  <span>{t.nameBn}</span>
                  <span className="text-xs text-warm-muted ml-2 shrink-0">{t.categoryNameBn}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPrepPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('categories');
  const [msg, setMsg] = useState('');

  // Data
  const [categories, setCategories] = useState<PrepCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<PrepCategoryDetail | null>(null);
  const [allTopics, setAllTopics] = useState<FlatTopic[]>([]);
  const [loading, setLoading] = useState(true);

  // Category form
  const [catId, setCatId] = useState(0);
  const [catNameBn, setCatNameBn] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catColor, setCatColor] = useState('#1D4ED8');
  const [catOrder, setCatOrder] = useState('0');

  // Topic form
  const [topicId, setTopicId] = useState(0);
  const [topicCatId, setTopicCatId] = useState('');
  const [topicNameBn, setTopicNameBn] = useState('');
  const [topicNameEn, setTopicNameEn] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicOrder, setTopicOrder] = useState('0');

  // Content form
  const [contentId, setContentId] = useState(0);
  const [contentTopicId, setContentTopicId] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentType, setContentType] = useState('VIDEO');
  const [contentUrl, setContentUrl] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentOrder, setContentOrder] = useState('0');
  const [contentPublished, setContentPublished] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadCategories = useCallback(async () => {
    const cats = await getPrepCategories();
    setCategories(cats);
    return cats;
  }, []);

  // Load ALL topics across every category (for the content topic picker)
  const loadAllTopics = useCallback(async (cats: PrepCategory[]) => {
    const details = await Promise.all(cats.map((c) => getPrepCategory(c.slug)));
    const flat: FlatTopic[] = details.flatMap((d) =>
      d.topics.map((t) => ({ ...t, categoryNameBn: d.nameBn }))
    );
    setAllTopics(flat);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    loadCategories()
      .then((cats) => loadAllTopics(cats))
      .finally(() => setLoading(false));
  }, [router, loadCategories, loadAllTopics]);

  const loadCategoryTopics = async (slug: string) => {
    const detail = await getPrepCategory(slug);
    setSelectedCat(detail);
    // Refresh allTopics for this category in case topics were added
    setAllTopics((prev) => {
      const without = prev.filter((t) => t.categoryId !== detail.id);
      const fresh = detail.topics.map((t) => ({ ...t, categoryNameBn: detail.nameBn }));
      return [...without, ...fresh].sort((a, b) => a.categoryId - b.categoryId || a.displayOrder - b.displayOrder);
    });
  };

  // ── Category actions ──────────────────────────────────────────────────────

  const resetCatForm = () => {
    setCatId(0); setCatNameBn(''); setCatNameEn('');
    setCatSlug(''); setCatIcon(''); setCatColor('#1D4ED8'); setCatOrder('0');
  };

  const editCat = (c: PrepCategory) => {
    setCatId(c.id); setCatNameBn(c.nameBn); setCatNameEn(c.nameEn ?? '');
    setCatSlug(c.slug); setCatIcon(c.icon ?? ''); setCatColor(c.colorHex ?? '#1D4ED8');
    setCatOrder(String(c.displayOrder));
  };

  const saveCat = async () => {
    const body = { nameBn: catNameBn, nameEn: catNameEn, slug: catSlug, icon: catIcon, colorHex: catColor, displayOrder: Number(catOrder), active: true };
    try {
      if (catId) await adminUpdatePrepCategory(token, catId, body);
      else await adminCreatePrepCategory(token, body);
      const cats = await loadCategories();
      await loadAllTopics(cats);
      resetCatForm();
      flash(catId ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteCat = async (id: number) => {
    if (!confirm('মুছে ফেলবেন?')) return;
    try {
      await adminDeletePrepCategory(token, id);
      const cats = await loadCategories();
      await loadAllTopics(cats);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  // ── Topic actions ─────────────────────────────────────────────────────────

  const resetTopicForm = () => {
    setTopicId(0); setTopicCatId(''); setTopicNameBn(''); setTopicNameEn('');
    setTopicSlug(''); setTopicDesc(''); setTopicOrder('0');
  };

  const editTopic = (t: PrepTopic) => {
    setTopicId(t.id); setTopicCatId(String(t.categoryId));
    setTopicNameBn(t.nameBn); setTopicNameEn(t.nameEn ?? '');
    setTopicSlug(t.slug); setTopicDesc(t.description ?? ''); setTopicOrder(String(t.displayOrder));
  };

  const saveTopic = async () => {
    const body = { categoryId: Number(topicCatId), nameBn: topicNameBn, nameEn: topicNameEn, slug: topicSlug, description: topicDesc, displayOrder: Number(topicOrder), active: true };
    try {
      if (topicId) await adminUpdatePrepTopic(token, topicId, body);
      else await adminCreatePrepTopic(token, body);
      if (selectedCat) await loadCategoryTopics(selectedCat.slug);
      resetTopicForm();
      flash(topicId ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteTopic = async (id: number) => {
    if (!confirm('মুছে ফেলবেন?')) return;
    try {
      await adminDeletePrepTopic(token, id);
      if (selectedCat) await loadCategoryTopics(selectedCat.slug);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  // ── Content actions ───────────────────────────────────────────────────────

  const resetContentForm = () => {
    setContentId(0); setContentTopicId(''); setContentTitle('');
    setContentType('VIDEO'); setContentUrl(''); setContentBody('');
    setContentOrder('0'); setContentPublished(false);
  };

  const editContent = (c: PrepContent) => {
    setContentId(c.id); setContentTopicId(String(c.topicId));
    setContentTitle(c.title); setContentType(c.contentType);
    setContentUrl(c.contentUrl ?? ''); setContentBody(c.body ?? '');
    setContentOrder(String(c.displayOrder)); setContentPublished(c.published ?? false);
  };

  const saveContent = async () => {
    if (!contentTopicId) { flash('বিষয় বেছে নিন'); return; }
    const body = { topicId: Number(contentTopicId), title: contentTitle, contentType, contentUrl: contentUrl || null, body: contentBody || null, durationSeconds: null, displayOrder: Number(contentOrder), published: contentPublished };
    try {
      if (contentId) await adminUpdatePrepContent(token, contentId, body);
      else await adminCreatePrepContent(token, body);
      resetContentForm();
      flash(contentId ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteContent = async (id: number) => {
    if (!confirm('মুছে ফেলবেন?')) return;
    try {
      await adminDeletePrepContent(token, id);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-warm-muted">লোড হচ্ছে...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-warm-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-warm-muted hover:text-primary text-sm">← ড্যাশবোর্ড</Link>
          <span className="text-warm-muted">/</span>
          <span className="font-bold text-gray-900">চাকরির প্রস্তুতি</span>
        </div>
        {msg && <span className="text-sm font-medium text-primary bg-primary-50 px-3 py-1 rounded-full">{msg}</span>}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-warm-border rounded-xl p-1 mb-6 w-fit">
          {(['categories', 'topics', 'content'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'}`}
            >
              {t === 'categories' ? 'ক্যাটাগরি' : t === 'topics' ? 'বিষয়' : 'কন্টেন্ট'}
            </button>
          ))}
        </div>

        {/* ── Categories ─────────────────────────────────────────────────── */}
        {tab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3">
              <h2 className="font-bold text-gray-900">{catId ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি'}</h2>
              <Field label="নাম (বাংলা) *" value={catNameBn} onChange={setCatNameBn} />
              <Field label="নাম (ইংরেজি)" value={catNameEn} onChange={setCatNameEn} />
              <Field label="স্লাগ" value={catSlug} onChange={setCatSlug} placeholder="auto-generated" />
              <Field label="আইকন" value={catIcon} onChange={setCatIcon} placeholder="school" />
              <Field label="রং (#hex)" value={catColor} onChange={setCatColor} />
              <Field label="ক্রম" value={catOrder} onChange={setCatOrder} type="number" />
              <div className="flex gap-2 pt-1">
                <button onClick={saveCat} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                  {catId ? 'আপডেট' : 'তৈরি করুন'}
                </button>
                {catId > 0 && (
                  <button onClick={resetCatForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-warm-border p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: c.colorHex ?? '#374151' }}>
                    {c.displayOrder}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{c.nameBn}</p>
                    <p className="text-xs text-warm-muted">{c.slug}</p>
                  </div>
                  <button onClick={() => { setTab('topics'); loadCategoryTopics(c.slug); setTopicCatId(String(c.id)); }} className="text-xs text-primary hover:underline">বিষয় →</button>
                  <button onClick={() => editCat(c)} className="text-xs text-blue-600 hover:underline ml-2">এডিট</button>
                  <button onClick={() => deleteCat(c.id)} className="text-xs text-red-500 hover:underline ml-2">মুছুন</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Topics ─────────────────────────────────────────────────────── */}
        {tab === 'topics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3">
              <h2 className="font-bold text-gray-900">{topicId ? 'বিষয় এডিট করুন' : 'নতুন বিষয়'}</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ক্যাটাগরি *</label>
                <select
                  value={topicCatId}
                  onChange={(e) => { setTopicCatId(e.target.value); const c = categories.find((c) => c.id === Number(e.target.value)); if (c) loadCategoryTopics(c.slug); }}
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">বেছে নিন</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nameBn}</option>)}
                </select>
              </div>
              <Field label="নাম (বাংলা) *" value={topicNameBn} onChange={setTopicNameBn} />
              <Field label="নাম (ইংরেজি)" value={topicNameEn} onChange={setTopicNameEn} />
              <Field label="স্লাগ" value={topicSlug} onChange={setTopicSlug} placeholder="auto-generated" />
              <Field label="বিবরণ" value={topicDesc} onChange={setTopicDesc} />
              <Field label="ক্রম" value={topicOrder} onChange={setTopicOrder} type="number" />
              <div className="flex gap-2 pt-1">
                <button onClick={saveTopic} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                  {topicId ? 'আপডেট' : 'তৈরি করুন'}
                </button>
                {topicId > 0 && (
                  <button onClick={resetTopicForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              {selectedCat && (
                <p className="text-sm font-semibold text-gray-700 mb-3">{selectedCat.nameBn} — বিষয়সমূহ</p>
              )}
              {(selectedCat?.topics ?? []).map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-warm-border p-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{t.displayOrder}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{t.nameBn}</p>
                    <p className="text-xs text-warm-muted">{t.slug}</p>
                  </div>
                  <button onClick={() => editTopic(t)} className="text-xs text-blue-600 hover:underline">এডিট</button>
                  <button onClick={() => deleteTopic(t.id)} className="text-xs text-red-500 hover:underline ml-2">মুছুন</button>
                </div>
              ))}
              {!selectedCat && <p className="text-sm text-warm-muted">বাম থেকে ক্যাটাগরি বেছে নিন</p>}
            </div>
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────── */}
        {tab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3">
              <h2 className="font-bold text-gray-900">{contentId ? 'কন্টেন্ট এডিট করুন' : 'নতুন কন্টেন্ট'}</h2>

              {/* ── Searchable topic picker ── */}
              <TopicPicker
                allTopics={allTopics}
                categories={categories}
                value={contentTopicId}
                onChange={setContentTopicId}
              />

              <Field label="শিরোনাম *" value={contentTitle} onChange={setContentTitle} />

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ধরন *</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="VIDEO">📹 ভিডিও</option>
                  <option value="POST">📄 আর্টিকেল</option>
                  <option value="PDF">📑 পিডিএফ</option>
                  <option value="QUIZ">❓ কুইজ</option>
                </select>
              </div>

              {(contentType === 'VIDEO' || contentType === 'PDF') && (
                <Field label={contentType === 'VIDEO' ? 'YouTube URL' : 'PDF URL'} value={contentUrl} onChange={setContentUrl} placeholder={contentType === 'VIDEO' ? 'https://youtube.com/watch?v=...' : 'https://...'} />
              )}

              {(contentType === 'POST' || contentType === 'QUIZ') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">বডি / কন্টেন্ট</label>
                  <textarea
                    value={contentBody}
                    onChange={(e) => setContentBody(e.target.value)}
                    rows={5}
                    placeholder="আর্টিকেলের বিষয়বস্তু লিখুন..."
                    className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              )}

              <Field label="ক্রম" value={contentOrder} onChange={setContentOrder} type="number" />

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={contentPublished} onChange={(e) => setContentPublished(e.target.checked)} className="rounded accent-primary w-4 h-4" />
                <span className="font-medium text-gray-700">প্রকাশিত (Published)</span>
              </label>

              <div className="flex gap-2 pt-1">
                <button onClick={saveContent} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                  {contentId ? 'আপডেট করুন' : 'তৈরি করুন'}
                </button>
                {contentId > 0 && (
                  <button onClick={resetContentForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>
                )}
              </div>
            </div>

            {/* Help panel */}
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4 h-fit">
              <h3 className="font-bold text-gray-800 text-sm">সাহায্য</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <span className="text-lg">📹</span>
                  <p><strong>ভিডিও:</strong> YouTube লিংক paste করুন — সিস্টেম thumbnail ও embed স্বয়ংক্রিয়ভাবে তৈরি করবে।</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">📄</span>
                  <p><strong>আর্টিকেল:</strong> বডিতে সরাসরি বাংলায় লিখুন।</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">📑</span>
                  <p><strong>পিডিএফ:</strong> PDF ফাইলের সরাসরি URL দিন।</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-lg">✅</span>
                  <p><strong>প্রকাশিত:</strong> চেক না করলে কন্টেন্ট ড্রাফট থাকবে — ব্যবহারকারীরা দেখতে পাবেন না।</p>
                </div>
              </div>

              {allTopics.length > 0 && (
                <div className="mt-4 pt-4 border-t border-warm-border">
                  <p className="text-xs font-semibold text-gray-500 mb-2">মোট বিষয়: {allTopics.length}টি</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {categories.map((c) => {
                      const count = allTopics.filter((t) => t.categoryId === c.id).length;
                      return (
                        <div key={c.id} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{c.nameBn}</span>
                          <span className="font-semibold">{count}টি</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
