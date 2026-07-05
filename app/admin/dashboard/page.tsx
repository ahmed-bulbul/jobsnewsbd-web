'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  adminGetPosts, adminDeletePost, adminCreateCategoryType,
  adminCreateCategory, adminCreatePostType, getCategoryTypes, getCategories, getPostTypes,
} from '@/lib/api';
import { formatBanglaDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import type { CategoryType, Category, PostType, PostSummary } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken]             = useState('');
  const [adminName, setAdminName]     = useState('');
  const [posts, setPosts]             = useState<PostSummary[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [postTypes, setPostTypes]     = useState<PostType[]>([]);
  const [activeTab, setActiveTab]     = useState<'posts' | 'categories' | 'types'>('posts');
  const [loading, setLoading]         = useState(true);
  const [msg, setMsg]                 = useState('');

  // New category type form
  const [ctNameBn, setCtNameBn] = useState('');
  const [ctNameEn, setCtNameEn] = useState('');
  const [ctSlug, setCtSlug]     = useState('');
  // New category form
  const [catNameBn, setCatNameBn]   = useState('');
  const [catNameEn, setCatNameEn]   = useState('');
  const [catSlug, setCatSlug]       = useState('');
  const [catTypeId, setCatTypeId]   = useState('');
  // New post type form
  const [ptNameBn, setPtNameBn] = useState('');
  const [ptNameEn, setPtNameEn] = useState('');
  const [ptSlug, setPtSlug]     = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadPosts = useCallback(async (t: string) => {
    const res = await adminGetPosts(t);
    setPosts(res.content);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    const n = localStorage.getItem('admin_name');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    setAdminName(n ?? 'Admin');

    Promise.all([loadPosts(t), getCategoryTypes(), getCategories(), getPostTypes()])
      .then(([, ct, c, pt]) => {
        setCategoryTypes(ct);
        setCategories(c);
        setPostTypes(pt);
      })
      .finally(() => setLoading(false));
  }, [router, loadPosts]);

  const handleDeletePost = async (id: number) => {
    if (!confirm('এই বিজ্ঞপ্তি মুছে ফেলবেন?')) return;
    await adminDeletePost(id, token);
    await loadPosts(token);
    flash('বিজ্ঞপ্তি মুছে ফেলা হয়েছে।');
  };

  const handleCreateCT = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminCreateCategoryType({ nameBn: ctNameBn, nameEn: ctNameEn, slug: ctSlug }, token);
    const updated = await getCategoryTypes();
    setCategoryTypes(updated);
    setCtNameBn(''); setCtNameEn(''); setCtSlug('');
    flash('বিভাগের ধরন যুক্ত হয়েছে।');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminCreateCategory({ nameBn: catNameBn, nameEn: catNameEn, slug: catSlug, categoryTypeId: Number(catTypeId) }, token);
    const updated = await getCategories();
    setCategories(updated);
    setCatNameBn(''); setCatNameEn(''); setCatSlug(''); setCatTypeId('');
    flash('বিভাগ যুক্ত হয়েছে।');
  };

  const handleCreatePostType = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminCreatePostType({ nameBn: ptNameBn, nameEn: ptNameEn, slug: ptSlug }, token);
    const updated = await getPostTypes();
    setPostTypes(updated);
    setPtNameBn(''); setPtNameEn(''); setPtSlug('');
    flash('বিজ্ঞপ্তির ধরন যুক্ত হয়েছে।');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-primary font-bold text-lg animate-pulse">লোড হচ্ছে...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'posts',      label: `বিজ্ঞপ্তি (${posts.length})` },
    { id: 'categories', label: 'বিভাগ' },
    { id: 'types',      label: 'ধরন সমূহ' },
  ] as const;

  return (
    <div className="min-h-screen bg-cream">
      {/* Admin header */}
      <header className="bg-primary-900 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold">চ</div>
          <div>
            <span className="font-bold">চাকরির খবর</span>
            <span className="text-primary-300 text-xs ml-2">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-primary-300 text-sm">👤 {adminName}</span>
          <Link href="/admin/analytics" className="text-xs text-primary-300 hover:text-white">📊 অ্যানালিটিক্স</Link>
          <Link href="/admin/exam-centers" className="text-xs text-primary-300 hover:text-white">🏫 পরীক্ষা কেন্দ্র</Link>
          <Link href="/admin/prep" className="text-xs text-primary-300 hover:text-white">📚 প্রস্তুতি</Link>
          <Link href="/" className="text-xs text-primary-300 hover:text-white">সাইটে যান →</Link>
          <button
            onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login'); }}
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            লগআউট
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Flash message */}
        {msg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-up">
            ✅ {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-warm-border p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title"><span className="text-primary">▍</span>বিজ্ঞপ্তি ব্যবস্থাপনা</h2>
              <Link href="/admin/posts/new" className="btn-primary">+ নতুন বিজ্ঞপ্তি</Link>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream border-b border-warm-border text-left">
                      <th className="px-4 py-3 font-semibold text-gray-700">শিরোনাম</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">বিভাগ</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">অবস্থা</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">শেষ তারিখ</th>
                      <th className="px-4 py-3 font-semibold text-gray-700 text-right">ভিউ</th>
                      <th className="px-4 py-3 font-semibold text-gray-700">কার্যক্রম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-border">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-cream/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 line-clamp-1">{post.titleBn ?? post.titleEn}</p>
                          {post.organizationName && (
                            <p className="text-xs text-warm-muted mt-0.5">{post.organizationName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-warm-muted">{post.categoryNameBn}</td>
                        <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                        <td className="px-4 py-3 text-warm-muted text-xs">
                          {post.applicationEnd ? formatBanglaDate(post.applicationEnd) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {post.viewCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              {post.viewCount.toLocaleString('bn-BD')}
                            </span>
                          ) : (
                            <span className="text-xs text-warm-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/posts/${post.id}/edit`} className="text-xs text-primary-600 hover:text-primary font-medium">সম্পাদনা</Link>
                            <button onClick={() => handleDeletePost(post.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">মুছুন</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {posts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-warm-muted">কোনো বিজ্ঞপ্তি নেই</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Categories tab */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add category type */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">নতুন বিভাগের ধরন যুক্ত করুন</h3>
              <form onSubmit={handleCreateCT} className="space-y-3">
                <div>
                  <label className="label">নাম (বাংলা)</label>
                  <input value={ctNameBn} onChange={(e) => setCtNameBn(e.target.value)} required placeholder="যেমন: সরকারি" className="input" />
                </div>
                <div>
                  <label className="label">নাম (ইংরেজি)</label>
                  <input value={ctNameEn} onChange={(e) => setCtNameEn(e.target.value)} placeholder="যেমন: Government" className="input" />
                </div>
                <div>
                  <label className="label">স্লাগ</label>
                  <input value={ctSlug} onChange={(e) => setCtSlug(e.target.value)} required placeholder="যেমন: government" className="input" />
                </div>
                <button type="submit" className="btn-primary">যুক্ত করুন</button>
              </form>

              <div className="mt-6 space-y-2">
                {categoryTypes.map((ct) => (
                  <div key={ct.id} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium">{ct.nameBn}</span>
                    <span className="text-warm-muted text-xs">{ct.slug}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add category */}
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">নতুন বিভাগ যুক্ত করুন</h3>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div>
                  <label className="label">ধরন</label>
                  <select value={catTypeId} onChange={(e) => setCatTypeId(e.target.value)} required className="input">
                    <option value="">ধরন বেছে নিন</option>
                    {categoryTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.nameBn}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">নাম (বাংলা)</label>
                  <input value={catNameBn} onChange={(e) => setCatNameBn(e.target.value)} required placeholder="যেমন: বাংলাদেশ ব্যাংক" className="input" />
                </div>
                <div>
                  <label className="label">নাম (ইংরেজি)</label>
                  <input value={catNameEn} onChange={(e) => setCatNameEn(e.target.value)} placeholder="যেমন: Bangladesh Bank" className="input" />
                </div>
                <div>
                  <label className="label">স্লাগ</label>
                  <input value={catSlug} onChange={(e) => setCatSlug(e.target.value)} required placeholder="যেমন: bangladesh-bank" className="input" />
                </div>
                <button type="submit" className="btn-primary">যুক্ত করুন</button>
              </form>

              <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
                {categories.map((c) => {
                  const ct = categoryTypes.find((t) => t.id === c.categoryTypeId);
                  return (
                    <div key={c.id} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{c.nameBn}</span>
                      <span className="text-warm-muted text-xs">{ct?.nameBn}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Post types tab */}
        {activeTab === 'types' && (
          <div className="max-w-md">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">নতুন বিজ্ঞপ্তির ধরন যুক্ত করুন</h3>
              <form onSubmit={handleCreatePostType} className="space-y-3">
                <div>
                  <label className="label">নাম (বাংলা)</label>
                  <input value={ptNameBn} onChange={(e) => setPtNameBn(e.target.value)} required placeholder="যেমন: চাকরির বিজ্ঞপ্তি" className="input" />
                </div>
                <div>
                  <label className="label">নাম (English)</label>
                  <input value={ptNameEn} onChange={(e) => setPtNameEn(e.target.value)} placeholder="e.g. Job Circular" className="input" />
                </div>
                <div>
                  <label className="label">স্লাগ</label>
                  <input value={ptSlug} onChange={(e) => setPtSlug(e.target.value)} placeholder="যেমন: job-circular" className="input" />
                </div>
                <button type="submit" className="btn-primary">যুক্ত করুন</button>
              </form>

              <div className="mt-6 space-y-2">
                {postTypes.map((pt) => (
                  <div key={pt.id} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium">{pt.nameBn}{pt.nameEn ? ` / ${pt.nameEn}` : ''}</span>
                    <span className="text-warm-muted text-xs">{pt.slug}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
