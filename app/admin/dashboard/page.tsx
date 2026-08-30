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
import Pagination from '@/components/ui/Pagination';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Tabs from '@/components/admin/Tabs';
import Table, { type TableColumn } from '@/components/admin/Table';
import Badge from '@/components/admin/Badge';
import type { CategoryType, Category, PostType, PostSummary } from '@/lib/types';

const POSTS_PAGE_SIZE = 20;

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken]             = useState('');
  const [adminName, setAdminName]     = useState('');
  const [posts, setPosts]             = useState<PostSummary[]>([]);
  const [postsPage, setPostsPage]     = useState(0);
  const [postsTotalPages, setPostsTotalPages] = useState(0);
  const [postsTotal, setPostsTotal]   = useState(0);
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

  const loadPosts = useCallback(async (t: string, p = 0) => {
    const res = await adminGetPosts(t, p, POSTS_PAGE_SIZE);
    setPosts(res.content);
    setPostsPage(res.page);
    setPostsTotalPages(res.totalPages);
    setPostsTotal(res.totalElements);
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

  const handlePostsPageChange = (p: number) => {
    loadPosts(token, p);
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('এই বিজ্ঞপ্তি মুছে ফেলবেন?')) return;
    await adminDeletePost(id, token);
    await loadPosts(token, postsPage);
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

  const tabs = [
    { id: 'posts',      label: `বিজ্ঞপ্তি (${postsTotal})` },
    { id: 'categories', label: 'বিভাগ' },
    { id: 'types',      label: 'ধরন সমূহ' },
  ] as const;

  const columns: TableColumn<PostSummary>[] = [
    {
      key: 'title',
      header: 'শিরোনাম',
      render: (post) => (
        <>
          <p className="font-medium text-gray-900 line-clamp-1">{post.titleBn ?? post.titleEn}</p>
          {post.organizationName && <p className="text-xs text-warm-muted mt-0.5">{post.organizationName}</p>}
        </>
      ),
    },
    { key: 'category', header: 'বিভাগ', render: (post) => <span className="text-warm-muted">{post.categoryNameBn}</span> },
    {
      key: 'publish',
      header: 'প্রকাশ',
      render: (post) =>
        post.publishedAt
          ? <Badge tone="success" dot>প্রকাশিত</Badge>
          : <Badge tone="neutral" dot>খসড়া</Badge>,
    },
    { key: 'status', header: 'অবস্থা', render: (post) => <StatusBadge status={post.status} /> },
    {
      key: 'deadline',
      header: 'শেষ তারিখ',
      render: (post) => <span className="text-warm-muted text-xs">{post.applicationEnd ? formatBanglaDate(post.applicationEnd) : '—'}</span>,
    },
    {
      key: 'views',
      header: 'ভিউ',
      align: 'right',
      render: (post) =>
        post.viewCount > 0 ? (
          <Badge tone="violet">{post.viewCount.toLocaleString('bn-BD')}</Badge>
        ) : (
          <span className="text-xs text-warm-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'কার্যক্রম',
      render: (post) => (
        <div className="flex items-center gap-2">
          <Link href={`/admin/posts/${post.id}/edit`} className="text-xs text-primary-600 hover:text-primary font-medium">সম্পাদনা</Link>
          <button onClick={() => handleDeletePost(post.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">মুছুন</button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="ড্যাশবোর্ড" subtitle="বিজ্ঞপ্তি, বিভাগ ও ধরন ব্যবস্থাপনা" adminName={adminName} token={token}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
        {loading ? (
          <p className="text-sm text-warm-muted py-12 text-center">লোড হচ্ছে...</p>
        ) : (
          <>
            {msg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-up">
                ✅ {msg}
              </div>
            )}

            <PageHeader
              title="বিজ্ঞপ্তি ব্যবস্থাপনা"
              actions={activeTab === 'posts' ? <Link href="/admin/posts/new" className="btn-primary">+ নতুন বিজ্ঞপ্তি</Link> : undefined}
            />

            <div className="mb-6">
              <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as typeof activeTab)} />
            </div>

            {activeTab === 'posts' && (
              <div className="space-y-4">
                <Table columns={columns} data={posts} rowKey={(p) => p.id} emptyMessage="কোনো বিজ্ঞপ্তি নেই" />
                <Pagination page={postsPage} totalPages={postsTotalPages} onPageChange={handlePostsPageChange} />
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          </>
        )}
      </div>
    </AdminShell>
  );
}
