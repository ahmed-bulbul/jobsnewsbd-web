'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  adminGetExamSets,
  adminCreateExamSet,
  adminUpdateExamSet,
  adminDeleteExamSet,
  adminGetQuestions,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminUploadImage,
  adminEnrollUser,
  adminUnenrollUser,
  getPaymentConfig,
  adminUpdatePaymentConfig,
  adminGetEnrollmentRequests,
  adminApproveEnrollmentRequest,
  adminRejectEnrollmentRequest,
} from '@/lib/api';
import type { EnrollmentRequest, ExamQuestion, ExamSet, PaymentConfig, PrepCategory, PrepCategoryDetail, PrepContent, PrepTopic } from '@/lib/types';

type Tab = 'categories' | 'topics' | 'content' | 'exam' | 'payment';

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

// ── Question editor sub-component ─────────────────────────────────────────────
function QuestionEditor({
  token,
  examSetId,
  onSaved,
  onCancel,
  editing,
}: {
  token: string;
  examSetId: number;
  onSaved: () => void;
  onCancel: () => void;
  editing: ExamQuestion | null;
}) {
  const [questionText, setQuestionText] = useState(editing?.questionText ?? '');
  const [optionA, setOptionA] = useState(editing?.optionA ?? '');
  const [optionB, setOptionB] = useState(editing?.optionB ?? '');
  const [optionC, setOptionC] = useState(editing?.optionC ?? '');
  const [optionD, setOptionD] = useState(editing?.optionD ?? '');
  const [correct, setCorrect] = useState(editing?.correctOption ?? 'A');
  const [expText, setExpText] = useState(editing?.explanationText ?? '');
  const [expImg, setExpImg] = useState(editing?.explanationImageUrl ?? '');
  const [order, setOrder] = useState(String(editing?.displayOrder ?? 0));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await adminUploadImage(token, file);
      setExpImg(url);
    } catch { /* ignore */ } finally { setUploading(false); }
  };

  const save = async () => {
    if (!questionText.trim() || !optionA || !optionB || !optionC || !optionD) return;
    setSaving(true);
    const body = { questionText, optionA, optionB, optionC, optionD, correctOption: correct, explanationText: expText || null, explanationImageUrl: expImg || null, displayOrder: Number(order) };
    try {
      if (editing) await adminUpdateQuestion(token, editing.id, body);
      else await adminCreateQuestion(token, examSetId, body);
      onSaved();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div className="bg-gray-50 border border-warm-border rounded-2xl p-4 space-y-3">
      <h3 className="font-bold text-gray-800 text-sm">{editing ? 'প্রশ্ন এডিট করুন' : 'নতুন প্রশ্ন'}</h3>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">প্রশ্ন *</label>
        <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3}
          className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
      </div>

      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
        const val = opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD;
        const set = opt === 'A' ? setOptionA : opt === 'B' ? setOptionB : opt === 'C' ? setOptionC : setOptionD;
        return (
          <div key={opt} className="flex items-center gap-2">
            <input type="radio" name="correct" value={opt} checked={correct === opt} onChange={() => setCorrect(opt)} className="accent-primary" />
            <span className="text-xs font-bold text-gray-500 w-5">{opt}.</span>
            <input type="text" value={val} onChange={(e) => set(e.target.value)} placeholder={`অপশন ${opt}`}
              className="flex-1 border border-warm-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
          </div>
        );
      })}
      <p className="text-xs text-warm-muted">রেডিও বাটন সিলেক্ট করে সঠিক উত্তর চিহ্নিত করুন</p>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">ব্যাখ্যা (টেক্সট)</label>
        <textarea value={expText} onChange={(e) => setExpText(e.target.value)} rows={2}
          className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">ব্যাখ্যার ছবি</label>
        {expImg && <img src={expImg} alt="" className="h-20 max-w-full rounded-lg mb-2 object-cover" />}
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="text-xs border border-warm-border rounded-lg px-3 py-1.5 hover:border-primary text-gray-600 disabled:opacity-50">
            {uploading ? 'আপলোড হচ্ছে...' : '📷 ছবি আপলোড'}
          </button>
          {expImg && <button type="button" onClick={() => setExpImg('')} className="text-xs text-red-500 hover:underline">সরান</button>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-600">ক্রম</label>
        <input type="number" value={order} onChange={(e) => setOrder(e.target.value)}
          className="w-20 border border-warm-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving}
          className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
          {saving ? 'সংরক্ষণ...' : editing ? 'আপডেট' : 'প্রশ্ন যোগ করুন'}
        </button>
        <button onClick={onCancel} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>
      </div>
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
  const [catEnrollmentType, setCatEnrollmentType] = useState<'FREE' | 'PAID'>('FREE');
  const [catPrice, setCatPrice] = useState('');
  const [catCurrency, setCatCurrency] = useState('BDT');
  const [catDescription, setCatDescription] = useState('');
  const [catContactPhone, setCatContactPhone] = useState('');

  // Enrollment management
  const [enrollCatId, setEnrollCatId] = useState<number | null>(null);
  const [enrollUserId, setEnrollUserId] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Payment config & requests
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ bkashNumber: '', rocketNumber: '' });
  const [paymentConfigSaving, setPaymentConfigSaving] = useState(false);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [requestsFilter, setRequestsFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [rejectNoteId, setRejectNoteId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState('');

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

  // Exam state
  const [examTopicId, setExamTopicId] = useState('');
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingSet, setEditingSet] = useState<ExamSet | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [examLoadingQ, setExamLoadingQ] = useState(false);
  // Exam set form fields
  const [setTitleBn, setSetTitleBn] = useState('');
  const [setDescBn, setSetDescBn] = useState('');
  const [setStartsAt, setSetStartsAt] = useState('');
  const [setEndsAt, setSetEndsAt] = useState('');
  const [setDuration, setSetDuration] = useState('30');
  const [setPublished, setSetPublished] = useState(false);

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
    getPaymentConfig().then(cfg => setPaymentConfig({ bkashNumber: cfg.bkashNumber ?? '', rocketNumber: cfg.rocketNumber ?? '' })).catch(() => {});
  }, [router, loadCategories, loadAllTopics]);

  const loadEnrollmentRequests = useCallback(async (t: string, filter: string) => {
    setRequestsLoading(true);
    try {
      const reqs = await adminGetEnrollmentRequests(t, filter === 'ALL' ? undefined : filter);
      setEnrollmentRequests(reqs);
    } catch { /* ignore */ } finally { setRequestsLoading(false); }
  }, []);

  const handleSavePaymentConfig = async () => {
    setPaymentConfigSaving(true);
    try {
      await adminUpdatePaymentConfig(token, paymentConfig.bkashNumber ?? '', paymentConfig.rocketNumber ?? '');
      flash('পেমেন্ট কনফিগ সংরক্ষিত');
    } catch { flash('সংরক্ষণ ব্যর্থ'); } finally { setPaymentConfigSaving(false); }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('অনুমোদন করবেন?')) return;
    try {
      await adminApproveEnrollmentRequest(token, id);
      flash('অনুমোদন হয়েছে');
      loadEnrollmentRequests(token, requestsFilter);
    } catch (e: unknown) { flash((e as Error).message || 'ব্যর্থ'); }
  };

  const handleReject = async (id: number) => {
    try {
      await adminRejectEnrollmentRequest(token, id, rejectNote || undefined);
      flash('বাতিল হয়েছে');
      setRejectNoteId(null);
      setRejectNote('');
      loadEnrollmentRequests(token, requestsFilter);
    } catch { flash('ব্যর্থ'); }
  };

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
    setCatEnrollmentType('FREE'); setCatPrice(''); setCatCurrency('BDT');
    setCatDescription(''); setCatContactPhone('');
  };

  const editCat = (c: PrepCategory) => {
    setCatId(c.id); setCatNameBn(c.nameBn); setCatNameEn(c.nameEn ?? '');
    setCatSlug(c.slug); setCatIcon(c.icon ?? ''); setCatColor(c.colorHex ?? '#1D4ED8');
    setCatOrder(String(c.displayOrder));
    setCatEnrollmentType(c.enrollmentType ?? 'FREE');
    setCatPrice(c.price != null ? String(c.price) : '');
    setCatCurrency(c.currency ?? 'BDT');
    setCatDescription(c.description ?? '');
    setCatContactPhone(c.contactPhone ?? '');
  };

  const saveCat = async () => {
    const body = {
      nameBn: catNameBn, nameEn: catNameEn, slug: catSlug, icon: catIcon,
      colorHex: catColor, displayOrder: Number(catOrder), active: true,
      enrollmentType: catEnrollmentType,
      price: catEnrollmentType === 'PAID' && catPrice ? Number(catPrice) : null,
      currency: catCurrency || 'BDT',
      description: catDescription || null,
      contactPhone: catContactPhone || null,
    };
    try {
      if (catId) await adminUpdatePrepCategory(token, catId, body);
      else await adminCreatePrepCategory(token, body);
      const cats = await loadCategories();
      await loadAllTopics(cats);
      resetCatForm();
      flash(catId ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const handleEnroll = async (categoryId: number, userId: number) => {
    setEnrollLoading(true);
    try {
      await adminEnrollUser(token, categoryId, userId);
      flash('ভর্তি সম্পন্ন হয়েছে');
      setEnrollUserId('');
    } catch { flash('ভর্তি ব্যর্থ হয়েছে'); }
    finally { setEnrollLoading(false); }
  };

  const handleUnenroll = async (categoryId: number, userId: number) => {
    if (!confirm(`User ID ${userId} কে বাদ দেবেন?`)) return;
    setEnrollLoading(true);
    try {
      await adminUnenrollUser(token, categoryId, userId);
      flash('বাদ দেওয়া হয়েছে');
      setEnrollUserId('');
    } catch { flash('বাদ দিতে ব্যর্থ'); }
    finally { setEnrollLoading(false); }
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

  // ── Exam actions ──────────────────────────────────────────────────────────

  const loadExamSets = async (topicId: string) => {
    if (!topicId) return;
    const sets = await adminGetExamSets(token, Number(topicId));
    setExamSets(sets);
    setActiveSetId(null);
    setQuestions([]);
  };

  const loadQuestions = async (setId: number) => {
    setExamLoadingQ(true);
    setActiveSetId(setId);
    try {
      const qs = await adminGetQuestions(token, setId);
      setQuestions(qs);
    } finally { setExamLoadingQ(false); }
  };

  const resetSetForm = () => {
    setEditingSet(null); setSetTitleBn(''); setSetDescBn('');
    setSetStartsAt(''); setSetEndsAt(''); setSetDuration('30'); setSetPublished(false);
  };

  const editSet = (s: ExamSet) => {
    setEditingSet(s); setSetTitleBn(s.titleBn); setSetDescBn(s.descriptionBn ?? '');
    setSetStartsAt(s.startsAt.slice(0, 16)); setSetEndsAt(s.endsAt.slice(0, 16));
    setSetDuration(String(s.durationMinutes)); setSetPublished(s.published);
  };

  const saveSet = async () => {
    if (!examTopicId || !setTitleBn || !setStartsAt || !setEndsAt) { flash('সব ঘর পূরণ করুন'); return; }
    const body = { topicId: Number(examTopicId), titleBn: setTitleBn, descriptionBn: setDescBn || null, startsAt: setStartsAt, endsAt: setEndsAt, durationMinutes: Number(setDuration), published: setPublished };
    try {
      if (editingSet) await adminUpdateExamSet(token, editingSet.id, body);
      else await adminCreateExamSet(token, body);
      await loadExamSets(examTopicId);
      resetSetForm();
      flash(editingSet ? 'আপডেট হয়েছে' : 'পরীক্ষা সেট তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteSet = async (id: number) => {
    if (!confirm('পরীক্ষা সেট মুছে ফেলবেন?')) return;
    try {
      await adminDeleteExamSet(token, id);
      await loadExamSets(examTopicId);
      if (activeSetId === id) { setActiveSetId(null); setQuestions([]); }
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
        <div className="flex gap-1 bg-white border border-warm-border rounded-xl p-1 mb-6 w-fit flex-wrap">
          {(['categories', 'topics', 'content', 'exam', 'payment'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === 'payment') loadEnrollmentRequests(token, requestsFilter);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'}`}
            >
              {t === 'categories' ? 'ক্যাটাগরি' : t === 'topics' ? 'বিষয়' : t === 'content' ? 'কন্টেন্ট' : t === 'exam' ? '📝 পরীক্ষা' : '💳 পেমেন্ট'}
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

              {/* Enrollment */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ভর্তির ধরন *</label>
                <select
                  value={catEnrollmentType}
                  onChange={(e) => setCatEnrollmentType(e.target.value as 'FREE' | 'PAID')}
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="FREE">বিনামূল্যে (FREE)</option>
                  <option value="PAID">পেইড (PAID)</option>
                </select>
              </div>

              {catEnrollmentType === 'PAID' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Field label="মূল্য" value={catPrice} onChange={setCatPrice} type="number" placeholder="0" />
                  </div>
                  <div className="w-24">
                    <Field label="মুদ্রা" value={catCurrency} onChange={setCatCurrency} placeholder="BDT" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">বিবরণ (Description)</label>
                <textarea
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  rows={3}
                  placeholder="কোর্সের সংক্ষিপ্ত বিবরণ..."
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <Field label="WhatsApp নম্বর (যোগাযোগ)" value={catContactPhone} onChange={setCatContactPhone} placeholder="+8801XXXXXXXXX" />

              <div className="flex gap-2 pt-1">
                <button onClick={saveCat} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                  {catId ? 'আপডেট' : 'তৈরি করুন'}
                </button>
                {catId > 0 && (
                  <button onClick={resetCatForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {categories.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-warm-border overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: c.colorHex ?? '#374151' }}>
                      {c.displayOrder}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{c.nameBn}</p>
                        {c.enrollmentType === 'PAID' ? (
                          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                            💰 {c.price != null ? `${c.price} ${c.currency}` : 'PAID'}
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">বিনামূল্যে</span>
                        )}
                      </div>
                      <p className="text-xs text-warm-muted">{c.slug}</p>
                    </div>
                    <button onClick={() => { setTab('topics'); loadCategoryTopics(c.slug); setTopicCatId(String(c.id)); }} className="text-xs text-primary hover:underline">বিষয় →</button>
                    {c.enrollmentType === 'PAID' && (
                      <button
                        onClick={() => setEnrollCatId(enrollCatId === c.id ? null : c.id)}
                        className="text-xs text-amber-600 hover:underline ml-2"
                      >ভর্তি</button>
                    )}
                    <button onClick={() => editCat(c)} className="text-xs text-blue-600 hover:underline ml-2">এডিট</button>
                    <button onClick={() => deleteCat(c.id)} className="text-xs text-red-500 hover:underline ml-2">মুছুন</button>
                  </div>

                  {/* Enrollment management panel for PAID categories */}
                  {enrollCatId === c.id && (
                    <div className="border-t border-warm-border bg-amber-50 p-4 space-y-3">
                      <p className="text-xs font-semibold text-amber-800">ব্যবহারকারী ভর্তি পরিচালনা — {c.nameBn}</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={enrollUserId}
                          onChange={(e) => setEnrollUserId(e.target.value)}
                          placeholder="User ID লিখুন"
                          className="flex-1 border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
                        />
                        <button
                          onClick={() => enrollUserId && handleEnroll(c.id, Number(enrollUserId))}
                          disabled={enrollLoading || !enrollUserId}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                          {enrollLoading ? '...' : 'ভর্তি করুন'}
                        </button>
                        <button
                          onClick={() => enrollUserId && handleUnenroll(c.id, Number(enrollUserId))}
                          disabled={enrollLoading || !enrollUserId}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          বাদ দিন
                        </button>
                      </div>
                      <p className="text-xs text-amber-700">
                        ব্যবহারকারীর ID প্রোফাইল থেকে দেখা যাবে। ID দিয়ে ভর্তি/বাদ দিন।
                      </p>
                    </div>
                  )}
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

        {/* ── Exam ───────────────────────────────────────────────────── */}
        {tab === 'exam' && (
          <div className="space-y-6">
            {/* Step 1: pick topic */}
            <div className="bg-white rounded-2xl border border-warm-border p-5">
              <h2 className="font-bold text-gray-900 mb-3">বিষয় বেছে নিন</h2>
              <TopicPicker allTopics={allTopics} categories={categories} value={examTopicId}
                onChange={(id) => { setExamTopicId(id); loadExamSets(id); resetSetForm(); }} />
            </div>

            {examTopicId && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exam set form */}
                <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3 h-fit">
                  <h2 className="font-bold text-gray-900">{editingSet ? 'সেট এডিট করুন' : 'নতুন পরীক্ষা সেট'}</h2>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">শিরোনাম (বাংলা) *</label>
                    <input type="text" value={setTitleBn} onChange={(e) => setSetTitleBn(e.target.value)}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">বিবরণ</label>
                    <textarea value={setDescBn} onChange={(e) => setSetDescBn(e.target.value)} rows={2}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">শুরু হবে *</label>
                    <input type="datetime-local" value={setStartsAt} onChange={(e) => setSetStartsAt(e.target.value)}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">শেষ হবে *</label>
                    <input type="datetime-local" value={setEndsAt} onChange={(e) => setSetEndsAt(e.target.value)}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">সময়সীমা (মিনিট) *</label>
                    <input type="number" value={setDuration} onChange={(e) => setSetDuration(e.target.value)} min="1"
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={setPublished} onChange={(e) => setSetPublished(e.target.checked)} className="rounded accent-primary w-4 h-4" />
                    <span className="font-medium text-gray-700">প্রকাশিত</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveSet} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                      {editingSet ? 'আপডেট' : 'তৈরি করুন'}
                    </button>
                    {editingSet && <button onClick={resetSetForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>}
                  </div>
                </div>

                {/* Exam set list + questions */}
                <div className="lg:col-span-2 space-y-4">
                  {examSets.length === 0 && <p className="text-sm text-warm-muted">কোনো পরীক্ষা সেট নেই</p>}
                  {examSets.map((s) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-warm-border overflow-hidden">
                      <div className="flex items-center gap-3 p-4 border-b border-warm-border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{s.titleBn}</span>
                            {s.published
                              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">প্রকাশিত</span>
                              : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">ড্রাফট</span>}
                          </div>
                          <p className="text-xs text-warm-muted mt-0.5">
                            {new Date(s.startsAt).toLocaleString('bn-BD')} – {new Date(s.endsAt).toLocaleString('bn-BD')} • {s.durationMinutes} মিনিট • {s.questionCount}টি প্রশ্ন • {s.totalAttempts} অ্যাটেম্প্ট
                          </p>
                        </div>
                        <button onClick={() => { editSet(s); window.scrollTo(0,0); }} className="text-xs text-blue-600 hover:underline">এডিট</button>
                        <button onClick={() => loadQuestions(s.id)} className="text-xs text-primary hover:underline ml-2">প্রশ্ন →</button>
                        <button onClick={() => deleteSet(s.id)} className="text-xs text-red-500 hover:underline ml-2">মুছুন</button>
                      </div>

                      {activeSetId === s.id && (
                        <div className="p-4 space-y-3">
                          {examLoadingQ ? (
                            <p className="text-xs text-warm-muted">লোড হচ্ছে...</p>
                          ) : (
                            <>
                              {questions.map((q, i) => (
                                <div key={q.id} className="bg-gray-50 rounded-xl p-3 border border-warm-border">
                                  {editingQuestion?.id === q.id ? (
                                    <QuestionEditor token={token} examSetId={s.id} editing={q}
                                      onSaved={async () => { await loadQuestions(s.id); setEditingQuestion(null); flash('প্রশ্ন আপডেট হয়েছে'); }}
                                      onCancel={() => setEditingQuestion(null)} />
                                  ) : (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold text-gray-500 mt-0.5 w-5">{i + 1}.</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 font-medium">{q.questionText}</p>
                                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                            const txt = opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
                                            return (
                                              <span key={opt} className={`text-xs px-2 py-0.5 rounded-lg ${q.correctOption === opt ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-600'}`}>
                                                {opt}. {txt}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 shrink-0">
                                        <button onClick={() => { setEditingQuestion(q); setShowQuestionEditor(false); }} className="text-xs text-blue-600 hover:underline">এডিট</button>
                                        <button onClick={async () => {
                                          if (!confirm('প্রশ্ন মুছে ফেলবেন?')) return;
                                          await adminDeleteQuestion(token, q.id);
                                          await loadQuestions(s.id);
                                          flash('মুছে ফেলা হয়েছে');
                                        }} className="text-xs text-red-500 hover:underline">মুছুন</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {showQuestionEditor && editingQuestion === null ? (
                                <QuestionEditor token={token} examSetId={s.id} editing={null}
                                  onSaved={async () => { await loadQuestions(s.id); setShowQuestionEditor(false); flash('প্রশ্ন যোগ হয়েছে'); }}
                                  onCancel={() => setShowQuestionEditor(false)} />
                              ) : editingQuestion === null && (
                                <button onClick={() => setShowQuestionEditor(true)}
                                  className="w-full border-2 border-dashed border-warm-border rounded-xl py-3 text-sm text-warm-muted hover:border-primary hover:text-primary transition-colors">
                                  + নতুন প্রশ্ন যোগ করুন
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Payment ────────────────────────────────────────────────── */}
        {tab === 'payment' && (
          <div className="space-y-6">
            {/* Payment config card */}
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4 max-w-md">
              <h2 className="font-bold text-gray-900">💳 পেমেন্ট নম্বর সেটআপ</h2>
              <p className="text-xs text-warm-muted">এই নম্বরে ব্যবহারকারীরা টাকা পাঠাবেন। সব ক্যাটাগরির জন্য একই নম্বর প্রযোজ্য।</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">bKash নম্বর</label>
                <input
                  type="text"
                  value={paymentConfig.bkashNumber ?? ''}
                  onChange={(e) => setPaymentConfig((p) => ({ ...p, bkashNumber: e.target.value }))}
                  placeholder="+8801XXXXXXXXX"
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rocket নম্বর</label>
                <input
                  type="text"
                  value={paymentConfig.rocketNumber ?? ''}
                  onChange={(e) => setPaymentConfig((p) => ({ ...p, rocketNumber: e.target.value }))}
                  placeholder="+8801XXXXXXXXX"
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleSavePaymentConfig}
                disabled={paymentConfigSaving}
                className="bg-primary text-white rounded-xl px-6 py-2 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {paymentConfigSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>

            {/* Enrollment requests */}
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-bold text-gray-900">ভর্তির আবেদনসমূহ</h2>
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setRequestsFilter(f); loadEnrollmentRequests(token, f); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${requestsFilter === f ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {f === 'PENDING' ? 'অপেক্ষমাণ' : f === 'APPROVED' ? 'অনুমোদিত' : f === 'REJECTED' ? 'বাতিল' : 'সব'}
                    </button>
                  ))}
                </div>
              </div>

              {requestsLoading ? (
                <p className="text-sm text-warm-muted py-4 text-center">লোড হচ্ছে...</p>
              ) : enrollmentRequests.length === 0 ? (
                <p className="text-sm text-warm-muted py-4 text-center">কোনো আবেদন নেই</p>
              ) : (
                <div className="space-y-3">
                  {enrollmentRequests.map((req) => (
                    <div key={req.id} className="border border-warm-border rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-3 flex-wrap">
                        {/* Method badge */}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${req.paymentMethod === 'BKASH' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                          {req.paymentMethod}
                        </span>
                        {/* Status badge */}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {req.status === 'PENDING' ? 'অপেক্ষমাণ' : req.status === 'APPROVED' ? 'অনুমোদিত' : 'বাতিল'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{req.userName} <span className="font-normal text-warm-muted text-xs">({req.userEmail})</span></p>
                          <p className="text-xs text-warm-muted">{req.categoryNameBn}{req.amount != null ? ` • ৳${req.amount}` : ''}</p>
                        </div>
                        <p className="text-xs text-warm-muted shrink-0">{new Date(req.createdAt).toLocaleString('bn-BD')}</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500">Transaction ID</p>
                        <p className="text-sm font-mono font-semibold text-gray-800">{req.transactionId}</p>
                      </div>

                      {req.adminNote && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">নোট: {req.adminNote}</p>
                      )}

                      {req.status === 'PENDING' && (
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="flex-1 bg-green-600 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-green-700 transition-colors"
                            >
                              অনুমোদন করুন
                            </button>
                            <button
                              onClick={() => setRejectNoteId(rejectNoteId === req.id ? null : req.id)}
                              className="flex-1 border border-red-300 text-red-600 rounded-lg py-1.5 text-xs font-semibold hover:bg-red-50 transition-colors"
                            >
                              বাতিল করুন
                            </button>
                          </div>
                          {rejectNoteId === req.id && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="বাতিলের কারণ (ঐচ্ছিক)"
                                className="flex-1 border border-warm-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-400"
                              />
                              <button
                                onClick={() => handleReject(req.id)}
                                className="px-4 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                              >
                                নিশ্চিত করুন
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
