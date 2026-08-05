'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminCreatePost, getCategoryTypes, getCategories, getPostTypes } from '@/lib/api';
import type { CategoryType, Category, PostType } from '@/lib/types';

type PostForm = {
  titleBn: string; titleEn: string; organizationName: string; categoryId: string;
  postTypeId: string; district: string; qualification: string; description: string;
  applicationStart: string; applicationEnd: string; sourceUrl: string; vacancyCount: string; publish: boolean;
};

// ── AI circular import: ONE prompt, ONE paste, ONE click ───────────────────
// Handles both cases with a single JSON schema: a circular with one post, or
// a circular where one organization/deadline covers many distinct positions
// (System Analyst, Maintenance Engineer, ...). The AI returns an object with
// the shared/organization-level fields plus a "positions" array (1 or many
// items) — this panel prefills those shared fields into the form above (so
// you can see/correct them) AND creates one Post per position in the same
// click. Also accepts a plain array or a bare single object for backward
// compatibility with the earlier two-step prompts.
type DraftPosition = {
  titleBn: string; titleEn?: string; qualification?: string;
  vacancyCount?: number | string | null; notes?: string;
};

function AiCircularImport({
  token,
  categories,
  postTypes,
  shared,
  onApplyShared,
  onDone,
}: {
  token: string;
  categories: Category[];
  postTypes: PostType[];
  shared: PostForm;
  onApplyShared: (fields: Partial<PostForm>) => void;
  onDone: (createdCount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const promptTemplate = () => {
    const catList = categories.map((c) => `${c.id} = ${c.nameBn}`).join(', ');
    const typeList = postTypes.map((pt) => `${pt.id} = ${pt.nameBn}${pt.nameEn ? ` / ${pt.nameEn}` : ''}`).join(', ');
    return `তুমি একজন সরকারি/বেসরকারি চাকরির বিজ্ঞপ্তি (সার্কুলার) থেকে তথ্য এক্সট্র্যাক্ট করার বিশেষজ্ঞ।

আমি এর পরের মেসেজে একটি চাকরির বিজ্ঞপ্তির টেক্সট অথবা ছবি/PDF দেব। এতে একটি মাত্র পদ থাকতে পারে, অথবা একই প্রতিষ্ঠান/একই আবেদনের তারিখে একাধিক আলাদা পদে (যেমন: সিস্টেম এনালিস্ট, মেইনটেনেন্স প্রকৌশলী ইত্যাদি) নিয়োগ থাকতে পারে। শুধুমাত্র নিচের ফরম্যাটে একটি JSON অবজেক্ট দাও — অন্য কোনো লেখা, ভূমিকা, ব্যাখ্যা বা \`\`\` কোড ফেন্স ছাড়া:

{
  "organizationName": "প্রতিষ্ঠানের নাম",
  "district": "কর্মস্থলের জেলা, না জানা থাকলে বা সারাদেশ হলে \\"All\\"",
  "description": "বিজ্ঞপ্তির সাধারণ তথ্য — স্মারক নং, আবেদন প্রক্রিয়া, ফি ইত্যাদি (সব পদের জন্য একই এমন তথ্য, সংক্ষেপে)",
  "applicationStart": "আবেদন শুরুর তারিখ, ফরম্যাট YYYY-MM-DDTHH:MM:SS, না জানা থাকলে null",
  "applicationEnd": "আবেদনের শেষ তারিখ, ফরম্যাট YYYY-MM-DDTHH:MM:SS, না জানা থাকলে null",
  "sourceUrl": "বিজ্ঞপ্তির অফিসিয়াল/আবেদন লিংক থাকলে দাও, না থাকলে null",
  "categoryId": "নিচের তালিকা থেকে সবচেয়ে উপযুক্ত বিভাগের সংখ্যা (id) বেছে দাও",
  "postTypeId": "নিচের তালিকা থেকে সবচেয়ে উপযুক্ত ধরনের সংখ্যা (id) বেছে দাও, নিশ্চিত না হলে null",
  "positions": [
    {
      "titleBn": "পদের নাম বাংলায় (যেমন: সিস্টেম এনালিস্ট)",
      "titleEn": "Post name in English (e.g. System Analyst)",
      "qualification": "এই পদের জন্য প্রয়োজনীয় শিক্ষাগত যোগ্যতা ও অভিজ্ঞতা (সংক্ষেপে)",
      "vacancyCount": "এই পদে শূন্যপদ সংখ্যা (number), না জানা থাকলে null",
      "notes": "গ্রেড, বেতনস্কেল, বয়সসীমা বা অন্য কোনো পদ-নির্দিষ্ট তথ্য (ঐচ্ছিক, না থাকলে খালি স্ট্রিং)"
    }
  ]
}

বিভাগ (categoryId) তালিকা: ${catList || '(কোনো বিভাগ পাওয়া যায়নি)'}
বিজ্ঞপ্তির ধরন (postTypeId) তালিকা: ${typeList || '(কোনো ধরন পাওয়া যায়নি)'}

নিয়ম:
- বিজ্ঞপ্তিতে যতগুলো আলাদা পদ আছে "positions"-এ ততগুলো আইটেম দাও (একটি পদ হলেও একটি আইটেমের অ্যারে দাও), একটিও বাদ দিও না।
- categoryId ও postTypeId অবশ্যই উপরের তালিকায় দেওয়া id সংখ্যাগুলোর একটি হতে হবে, নতুন কিছু বানিও না।
- titleEn না বুঝলে titleBn-এর ইংরেজি প্রতিবর্ণীকরণ বা অনুবাদ দাও, খালি রেখো না।
- তারিখ বুঝতে না পারলে null দাও, অনুমান করে ভুল তারিখ দিও না।
- আউটপুট শুধু JSON অবজেক্ট — কোনো ভূমিকা, উপসংহার বা কোড ব্লক মার্কার নয়।`;
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptTemplate());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
  };

  // Mirrors ai-poster/poster.py's sanitize_fields(): invalid ids are dropped
  // (fall back to whatever is already selected in the form) rather than
  // blocking everything, unparsable dates become empty, non-numeric vacancy
  // counts become empty.
  const toDatetimeLocal = (v: unknown): string => {
    if (typeof v !== 'string' || !v.trim()) return '';
    const s = v.trim();
    const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    if (m) return `${m[1]}T${m[2]}`;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 16);
    return '';
  };

  const runImport = async () => {
    setError('');
    setNotice('');

    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      setError('বৈধ JSON পাওয়া যায়নি — AI-এর আউটপুট আবার চেক করুন।');
      return;
    }

    // Accept: { ...shared, positions: [...] }, a bare positions array, or a
    // single bare position object — whatever shape the AI (or a previous
    // prompt version) produced.
    let data: Record<string, unknown> = {};
    let rawPositions: unknown;
    if (Array.isArray(parsed)) {
      rawPositions = parsed;
    } else if (parsed && typeof parsed === 'object') {
      data = parsed as Record<string, unknown>;
      rawPositions = Array.isArray(data.positions) ? data.positions : [data];
    } else {
      setError('বৈধ JSON অবজেক্ট/অ্যারে পাওয়া যায়নি।');
      return;
    }

    const positions = rawPositions as DraftPosition[];
    if (!Array.isArray(positions) || positions.length === 0) {
      setError('কোনো পদ (positions) পাওয়া যায়নি — AI-এর আউটপুট আবার চেক করুন।');
      return;
    }
    for (let i = 0; i < positions.length; i++) {
      if (typeof positions[i]?.titleBn !== 'string' || !positions[i].titleBn.trim()) {
        setError(`পদ ${i + 1}: titleBn খালি`);
        return;
      }
    }

    // Sanitize shared fields, falling back to whatever's already in the form
    // (e.g. the admin filled category manually) when the AI's value is
    // missing/invalid.
    const str = (k: string) => (typeof data[k] === 'string' ? (data[k] as string).trim() : '');
    const warnings: string[] = [];

    const organizationName = str('organizationName') || shared.organizationName;
    const district = str('district') || shared.district;
    const description = str('description') || shared.description;
    const sourceUrl = str('sourceUrl') || shared.sourceUrl;
    const applicationStart = toDatetimeLocal(data.applicationStart) || shared.applicationStart;
    const applicationEnd = toDatetimeLocal(data.applicationEnd) || shared.applicationEnd;

    let categoryId = shared.categoryId;
    const catId = data.categoryId != null ? Number(data.categoryId) : NaN;
    if (!isNaN(catId) && categories.some((c) => c.id === catId)) {
      categoryId = String(catId);
    } else if (!categoryId) {
      warnings.push('বিভাগ (categoryId) সনাক্ত করা যায়নি');
    }

    let postTypeId = shared.postTypeId;
    const typeId = data.postTypeId != null ? Number(data.postTypeId) : NaN;
    if (!isNaN(typeId) && postTypes.some((pt) => pt.id === typeId)) {
      postTypeId = String(typeId);
    }

    // Reflect the shared fields in the form above for transparency, even
    // though we use the local variables (not the async state) for the
    // create loop below.
    onApplyShared({ organizationName, district, description, sourceUrl, applicationStart, applicationEnd, categoryId, postTypeId });

    if (!categoryId) {
      setError('বিভাগ নির্ধারণ করা যায়নি — উপরের ফর্মে ম্যানুয়ালি বিভাগ বেছে নিয়ে আবার "তৈরি করুন" চাপুন।');
      return;
    }

    setBusy(true);
    setProgress({ done: 0, total: positions.length });
    let successCount = 0;
    for (let i = 0; i < positions.length; i++) {
      const it = positions[i];
      const titleBn = String(it.titleBn).trim();
      const titleEn = typeof it.titleEn === 'string' && it.titleEn.trim() ? it.titleEn.trim() : titleBn;
      const qualification = typeof it.qualification === 'string' ? it.qualification.trim() : '';
      const notes = typeof it.notes === 'string' ? it.notes.trim() : '';
      const vc = it.vacancyCount;
      const vacancyCount = typeof vc === 'number' && !isNaN(vc) ? vc
        : typeof vc === 'string' && vc.trim() && !isNaN(Number(vc)) ? Number(vc) : null;

      // Full per-post job description: the notice-level shared text, then a
      // paragraph specific to this position (vacancy count, grade/pay/age
      // via "notes", and the qualification requirements) so each post reads
      // as a complete description on its own.
      const positionParagraph = [
        vacancyCount != null ? `এই পদে ${vacancyCount}টি শূন্যপদ রয়েছে।` : '',
        notes ? `${notes}।` : '',
        qualification ? `প্রয়োজনীয় শিক্ষাগত যোগ্যতা ও অভিজ্ঞতা: ${qualification}` : '',
      ].filter(Boolean).join(' ');

      const body = {
        categoryId: Number(categoryId),
        postTypeId: postTypeId ? Number(postTypeId) : null,
        titleBn,
        titleEn,
        organizationName: organizationName || null,
        district: district || null,
        qualification,
        description: [description, positionParagraph].filter(Boolean).join('\n\n'),
        applicationStart: applicationStart || null,
        applicationEnd: applicationEnd || null,
        sourceUrl: sourceUrl || null,
        vacancyCount,
        publish: shared.publish,
      };
      try {
        await adminCreatePost(body, token);
        successCount++;
        setProgress({ done: i + 1, total: positions.length });
      } catch {
        setBusy(false);
        setError(`পদ ${i + 1} (${titleBn}) সংরক্ষণ ব্যর্থ হয়েছে — এর আগের ${successCount}টি পোস্ট ঠিকভাবে তৈরি হয়েছে, ড্যাশবোর্ড থেকে বাকিগুলো আলাদাভাবে যোগ করুন।`);
        if (successCount > 0) onDone(successCount);
        return;
      }
    }
    setBusy(false);
    setProgress(null);
    setRaw('');
    if (warnings.length > 0) setNotice(`${successCount}টি পোস্ট তৈরি হয়েছে, তবে যাচাই করুন: ${warnings.join('; ')}`);
    onDone(successCount);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-primary-200 bg-primary-50/60 rounded-xl py-2.5 text-sm text-primary font-semibold hover:bg-primary-50 transition-colors">
        ✨ AI দিয়ে সার্কুলার থেকে পোস্ট তৈরি করুন (এক বা একাধিক পদ)
      </button>
    );
  }

  return (
    <div className="bg-primary-50/40 border border-primary-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">✨ AI দিয়ে সার্কুলার থেকে পোস্ট তৈরি করুন</h3>
        <button type="button" onClick={() => { setOpen(false); setRaw(''); setError(''); setNotice(''); }}
          className="text-xs text-warm-muted hover:text-gray-700">বন্ধ করুন</button>
      </div>

      <p className="text-xs text-warm-muted leading-relaxed">
        ১) প্রম্পট কপি করুন → ২) যেকোনো AI চ্যাটে (ChatGPT/Claude/Gemini) পেস্ট করে বিজ্ঞপ্তির টেক্সট বা ছবি/PDF যোগ করুন → ৩) AI-এর JSON আউটপুট নিচে পেস্ট করে একবারে সব পোস্ট তৈরি করুন — একটি পদ হলে একটি পোস্ট, একাধিক পদ হলে প্রতিটির জন্য আলাদা পোস্ট। সবগুলো ড্রাফট/প্রকাশ অবস্থা উপরের "এখনই প্রকাশ করুন" চেকবক্স অনুযায়ী তৈরি হবে। এরপর PDF প্রতিটি পোস্টে আলাদাভাবে সম্পাদনা পৃষ্ঠা থেকে যুক্ত করতে হবে।
      </p>

      <button type="button" onClick={copyPrompt}
        className="w-full px-3 py-2 text-xs font-semibold border border-primary-300 text-primary rounded-lg hover:bg-primary-50">
        {copied ? '✓ কপি হয়েছে' : '📋 প্রম্পট কপি করুন'}
      </button>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">AI-এর JSON আউটপুট এখানে পেস্ট করুন</label>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8}
          placeholder='{"organizationName": "...", "categoryId": 3, "positions": [{"titleBn": "...", "titleEn": "...", "vacancyCount": 1, ...}]}'
          className="w-full border border-warm-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary resize-y" />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {notice && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{notice}</p>}
      {progress && <p className="text-xs text-primary font-medium">{progress.done}/{progress.total} পোস্ট তৈরি হয়েছে...</p>}

      <button type="button" onClick={runImport} disabled={busy || !raw.trim()}
        className="w-full bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
        {busy ? 'তৈরি হচ্ছে...' : 'সব পোস্ট এক ক্লিকে তৈরি করুন'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function NewPostPage() {
  const router = useRouter();
  const [token, setToken]         = useState('');
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [postTypes, setPostTypes]         = useState<PostType[]>([]);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');
  const [bulkDone, setBulkDone]           = useState<number | null>(null);

  const [form, setForm] = useState<PostForm>({
    titleBn: '', titleEn: '', organizationName: '', categoryId: '',
    postTypeId: '', district: '', qualification: '', description: '',
    applicationStart: '', applicationEnd: '', sourceUrl: '', vacancyCount: '', publish: false,
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

        {bulkDone !== null && (
          <div className="mb-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl px-4 py-3 text-sm">
            ✅ {bulkDone}টি পোস্ট তৈরি হয়েছে। <Link href="/admin/dashboard" className="underline font-semibold">ড্যাশবোর্ডে দেখুন</Link>
          </div>
        )}

        <div className="mb-6">
          <AiCircularImport
            token={token}
            categories={categories}
            postTypes={postTypes}
            shared={form}
            onApplyShared={(fields) => setForm((prev) => ({ ...prev, ...fields }))}
            onDone={(count) => setBulkDone(count)}
          />
        </div>

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
                {postTypes.map((pt) => <option key={pt.id} value={pt.id}>{pt.nameBn}{pt.nameEn ? ` / ${pt.nameEn}` : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="label">যোগ্যতা</label>
              <input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} className="input" placeholder="যেমন: স্নাতক" />
            </div>
            <div>
              <label className="label">শূন্যপদ সংখ্যা</label>
              <input value={form.vacancyCount} onChange={(e) => set('vacancyCount', e.target.value)} type="number" min="0" className="input" placeholder="যেমন: ৫০" />
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
