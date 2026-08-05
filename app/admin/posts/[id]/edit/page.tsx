'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  adminUpdatePost, adminUploadCircularPdf, adminDeleteCircularPdf, adminSetCircularPdfUrl,
  adminUploadOrganizationLogo, adminDeleteOrganizationLogo, adminSetOrganizationLogoUrl,
  getCategoryTypes, getCategories, getPostTypes,
} from '@/lib/api';
import type { CategoryType, Category, PostType, Post } from '@/lib/types';

interface Props { params: Promise<{ id: string }> }

function CopyUrlRow({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="input flex-1 text-xs text-gray-600 bg-gray-50"
      />
      <button
        type="button"
        onClick={copy}
        className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
          copied
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-cream border-warm-border text-gray-600 hover:border-primary hover:text-primary'
        }`}
      >
        {copied ? '✓ কপি হয়েছে' : '📋 লিংক কপি করুন'}
      </button>
    </div>
  );
}

export default function EditPostPage({ params }: Props) {
  const router = useRouter();
  const [id, setId]               = useState(0);
  const [token, setToken]         = useState('');
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [postTypes, setPostTypes]         = useState<PostType[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [viewCount, setViewCount]         = useState(0);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile]             = useState<File | null>(null);
  const [pdfUploading, setPdfUploading]   = useState(false);
  const [pdfMsg, setPdfMsg]               = useState('');
  const [pdfUrlInput, setPdfUrlInput]     = useState('');
  const [pdfUrlSaving, setPdfUrlSaving]   = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile]             = useState<File | null>(null);
  const [logoUploading, setLogoUploading]   = useState(false);
  const [logoMsg, setLogoMsg]               = useState('');
  const [logoUrlInput, setLogoUrlInput]     = useState('');
  const [logoUrlSaving, setLogoUrlSaving]   = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    titleBn: '', titleEn: '', organizationName: '', categoryId: '',
    postTypeId: '', district: '', qualification: '', description: '',
    applicationStart: '', applicationEnd: '', sourceUrl: '', vacancyCount: '', publish: false,
  });

  useEffect(() => {
    params.then(async ({ id: paramId }) => {
      const t = localStorage.getItem('admin_token');
      if (!t) { router.push('/admin/login'); return; }
      setToken(t);
      const numId = Number(paramId);
      setId(numId);

      const [ct, c, pt] = await Promise.all([getCategoryTypes(), getCategories(), getPostTypes()]);
      setCategoryTypes(ct); setCategories(c); setPostTypes(pt);

      // Load existing post data
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.jobradarbd.com'}/api/admin/posts/${numId}`,
        { headers: { Authorization: `Bearer ${t}` } },
      );
      if (res.ok) {
        const post: Post = await res.json();
        const fmt = (dt: string | null) => dt ? dt.slice(0, 16) : '';
        setForm({
          titleBn: post.titleBn ?? '',
          titleEn: post.titleEn,
          organizationName: post.organizationName ?? '',
          categoryId: String(post.category.id),
          postTypeId: post.postType ? String(post.postType.id) : '',
          district: post.district ?? '',
          qualification: post.qualification ?? '',
          description: post.description ?? '',
          applicationStart: fmt(post.applicationStart),
          applicationEnd: fmt(post.applicationEnd),
          sourceUrl: post.sourceUrl ?? '',
          vacancyCount: post.vacancyCount != null ? String(post.vacancyCount) : '',
          publish: post.publishedAt != null,
        });
        setExistingPdfUrl(post.circularPdfUrl ?? null);
        setExistingLogoUrl(post.organizationLogoUrl ?? null);
        setViewCount(post.viewCount ?? 0);
      }
      setLoading(false);
    });
  }, [params, router]);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await adminUpdatePost(id, {
        ...form,
        categoryId:   Number(form.categoryId),
        postTypeId:   form.postTypeId ? Number(form.postTypeId) : null,
        applicationStart: form.applicationStart || null,
        applicationEnd:   form.applicationEnd   || null,
        vacancyCount: form.vacancyCount ? Number(form.vacancyCount) : null,
      }, token);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'ত্রুটি হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setPdfUploading(true);
    setPdfMsg('');
    try {
      const updated = await adminUploadCircularPdf(id, pdfFile, token);
      setExistingPdfUrl(updated.circularPdfUrl ?? null);
      setPdfFile(null);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      setPdfMsg('PDF সফলভাবে আপলোড হয়েছে ✓');
    } catch {
      setPdfMsg('PDF আপলোড ব্যর্থ হয়েছে');
    } finally {
      setPdfUploading(false);
    }
  };

  const handleSetPdfUrl = async () => {
    if (!pdfUrlInput.trim()) return;
    setPdfUrlSaving(true);
    setPdfMsg('');
    try {
      const updated = await adminSetCircularPdfUrl(id, pdfUrlInput.trim(), token);
      setExistingPdfUrl(updated.circularPdfUrl ?? null);
      setPdfUrlInput('');
      setPdfMsg('PDF লিংক সংরক্ষণ হয়েছে ✓');
    } catch {
      setPdfMsg('PDF লিংক সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setPdfUrlSaving(false);
    }
  };

  const handlePdfDelete = async () => {
    if (!confirm('PDF বিজ্ঞপ্তি মুছে ফেলবেন?')) return;
    setPdfUploading(true);
    try {
      await adminDeleteCircularPdf(id, token);
      setExistingPdfUrl(null);
      setPdfMsg('PDF মুছে ফেলা হয়েছে');
    } catch {
      setPdfMsg('PDF মুছে ফেলা ব্যর্থ হয়েছে');
    } finally {
      setPdfUploading(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    setLogoMsg('');
    try {
      const updated = await adminUploadOrganizationLogo(id, logoFile, token);
      setExistingLogoUrl(updated.organizationLogoUrl ?? null);
      setLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      setLogoMsg('লোগো সফলভাবে আপলোড হয়েছে ✓');
    } catch {
      setLogoMsg('লোগো আপলোড ব্যর্থ হয়েছে');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSetLogoUrl = async () => {
    if (!logoUrlInput.trim()) return;
    setLogoUrlSaving(true);
    setLogoMsg('');
    try {
      const updated = await adminSetOrganizationLogoUrl(id, logoUrlInput.trim(), token);
      setExistingLogoUrl(updated.organizationLogoUrl ?? null);
      setLogoUrlInput('');
      setLogoMsg('লোগো লিংক সংরক্ষণ হয়েছে ✓');
    } catch {
      setLogoMsg('লোগো লিংক সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setLogoUrlSaving(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!confirm('প্রতিষ্ঠানের লোগো মুছে ফেলবেন?')) return;
    setLogoUploading(true);
    try {
      await adminDeleteOrganizationLogo(id, token);
      setExistingLogoUrl(null);
      setLogoMsg('লোগো মুছে ফেলা হয়েছে');
    } catch {
      setLogoMsg('লোগো মুছে ফেলা ব্যর্থ হয়েছে');
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center text-primary animate-pulse">
      লোড হচ্ছে...
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-primary-300 hover:text-white text-sm">← ড্যাশবোর্ড</Link>
        <h1 className="font-bold">বিজ্ঞপ্তি সম্পাদনা</h1>
        {viewCount > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs bg-violet-500/20 text-violet-200 border border-violet-400/30 px-3 py-1 rounded-full">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {viewCount.toLocaleString('bn-BD')} ভিউ
          </span>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Post form */}
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">শিরোনাম (বাংলা)</label>
              <input value={form.titleBn} onChange={(e) => set('titleBn', e.target.value)} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">শিরোনাম (English) *</label>
              <input value={form.titleEn} onChange={(e) => set('titleEn', e.target.value)} required className="input" />
            </div>
            <div>
              <label className="label">প্রতিষ্ঠান</label>
              <input value={form.organizationName} onChange={(e) => set('organizationName', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">জেলা</label>
              <input value={form.district} onChange={(e) => set('district', e.target.value)} className="input" />
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
              <label className="label">ধরন</label>
              <select value={form.postTypeId} onChange={(e) => set('postTypeId', e.target.value)} className="input">
                <option value="">ধরন বেছে নিন</option>
                {postTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.nameBn}{pt.nameEn ? ` / ${pt.nameEn}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="label">যোগ্যতা</label>
              <input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">শূন্যপদ সংখ্যা</label>
              <input value={form.vacancyCount} onChange={(e) => set('vacancyCount', e.target.value)} type="number" min="0" className="input" placeholder="যেমন: ৫০" />
            </div>
            <div>
              <label className="label">সোর্স লিংক</label>
              <input value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} type="url" className="input" />
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
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={6} className="input resize-none" />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-warm-border">
            <input type="checkbox" checked={form.publish} onChange={(e) => set('publish', e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium text-gray-700">প্রকাশিত রাখুন</span>
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
              {submitting ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট করুন'}
            </button>
            <Link href="/admin/dashboard" className="btn-outline px-6 py-3">বাতিল</Link>
          </div>
        </form>

        {/* PDF circular section */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-base">📄 PDF বিজ্ঞপ্তি</h2>

          {existingPdfUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-green-700 text-sm font-medium flex-1">PDF আপলোড করা আছে ✓</span>
                <a
                  href={existingPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  দেখুন
                </a>
              </div>
              <CopyUrlRow url={existingPdfUrl} />
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="label">নতুন PDF দিয়ে প্রতিস্থাপন করুন</span>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                    className="input"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePdfUpload}
                  disabled={!pdfFile || pdfUploading}
                  className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
                >
                  {pdfUploading ? 'আপলোড হচ্ছে...' : 'প্রতিস্থাপন করুন'}
                </button>
                <button
                  type="button"
                  onClick={handlePdfDelete}
                  disabled={pdfUploading}
                  className="btn-outline py-2 px-4 text-sm text-red-600 border-red-300 hover:bg-red-50"
                >
                  PDF মুছুন
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-warm-muted">কোনো PDF আপলোড করা নেই। সরকারি বিজ্ঞপ্তির মূল PDF আপলোড করুন।</p>
              <div>
                <label className="label">PDF ফাইল বেছে নিন</label>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={handlePdfUpload}
                disabled={!pdfFile || pdfUploading}
                className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
              >
                {pdfUploading ? 'আপলোড হচ্ছে...' : 'PDF আপলোড করুন'}
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-warm-border space-y-2">
            <label className="label">অথবা PDF এর সরাসরি লিংক দিন</label>
            <p className="text-xs text-warm-muted">একই PDF একাধিক পোস্টে ব্যবহার করতে চাইলে (যেমন বাল্ক তৈরি করা পোস্টগুলোর জন্য), আগে আপলোড করা একটি PDF এর লিংক এখানে পেস্ট করুন।</p>
            <div className="flex gap-2">
              <input
                value={pdfUrlInput}
                onChange={(e) => setPdfUrlInput(e.target.value)}
                type="url"
                placeholder="https://..."
                className="input flex-1"
              />
              <button
                type="button"
                onClick={handleSetPdfUrl}
                disabled={!pdfUrlInput.trim() || pdfUrlSaving}
                className="btn-primary py-2 px-4 text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {pdfUrlSaving ? 'সংরক্ষণ হচ্ছে...' : 'লিংক সংরক্ষণ করুন'}
              </button>
            </div>
          </div>

          {pdfMsg && (
            <p className={`text-sm ${pdfMsg.includes('✓') || pdfMsg.includes('মুছে') ? 'text-green-700' : 'text-red-600'}`}>
              {pdfMsg}
            </p>
          )}
        </div>

        {/* Organization logo section */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-base">🏢 প্রতিষ্ঠানের লোগো</h2>

          {existingLogoUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-green-200 shrink-0 relative">
                  <Image src={existingLogoUrl} alt="Logo" fill className="object-cover" unoptimized />
                </div>
                <span className="text-green-700 text-sm font-medium flex-1">লোগো আপলোড করা আছে ✓</span>
              </div>
              <CopyUrlRow url={existingLogoUrl} />
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="label">নতুন লোগো দিয়ে প্রতিস্থাপন করুন</span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    className="input"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  disabled={!logoFile || logoUploading}
                  className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
                >
                  {logoUploading ? 'আপলোড হচ্ছে...' : 'প্রতিস্থাপন করুন'}
                </button>
                <button
                  type="button"
                  onClick={handleLogoDelete}
                  disabled={logoUploading}
                  className="btn-outline py-2 px-4 text-sm text-red-600 border-red-300 hover:bg-red-50"
                >
                  লোগো মুছুন
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-warm-muted">কোনো লোগো আপলোড করা নেই। ফিচারড জব কার্ডে দেখানোর জন্য প্রতিষ্ঠানের লোগো আপলোড করুন।</p>
              <div>
                <label className="label">লোগো ফাইল বেছে নিন</label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  className="input"
                />
              </div>
              <button
                type="button"
                onClick={handleLogoUpload}
                disabled={!logoFile || logoUploading}
                className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
              >
                {logoUploading ? 'আপলোড হচ্ছে...' : 'লোগো আপলোড করুন'}
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-warm-border space-y-2">
            <label className="label">অথবা লোগোর সরাসরি লিংক দিন</label>
            <p className="text-xs text-warm-muted">একই প্রতিষ্ঠানের লোগো একাধিক পোস্টে ব্যবহার করতে চাইলে, আগে আপলোড করা একটি লোগোর লিংক এখানে পেস্ট করুন।</p>
            <div className="flex gap-2">
              <input
                value={logoUrlInput}
                onChange={(e) => setLogoUrlInput(e.target.value)}
                type="url"
                placeholder="https://..."
                className="input flex-1"
              />
              <button
                type="button"
                onClick={handleSetLogoUrl}
                disabled={!logoUrlInput.trim() || logoUrlSaving}
                className="btn-primary py-2 px-4 text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {logoUrlSaving ? 'সংরক্ষণ হচ্ছে...' : 'লিংক সংরক্ষণ করুন'}
              </button>
            </div>
          </div>

          {logoMsg && (
            <p className={`text-sm ${logoMsg.includes('✓') || logoMsg.includes('মুছে') ? 'text-green-700' : 'text-red-600'}`}>
              {logoMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
