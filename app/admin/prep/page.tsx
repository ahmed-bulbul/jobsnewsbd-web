'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/ui/RichTextEditor';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Tabs from '@/components/admin/Tabs';
import {
  getPrepCategories,
  getPrepCategory,
  adminCreatePrepCategory,
  adminUpdatePrepCategory,
  adminDeletePrepCategory,
  adminGetPrepCategoryGroups,
  adminCreatePrepCategoryGroup,
  adminUpdatePrepCategoryGroup,
  adminDeletePrepCategoryGroup,
  adminCreatePrepTopic,
  adminUpdatePrepTopic,
  adminDeletePrepTopic,
  adminGetPrepContent,
  adminCreatePrepContent,
  adminUpdatePrepContent,
  adminDeletePrepContent,
  adminUploadPrepContentPdf,
  adminDeletePrepContentPdf,
  adminGetExamSets,
  adminCreateExamSet,
  adminUpdateExamSet,
  adminDeleteExamSet,
  adminGetQuestions,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminGetExamAttempts,
  adminUploadImage,
  adminEnrollUser,
  adminUnenrollUser,
  getPaymentConfig,
  adminUpdatePaymentConfig,
  adminGetEnrollmentRequests,
  adminApproveEnrollmentRequest,
  adminRejectEnrollmentRequest,
  adminGetRoutineForCategory,
  adminCreateRoutineEntry,
  adminUpdateRoutineEntry,
  adminDeleteRoutineEntry,
} from '@/lib/api';
import type { AdminExamAttempt, EnrollmentRequest, ExamQuestion, ExamRoutineEntry, ExamSet, PaymentConfig, PrepCategory, PrepCategoryDetail, PrepCategoryGroup, PrepContent, PrepTopic } from '@/lib/types';

type Tab = 'categories' | 'topics' | 'content' | 'exam' | 'routine' | 'payment';

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

  // Keep the category field in sync if a topic is already selected (e.g.
  // editing) or gets selected some other way — so it never shows "সব
  // ক্যাটাগরি" while a topic from a specific category is actually chosen.
  useEffect(() => {
    if (!value) return;
    const t = allTopics.find((t) => String(t.id) === value);
    if (t) setCatFilter(String(t.categoryId));
  }, [value, allTopics]);

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

  // Category comes first: picking a new category that doesn't contain the
  // currently selected topic clears the topic, so the two fields never fall
  // out of sync with each other.
  const handleCategoryChange = (newCatId: string) => {
    setCatFilter(newCatId);
    if (selected && String(selected.categoryId) !== newCatId) {
      onChange('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Step 1: category — always visible, never hidden inside the topic dropdown */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">ক্যাটাগরি *</label>
        <select
          value={catFilter}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
        >
          <option value="">সব ক্যাটাগরি</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nameBn}</option>
          ))}
        </select>
      </div>

      {/* Step 2: topic — filtered by the category chosen above */}
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
            {/* Search only — category is already chosen above */}
            <div className="p-2 border-b border-warm-border bg-gray-50">
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
                <p className="text-center text-xs text-warm-muted py-4">
                  কোনো বিষয় পাওয়া যায়নি{catFilter ? ' — অন্য ক্যাটাগরি বেছে দেখুন' : ''}
                </p>
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

// ── Bulk-import questions from an AI-generated JSON payload ──────────────────
// Workflow: admin picks a topic + copies a ready-made prompt → pastes it into
// any AI chat (ChatGPT/Claude/Gemini) → pastes the AI's JSON array back here →
// one click posts every question via the existing single-create endpoint.
function BulkQuestionImport({
  token,
  examSetId,
  existingCount,
  onDone,
}: {
  token: string;
  examSetId: number;
  existingCount: number;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [topicHint, setTopicHint] = useState('');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const promptTemplate = (topic: string) => `তুমি একজন পরীক্ষা প্রস্তুতি প্রশ্ন তৈরিকারী। বিষয়: ${topic ? `"${topic}"` : '[বিষয়ের নাম এখানে লিখুন]'} — এই বিষয়ে ৩০টি মাল্টিপল চয়েস (MCQ) প্রশ্ন তৈরি করো, বাংলাদেশি চাকরির পরীক্ষার (BCS/ব্যাংক/সরকারি চাকরি) সবচেয়ে কঠিন লেভেলের প্রশ্নের মানে — সহজ বা মৌলিক প্রশ্ন নয়, এমন প্রশ্ন যা একজন ভালো প্রস্তুতি নেওয়া পরীক্ষার্থীকেও ভাবিয়ে তুলবে।

শুধুমাত্র নিচের ফরম্যাটে একটি JSON অ্যারে দাও — অন্য কোনো লেখা, ভূমিকা, ব্যাখ্যা বা \`\`\` কোড ফেন্স ছাড়া:

[
  {
    "questionText": "প্রশ্নের লেখা",
    "optionA": "অপশন ১",
    "optionB": "অপশন ২",
    "optionC": "অপশন ৩",
    "optionD": "অপশন ৪",
    "correctOption": "A",
    "explanationText": "সংক্ষিপ্ত ব্যাখ্যা (ঐচ্ছিক)"
  }
]

নিয়ম:
- মোট প্রশ্ন সংখ্যা অবশ্যই ৩০টি।
- কঠিনতা: প্রতিটি প্রশ্ন কঠিন ও চিন্তা-উদ্রেককারী হতে হবে — সরাসরি মুখস্থ তথ্যের বদলে বিশ্লেষণ, তুলনা, ব্যতিক্রম বা কম-পরিচিত খুঁটিনাটির উপর ভিত্তি করে প্রশ্ন করো।
- correctOption অবশ্যই "A", "B", "C" অথবা "D" এর একটি হতে হবে (সঠিক উত্তরের অক্ষর, একেবারে ক্যাপিটাল)।
- সঠিক উত্তরের অবস্থান (A/B/C/D) সম্পূর্ণ এলোমেলোভাবে (randomly shuffled) বণ্টন করো — ৩০টি প্রশ্নের মধ্যে প্রতিটি অক্ষর (A, B, C, D) মোটামুটি সমানসংখ্যক বার (প্রায় ৭-৮টি করে) সঠিক উত্তর হবে, কিন্তু ধারাবাহিকভাবে একই অক্ষর বা কোনো অনুমানযোগ্য প্যাটার্নে (যেমন A,B,C,D,A,B,C,D...) বসাবে না — সম্পূর্ণ র‍্যান্ডম ক্রমে বসাও, যাতে উত্তরের প্যাটার্ন দেখে কেউ অনুমান করতে না পারে।
- প্রতিটি প্রশ্নের চারটি অপশনই একে অপরের কাছাকাছি ও বাস্তবসম্মত হতে হবে — ভুল অপশনগুলো (distractors) এমনভাবে লেখো যাতে পরীক্ষার্থী প্রতিটি অপশন নিয়েই দ্বিধায় পড়ে ও ভাবতে বাধ্য হয়; কোনো অপশন যেন দেখেই সহজে বাদ দেওয়া না যায় (অতিরিক্ত অবাস্তব, অপ্রাসঙ্গিক, বা স্পষ্টতই ভুল অপশন দেওয়া যাবে না)।
- explanationText না দিতে চাইলে খালি স্ট্রিং দাও।
- আউটপুট শুধু JSON অ্যারে — কোনো ভূমিকা, উপসংহার বা কোড ব্লক মার্কার নয়। আউটপুট দেওয়ার আগে যাচাই করো এটি সরাসরি JSON.parse() দিয়ে পার্স করা যাবে (কোনো ট্রেইলিং কমা বা আনক্লোজড কোট থাকবে না)।`;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptTemplate(topicHint));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
  };

  const parseQuestions = (): Array<Record<string, unknown>> | null => {
    // AI output sometimes still comes wrapped in ```json fences despite instructions — strip them.
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
      const data = JSON.parse(cleaned);
      return Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  };

  const submitAll = async () => {
    setError('');
    const items = parseQuestions();
    if (!items || items.length === 0) {
      setError('বৈধ JSON অ্যারে পাওয়া যায়নি — AI-এর আউটপুট আবার চেক করুন।');
      return;
    }

    // Validate every item's shape before posting anything.
    for (let i = 0; i < items.length; i++) {
      const it = items[i] as Record<string, unknown>;
      const missing = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption']
        .filter((k) => typeof it[k] !== 'string' || !(it[k] as string).trim());
      if (missing.length > 0) {
        setError(`প্রশ্ন ${i + 1}: এই ফিল্ডগুলো নেই বা খালি — ${missing.join(', ')}`);
        return;
      }
      if (!['A', 'B', 'C', 'D'].includes((it.correctOption as string).trim().toUpperCase())) {
        setError(`প্রশ্ন ${i + 1}: correctOption অবশ্যই A/B/C/D এর একটি হতে হবে`);
        return;
      }
    }

    setBusy(true);
    setProgress({ done: 0, total: items.length });
    let successCount = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i] as Record<string, unknown>;
      const body = {
        questionText: String(it.questionText).trim(),
        optionA: String(it.optionA).trim(),
        optionB: String(it.optionB).trim(),
        optionC: String(it.optionC).trim(),
        optionD: String(it.optionD).trim(),
        correctOption: String(it.correctOption).trim().toUpperCase(),
        explanationText: it.explanationText ? String(it.explanationText).trim() : null,
        explanationImageUrl: it.explanationImageUrl ? String(it.explanationImageUrl).trim() : null,
        displayOrder: existingCount + i,
      };
      try {
        await adminCreateQuestion(token, examSetId, body);
        successCount++;
        setProgress({ done: i + 1, total: items.length });
      } catch {
        setBusy(false);
        setError(`প্রশ্ন ${i + 1} সংরক্ষণ ব্যর্থ হয়েছে — এর আগের ${successCount}টি ঠিকভাবে যোগ হয়েছে, বাকিগুলো আবার চেষ্টা করুন।`);
        if (successCount > 0) onDone();
        return;
      }
    }
    setBusy(false);
    setProgress(null);
    setRaw('');
    onDone();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-primary-200 bg-primary-50/60 rounded-xl py-2.5 text-sm text-primary font-semibold hover:bg-primary-50 transition-colors">
        ✨ AI দিয়ে বাল্ক প্রশ্ন যোগ করুন
      </button>
    );
  }

  return (
    <div className="bg-primary-50/40 border border-primary-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">✨ AI দিয়ে বাল্ক প্রশ্ন যোগ করুন</h3>
        <button onClick={() => { setOpen(false); setRaw(''); setError(''); }} className="text-xs text-warm-muted hover:text-gray-700">বন্ধ করুন</button>
      </div>

      <p className="text-xs text-warm-muted leading-relaxed">
        ১) বিষয় লিখে প্রম্পট কপি করুন → ২) যেকোনো AI চ্যাটে (ChatGPT/Claude/Gemini) পেস্ট করুন → ৩) AI-এর JSON আউটপুট নিচে পেস্ট করে একবারে সব প্রশ্ন যোগ করুন।
      </p>

      <div className="flex gap-2">
        <input type="text" value={topicHint} onChange={(e) => setTopicHint(e.target.value)}
          placeholder="বিষয় (যেমন: কম্পিউটার অর্গানাইজেশন ও আর্কিটেকচার)"
          className="flex-1 border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        <button type="button" onClick={copyPrompt}
          className="shrink-0 px-3 py-2 text-xs font-semibold border border-primary-300 text-primary rounded-lg hover:bg-primary-50">
          {copied ? '✓ কপি হয়েছে' : '📋 প্রম্পট কপি করুন'}
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">AI-এর JSON আউটপুট এখানে পেস্ট করুন</label>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8}
          placeholder='[{"questionText": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctOption": "A"}]'
          className="w-full border border-warm-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary resize-y" />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {progress && <p className="text-xs text-primary font-medium">{progress.done}/{progress.total} প্রশ্ন যোগ হয়েছে...</p>}

      <button onClick={submitAll} disabled={busy || !raw.trim()}
        className="w-full bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50">
        {busy ? 'যোগ হচ্ছে...' : 'সব প্রশ্ন এক ক্লিকে যোগ করুন'}
      </button>
    </div>
  );
}

// ── AI study-resource prompt (study guide + YouTube suggestions) ────────────
// Doesn't create anything itself — just gives the admin a ready-made prompt.
// The AI's plain-text reply is meant to be split by hand into the existing
// content types: the study-guide paragraph goes into a "POST" content's body,
// and each suggested video into its own "VIDEO" content (title + a YouTube
// link the admin finds/confirms — the AI shouldn't be trusted to invent a
// real video URL, only a suggested title/search term).
function StudyResourcePrompt({ defaultTopic }: { defaultTopic: string }) {
  const [topic, setTopic] = useState(defaultTopic);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setTopic(defaultTopic); }, [defaultTopic]);

  const template = (t: string) => `তুমি একজন পরীক্ষা প্রস্তুতি স্টাডি-গাইড লেখক। বিষয়: ${t ? `"${t}"` : '[বিষয়ের নাম এখানে লিখুন]'}

নিচের দুইটি অংশ প্লেইন বাংলা টেক্সটে দাও (JSON নয়, কোনো কোড ফেন্স নয়):

১) "স্টাডি গাইড" — এই বিষয়টি কীভাবে দ্রুত ও কার্যকরভাবে পড়া/আয়ত্ত করা যায় তার উপর ৫-৮ বাক্যের একটি সংক্ষিপ্ত, বাস্তবসম্মত গাইড (গুরুত্বপূর্ণ সাব-টপিক, কমন ভুল, মনে রাখার কৌশল)।

২) "ভিডিও সাজেশন" — এই বিষয়ে পড়াশোনার জন্য উপযোগী ৩-৫টি সুপরিচিত বাংলা/ইংরেজি ইউটিউব চ্যানেল বা ভিডিওর নাম/সার্চ-টার্ম বুলেট আকারে দাও (যেমন: "10 Minute School - [বিষয়]", "[বিষয়] বেসিক টিউটোরিয়াল")। সরাসরি ইউটিউব লিংক বানিয়ে দিও না — শুধু নাম/সার্চ-টার্ম দাও, কারণ আমি নিজে ইউটিউবে খুঁজে সঠিক লিংক বসাব।`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(template(topic));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
  };

  return (
    <div className="mt-4 pt-4 border-t border-warm-border space-y-2">
      <h4 className="font-bold text-gray-800 text-sm">✨ AI দিয়ে স্টাডি রিসোর্স আইডিয়া নিন</h4>
      <p className="text-xs text-warm-muted leading-relaxed">
        একটি প্রম্পট কপি করে যেকোনো AI চ্যাটে পেস্ট করুন → স্টাডি গাইড ও ভিডিও সাজেশন পাবেন → গাইডটি একটি নতুন &quot;আর্টিকেল&quot; কন্টেন্টের বডিতে বসান, আর প্রতিটি ভিডিও সাজেশনের জন্য ইউটিউবে খুঁজে আসল লিংক দিয়ে একটি &quot;ভিডিও&quot; কন্টেন্ট তৈরি করুন।
      </p>
      <div className="flex gap-2">
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="বিষয়ের নাম"
          className="flex-1 border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        <button type="button" onClick={copy}
          className="shrink-0 px-3 py-2 text-xs font-semibold border border-primary-300 text-primary rounded-lg hover:bg-primary-50">
          {copied ? '✓ কপি হয়েছে' : '📋 প্রম্পট কপি করুন'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPrepPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
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
  const [catFacebookGroupUrl, setCatFacebookGroupUrl] = useState('');
  const [catFacebookPageUrl, setCatFacebookPageUrl] = useState('');
  const [catWhatsappGroupUrl, setCatWhatsappGroupUrl] = useState('');
  const [catGroupId, setCatGroupId] = useState('');

  // Parent category groups (IT / BCS / General)
  const [groups, setGroups] = useState<PrepCategoryGroup[]>([]);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [groupEditId, setGroupEditId] = useState(0);
  const [groupNameBn, setGroupNameBn] = useState('');
  const [groupNameEn, setGroupNameEn] = useState('');
  const [groupSlug, setGroupSlug] = useState('');
  const [groupIcon, setGroupIcon] = useState('');
  const [groupColor, setGroupColor] = useState('#1D4ED8');
  const [groupOrder, setGroupOrder] = useState('0');

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
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfCopied, setPdfCopied] = useState(false);
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const [topicContents, setTopicContents] = useState<PrepContent[]>([]);
  const [contentsLoading, setContentsLoading] = useState(false);

  // Exam state
  const [examTopicId, setExamTopicId] = useState('');
  const [examSets, setExamSets] = useState<ExamSet[]>([]);
  const [activeSetId, setActiveSetId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingSet, setEditingSet] = useState<ExamSet | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [examLoadingQ, setExamLoadingQ] = useState(false);
  // Marks sheet state
  const [marksSetId, setMarksSetId] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<AdminExamAttempt[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksDownloading, setMarksDownloading] = useState(false);
  // Exam set form fields
  const [setTitleBn, setSetTitleBn] = useState('');
  const [setDescBn, setSetDescBn] = useState('');
  const [setStartsAt, setSetStartsAt] = useState('');
  const [setEndsAt, setSetEndsAt] = useState('');
  const [setDuration, setSetDuration] = useState('30');
  const [setPublished, setSetPublished] = useState(false);
  const [setNegativeMarkingEnabled, setSetNegativeMarkingEnabled] = useState(false);
  const [setNegativeMarks, setSetNegativeMarks] = useState('0');

  // Exam routine state
  const [routineCatId, setRoutineCatId] = useState('');
  const [routineEntries, setRoutineEntries] = useState<ExamRoutineEntry[]>([]);
  const [routineLoading, setRoutineLoading] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<ExamRoutineEntry | null>(null);
  const [routineTopicId, setRoutineTopicId] = useState('');
  const [routineExamSetId, setRoutineExamSetId] = useState('');
  const [routineExamSets, setRoutineExamSets] = useState<ExamSet[]>([]);
  const [routineTitleBn, setRoutineTitleBn] = useState('');
  const [routineTitleEn, setRoutineTitleEn] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineLocation, setRoutineLocation] = useState('');
  const [routineScheduledAt, setRoutineScheduledAt] = useState('');
  const [routineOrder, setRoutineOrder] = useState('0');
  const [routinePublished, setRoutinePublished] = useState(true);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadCategories = useCallback(async () => {
    const cats = await getPrepCategories();
    setCategories(cats);
    return cats;
  }, []);

  const loadGroups = useCallback(async (t: string) => {
    const gs = await adminGetPrepCategoryGroups(t);
    setGroups(gs);
    return gs;
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
    const n = localStorage.getItem('admin_name');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    setAdminName(n ?? 'Admin');
    loadCategories()
      .then((cats) => loadAllTopics(cats))
      .finally(() => setLoading(false));
    loadGroups(t).catch(() => {});
    getPaymentConfig().then(cfg => setPaymentConfig({ bkashNumber: cfg.bkashNumber ?? '', rocketNumber: cfg.rocketNumber ?? '' })).catch(() => {});
  }, [router, loadCategories, loadAllTopics, loadGroups]);

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
    setCatFacebookGroupUrl(''); setCatFacebookPageUrl(''); setCatWhatsappGroupUrl('');
    setCatGroupId('');
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
    setCatFacebookGroupUrl(c.facebookGroupUrl ?? '');
    setCatFacebookPageUrl(c.facebookPageUrl ?? '');
    setCatWhatsappGroupUrl(c.whatsappGroupUrl ?? '');
    setCatGroupId(c.groupId != null ? String(c.groupId) : '');
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
      facebookGroupUrl: catFacebookGroupUrl || null,
      facebookPageUrl: catFacebookPageUrl || null,
      whatsappGroupUrl: catWhatsappGroupUrl || null,
      groupId: catGroupId ? Number(catGroupId) : null,
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

  // ── Parent category group actions ─────────────────────────────────────────

  const resetGroupForm = () => {
    setGroupEditId(0); setGroupNameBn(''); setGroupNameEn('');
    setGroupSlug(''); setGroupIcon(''); setGroupColor('#1D4ED8'); setGroupOrder('0');
  };

  const editGroup = (g: PrepCategoryGroup) => {
    setGroupEditId(g.id); setGroupNameBn(g.nameBn); setGroupNameEn(g.nameEn ?? '');
    setGroupSlug(g.slug); setGroupIcon(g.icon ?? ''); setGroupColor(g.colorHex ?? '#1D4ED8');
    setGroupOrder(String(g.displayOrder));
  };

  const saveGroup = async () => {
    const body = {
      nameBn: groupNameBn, nameEn: groupNameEn, slug: groupSlug,
      icon: groupIcon, colorHex: groupColor, displayOrder: Number(groupOrder),
    };
    try {
      if (groupEditId) await adminUpdatePrepCategoryGroup(token, groupEditId, body);
      else await adminCreatePrepCategoryGroup(token, body);
      await loadGroups(token);
      resetGroupForm();
      flash(groupEditId ? 'প্যারেন্ট ক্যাটাগরি আপডেট হয়েছে' : 'প্যারেন্ট ক্যাটাগরি তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('মুছে ফেলবেন?')) return;
    try {
      await adminDeletePrepCategoryGroup(token, id);
      await loadGroups(token);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ — এতে এখনো ক্যাটাগরি যুক্ত থাকতে পারে'); }
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

  // Deliberately does NOT clear contentTopicId — it's only ever called after
  // a successful save, and keeping the topic selected lets the admin
  // immediately see the just-saved item in the list below and add another
  // one to the same topic without re-picking it every time.
  const resetContentForm = () => {
    setContentId(0); setContentTitle('');
    setContentType('VIDEO'); setContentUrl(''); setContentBody('');
    setContentOrder('0'); setContentPublished(false);
  };

  const editContent = (c: PrepContent) => {
    setContentId(c.id); setContentTopicId(String(c.topicId));
    setContentTitle(c.title); setContentType(c.contentType);
    setContentUrl(c.contentUrl ?? ''); setContentBody(c.body ?? '');
    setContentOrder(String(c.displayOrder)); setContentPublished(c.published ?? false);
    window.scrollTo(0, 0);
  };

  const loadTopicContents = async (topicId: string) => {
    if (!topicId) { setTopicContents([]); return; }
    setContentsLoading(true);
    try {
      const list = await adminGetPrepContent(token, Number(topicId));
      setTopicContents(list);
    } catch { /* ignore */ } finally { setContentsLoading(false); }
  };

  const saveContent = async () => {
    if (!contentTopicId) { flash('বিষয় বেছে নিন'); return; }
    const body = { topicId: Number(contentTopicId), title: contentTitle, contentType, contentUrl: contentUrl || null, body: contentBody || null, durationSeconds: null, displayOrder: Number(contentOrder), published: contentPublished };
    try {
      if (contentId) await adminUpdatePrepContent(token, contentId, body);
      else await adminCreatePrepContent(token, body);
      const savedTopicId = contentTopicId;
      resetContentForm();
      await loadTopicContents(savedTopicId);
      flash(contentId ? 'আপডেট হয়েছে' : 'তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteContent = async (id: number) => {
    if (!confirm('মুছে ফেলবেন?')) return;
    try {
      await adminDeletePrepContent(token, id);
      await loadTopicContents(contentTopicId);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  // PDF content: upload a file OR paste a URL — same dual-path pattern used
  // for circular PDFs / organization logos elsewhere in the admin. Upload
  // only works once the content row exists (needs an id to scope storage),
  // so it's only offered while editing an already-saved PDF content item.
  const handlePdfUpload = async (file: File) => {
    if (!contentId) return;
    setPdfUploading(true);
    try {
      const updated = await adminUploadPrepContentPdf(token, contentId, file);
      setContentUrl(updated.contentUrl ?? '');
      flash('PDF আপলোড হয়েছে');
    } catch { flash('আপলোড ব্যর্থ'); } finally { setPdfUploading(false); }
  };

  const handlePdfRemove = async () => {
    if (!contentId) { setContentUrl(''); return; }
    try {
      await adminDeletePrepContentPdf(token, contentId);
      setContentUrl('');
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  const copyPdfUrl = async () => {
    try {
      await navigator.clipboard.writeText(contentUrl);
      setPdfCopied(true);
      setTimeout(() => setPdfCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
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

  const loadAttempts = async (setId: number) => {
    setMarksLoading(true);
    setMarksSetId(setId);
    try {
      const a = await adminGetExamAttempts(token, setId);
      setAttempts(a);
    } finally { setMarksLoading(false); }
  };

  const handleDownloadMarksheet = async (examTitle: string) => {
    setMarksDownloading(true);
    try {
      const { downloadExamMarksPdf } = await import('@/lib/examMarksPdf');
      await downloadExamMarksPdf(examTitle, attempts);
    } catch { flash('PDF তৈরি করা যায়নি'); }
    finally { setMarksDownloading(false); }
  };

  const resetSetForm = () => {
    setEditingSet(null); setSetTitleBn(''); setSetDescBn('');
    setSetStartsAt(''); setSetEndsAt(''); setSetDuration('30'); setSetPublished(false);
    setSetNegativeMarkingEnabled(false); setSetNegativeMarks('0');
  };

  // ── Exam routine ──────────────────────────────────────────────────────────

  const loadRoutine = async (categoryId: string) => {
    if (!categoryId) return;
    setRoutineLoading(true);
    try {
      const entries = await adminGetRoutineForCategory(token, Number(categoryId));
      setRoutineEntries(entries);
    } finally { setRoutineLoading(false); }
  };

  const loadRoutineExamSets = async (topicId: string) => {
    if (!topicId) { setRoutineExamSets([]); return; }
    const sets = await adminGetExamSets(token, Number(topicId));
    setRoutineExamSets(sets);
  };

  const resetRoutineForm = () => {
    setEditingRoutine(null); setRoutineTopicId(''); setRoutineExamSetId(''); setRoutineExamSets([]);
    setRoutineTitleBn(''); setRoutineTitleEn(''); setRoutineDescription(''); setRoutineLocation('');
    setRoutineScheduledAt(''); setRoutineOrder('0'); setRoutinePublished(true);
  };

  const editRoutine = (e: ExamRoutineEntry) => {
    setEditingRoutine(e);
    setRoutineTopicId(e.topicId ? String(e.topicId) : '');
    setRoutineExamSetId(e.examSetId ? String(e.examSetId) : '');
    if (e.topicId) loadRoutineExamSets(String(e.topicId));
    setRoutineTitleBn(e.titleBn); setRoutineTitleEn(e.titleEn ?? ''); setRoutineDescription(e.description ?? '');
    setRoutineLocation(e.location ?? '');
    setRoutineScheduledAt(e.scheduledAt.slice(0, 16));
    setRoutineOrder(String(e.displayOrder)); setRoutinePublished(e.published);
  };

  const saveRoutine = async () => {
    if (!routineCatId || !routineTitleBn || !routineScheduledAt) { flash('সব ঘর পূরণ করুন'); return; }
    const body = {
      categoryId: Number(routineCatId),
      topicId: routineTopicId ? Number(routineTopicId) : null,
      examSetId: routineExamSetId ? Number(routineExamSetId) : null,
      titleBn: routineTitleBn,
      titleEn: routineTitleEn || null,
      description: routineDescription || null,
      location: routineLocation || null,
      scheduledAt: routineScheduledAt,
      displayOrder: Number(routineOrder),
      published: routinePublished,
    };
    try {
      if (editingRoutine) await adminUpdateRoutineEntry(token, editingRoutine.id, body);
      else await adminCreateRoutineEntry(token, body);
      await loadRoutine(routineCatId);
      resetRoutineForm();
      flash(editingRoutine ? 'আপডেট হয়েছে' : 'রুটিন এন্ট্রি তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteRoutine = async (id: number) => {
    if (!confirm('রুটিন এন্ট্রি মুছে ফেলবেন?')) return;
    try {
      await adminDeleteRoutineEntry(token, id);
      await loadRoutine(routineCatId);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  const editSet = (s: ExamSet) => {
    setEditingSet(s); setSetTitleBn(s.titleBn); setSetDescBn(s.descriptionBn ?? '');
    setSetStartsAt(s.startsAt.slice(0, 16)); setSetEndsAt(s.endsAt.slice(0, 16));
    setSetDuration(String(s.durationMinutes)); setSetPublished(s.published);
    setSetNegativeMarkingEnabled((s.negativeMarksPerWrong ?? 0) > 0);
    setSetNegativeMarks(s.negativeMarksPerWrong ? String(s.negativeMarksPerWrong) : '0');
  };

  const saveSet = async () => {
    if (!examTopicId || !setTitleBn || !setStartsAt || !setEndsAt) { flash('সব ঘর পূরণ করুন'); return; }
    const body = { topicId: Number(examTopicId), titleBn: setTitleBn, descriptionBn: setDescBn || null, startsAt: setStartsAt, endsAt: setEndsAt, durationMinutes: Number(setDuration), published: setPublished, negativeMarksPerWrong: setNegativeMarkingEnabled ? (Number(setNegativeMarks) || 0) : 0 };
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

  if (loading) {
    return (
      <AdminShell title="চাকরির প্রস্তুতি" adminName={adminName} token={token}>
        <div className="flex items-center justify-center py-24 text-warm-muted">লোড হচ্ছে...</div>
      </AdminShell>
    );
  }

  const tabLabel = (t: Tab) =>
    t === 'categories' ? 'ক্যাটাগরি' : t === 'topics' ? 'বিষয়' : t === 'content' ? 'কন্টেন্ট' :
    t === 'exam' ? '📝 পরীক্ষা' : t === 'routine' ? '🗓 রুটিন' : '💳 পেমেন্ট';

  return (
    <AdminShell title="চাকরির প্রস্তুতি" subtitle="ক্যাটাগরি, বিষয়, কন্টেন্ট, পরীক্ষা ও পেমেন্ট ব্যবস্থাপনা" adminName={adminName} token={token}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {msg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-up">
            ✅ {msg}
          </div>
        )}

        <PageHeader title="চাকরির প্রস্তুতি" />

        <div className="mb-6">
          <Tabs
            tabs={(['categories', 'topics', 'content', 'exam', 'routine', 'payment'] as Tab[]).map((t) => ({ id: t, label: tabLabel(t) }))}
            active={tab}
            onChange={(id) => {
              setTab(id as Tab);
              if (id === 'payment') loadEnrollmentRequests(token, requestsFilter);
            }}
          />
        </div>

        {/* ── Categories ─────────────────────────────────────────────────── */}
        {tab === 'categories' && (
          <div className="space-y-6">
            {/* Parent category groups — IT / BCS / General, etc. Collapsed by
                default since it's an occasional setup task, not the everyday
                category-editing workflow. */}
            <div className="bg-white rounded-2xl border border-warm-border overflow-hidden">
              <button
                onClick={() => setGroupPanelOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-warm-bg/50 transition-colors"
              >
                <div>
                  <h2 className="font-bold text-gray-900">প্যারেন্ট ক্যাটাগরি</h2>
                  <p className="text-xs text-warm-muted mt-0.5">যেমন: IT, BCS, General — এর নিচে আলাদা আলাদা ক্যাটাগরি যুক্ত করা যায়</p>
                </div>
                <span className="text-warm-muted text-sm">{groupPanelOpen ? '▲ বন্ধ করুন' : `▼ দেখুন (${groups.length})`}</span>
              </button>
              {groupPanelOpen && (
                <div className="border-t border-warm-border p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 text-sm">{groupEditId ? 'এডিট করুন' : 'নতুন প্যারেন্ট ক্যাটাগরি'}</h3>
                    <Field label="নাম (বাংলা) *" value={groupNameBn} onChange={setGroupNameBn} placeholder="IT" />
                    <Field label="নাম (ইংরেজি)" value={groupNameEn} onChange={setGroupNameEn} />
                    <Field label="স্লাগ" value={groupSlug} onChange={setGroupSlug} placeholder="auto-generated" />
                    <Field label="আইকন" value={groupIcon} onChange={setGroupIcon} placeholder="laptop" />
                    <Field label="রং (#hex)" value={groupColor} onChange={setGroupColor} />
                    <Field label="ক্রম" value={groupOrder} onChange={setGroupOrder} type="number" />
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveGroup} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                        {groupEditId ? 'আপডেট' : 'তৈরি করুন'}
                      </button>
                      {groupEditId > 0 && (
                        <button onClick={resetGroupForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    {groups.length === 0 && <p className="text-sm text-warm-muted">এখনো কোনো প্যারেন্ট ক্যাটাগরি নেই।</p>}
                    {groups.map((g) => (
                      <div key={g.id} className="flex items-center gap-3 border border-warm-border rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: g.colorHex ?? '#374151' }}>
                          {g.displayOrder}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{g.nameBn}</p>
                          <p className="text-xs text-warm-muted">{g.slug} · {g.categoryCount} টি ক্যাটাগরি</p>
                        </div>
                        <button onClick={() => editGroup(g)} className="text-xs text-blue-600 hover:underline ml-2">এডিট</button>
                        <button onClick={() => deleteGroup(g.id)} className="text-xs text-red-500 hover:underline ml-2">মুছুন</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3">
              <h2 className="font-bold text-gray-900">{catId ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি'}</h2>
              <Field label="নাম (বাংলা) *" value={catNameBn} onChange={setCatNameBn} />
              <Field label="নাম (ইংরেজি)" value={catNameEn} onChange={setCatNameEn} />
              <Field label="স্লাগ" value={catSlug} onChange={setCatSlug} placeholder="auto-generated" />
              <Field label="আইকন" value={catIcon} onChange={setCatIcon} placeholder="school" />
              <Field label="রং (#hex)" value={catColor} onChange={setCatColor} />
              <Field label="ক্রম" value={catOrder} onChange={setCatOrder} type="number" />

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">প্যারেন্ট ক্যাটাগরি</label>
                <select
                  value={catGroupId}
                  onChange={(e) => setCatGroupId(e.target.value)}
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">— কোনোটি নয় —</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.nameBn}</option>)}
                </select>
              </div>

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
              <Field label="ফেসবুক গ্রুপ লিংক" value={catFacebookGroupUrl} onChange={setCatFacebookGroupUrl} placeholder="https://facebook.com/groups/..." />
              <Field label="ফেসবুক পেজ লিংক" value={catFacebookPageUrl} onChange={setCatFacebookPageUrl} placeholder="https://facebook.com/..." />
              <Field label="হোয়াটসঅ্যাপ গ্রুপ লিংক" value={catWhatsappGroupUrl} onChange={setCatWhatsappGroupUrl} placeholder="https://chat.whatsapp.com/..." />

              <div className="flex gap-2 pt-1">
                <button onClick={saveCat} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                  {catId ? 'আপডেট' : 'তৈরি করুন'}
                </button>
                {catId > 0 && (
                  <button onClick={resetCatForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">
              {[
                ...groups.map((g) => ({ key: `g-${g.id}`, label: g.nameBn, items: categories.filter((c) => c.groupId === g.id) })),
                { key: 'ungrouped', label: 'অন্যান্য', items: categories.filter((c) => c.groupId == null) },
              ].filter((section) => section.items.length > 0).map((section) => (
              <div key={section.key} className="space-y-3">
                <h3 className="text-xs font-bold text-warm-muted uppercase tracking-wide px-1">{section.label}</h3>
                {section.items.map((c) => (
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
              ))}
            </div>
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
                onChange={(v) => { setContentTopicId(v); loadTopicContents(v); }}
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

              {contentType === 'VIDEO' && (
                <Field label="YouTube URL" value={contentUrl} onChange={setContentUrl} placeholder="https://youtube.com/watch?v=..." />
              )}

              {contentType === 'PDF' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">PDF</label>

                  {contentId > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input ref={pdfFileRef} type="file" accept="application/pdf" className="hidden"
                        onChange={(e) => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0]); }} />
                      <button type="button" onClick={() => pdfFileRef.current?.click()} disabled={pdfUploading}
                        className="text-xs border border-warm-border rounded-lg px-3 py-1.5 hover:border-primary text-gray-600 disabled:opacity-50">
                        {pdfUploading ? 'আপলোড হচ্ছে...' : '📎 ফাইল আপলোড করুন'}
                      </button>
                      {contentUrl && (
                        <button type="button" onClick={handlePdfRemove} className="text-xs text-red-500 hover:underline">
                          মুছুন
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-warm-muted">
                      ফাইল আপলোড করতে হলে প্রথমে নিচে &quot;তৈরি করুন&quot; দিয়ে সংরক্ষণ করুন, তারপর এডিট করে ফাইল আপলোড করতে পারবেন। এখন চাইলে সরাসরি URL-ও দিতে পারেন।
                    </p>
                  )}

                  <Field label="অথবা সরাসরি URL দিন" value={contentUrl} onChange={setContentUrl} placeholder="https://..." />

                  {contentUrl && (
                    <div className="flex gap-2">
                      <input readOnly value={contentUrl}
                        className="flex-1 border border-warm-border rounded-lg px-2 py-1.5 text-xs bg-gray-50 text-gray-500" />
                      <button type="button" onClick={copyPdfUrl}
                        className="shrink-0 text-xs text-primary border border-primary-300 rounded-lg px-2.5 hover:bg-primary-50 whitespace-nowrap">
                        {pdfCopied ? '✓ কপি হয়েছে' : '📋 কপি'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(contentType === 'POST' || contentType === 'QUIZ') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">বডি / কন্টেন্ট</label>
                  <RichTextEditor
                    value={contentBody}
                    onChange={setContentBody}
                    token={token}
                    placeholder="আর্টিকেলের বিষয়বস্তু লিখুন..."
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

            {/* Existing content for the selected topic — এডিট/মুছুন live here */}
            {contentTopicId && (
              <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3 h-fit">
                <h3 className="font-bold text-gray-800 text-sm">
                  এই বিষয়ের কন্টেন্ট {topicContents.length > 0 && `(${topicContents.length})`}
                </h3>
                {contentsLoading ? (
                  <p className="text-sm text-warm-muted">লোড হচ্ছে...</p>
                ) : topicContents.length === 0 ? (
                  <p className="text-sm text-warm-muted">এই বিষয়ে এখনো কোনো কন্টেন্ট নেই</p>
                ) : (
                  <div className="space-y-2">
                    {topicContents.map((c) => (
                      <div key={c.id} className="border border-warm-border rounded-xl p-3 flex items-center gap-3">
                        <span className="text-lg shrink-0">
                          {c.contentType === 'VIDEO' ? '📹' : c.contentType === 'POST' ? '📄' : c.contentType === 'PDF' ? '📑' : '❓'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{c.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {c.published
                              ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">প্রকাশিত</span>
                              : <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">ড্রাফট</span>}
                          </div>
                        </div>
                        <button onClick={() => editContent(c)} className="text-xs text-blue-600 hover:underline shrink-0">এডিট</button>
                        <button onClick={() => deleteContent(c.id)} className="text-xs text-red-500 hover:underline shrink-0">মুছুন</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

              <StudyResourcePrompt
                defaultTopic={allTopics.find((t) => String(t.id) === contentTopicId)?.nameBn ?? ''}
              />

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
                    <input type="checkbox" checked={setNegativeMarkingEnabled}
                      onChange={(e) => { setSetNegativeMarkingEnabled(e.target.checked); if (!e.target.checked) setSetNegativeMarks('0'); }}
                      className="rounded accent-primary w-4 h-4" />
                    <span className="font-medium text-gray-700">নেগেটিভ মার্কিং চালু করুন</span>
                  </label>
                  {setNegativeMarkingEnabled && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">প্রতি ভুল উত্তরে কর্তন *</label>
                      <input type="number" value={setNegativeMarks} onChange={(e) => setSetNegativeMarks(e.target.value)} min="0" step="0.25"
                        className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    </div>
                  )}
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
                        <button
                          onClick={() => (marksSetId === s.id ? setMarksSetId(null) : loadAttempts(s.id))}
                          className="text-xs text-amber-600 hover:underline ml-2"
                        >
                          📊 মার্কস {marksSetId === s.id ? '▲' : '→'}
                        </button>
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

                              {editingQuestion === null && !showQuestionEditor && (
                                <BulkQuestionImport
                                  token={token}
                                  examSetId={s.id}
                                  existingCount={questions.length}
                                  onDone={() => loadQuestions(s.id)}
                                />
                              )}

                              {showQuestionEditor && editingQuestion === null ? (
                                <QuestionEditor token={token} examSetId={s.id} editing={null}
                                  onSaved={async () => { await loadQuestions(s.id); setShowQuestionEditor(false); flash('প্রশ্ন যোগ হয়েছে'); }}
                                  onCancel={() => setShowQuestionEditor(false)} />
                              ) : editingQuestion === null && (
                                <button onClick={() => setShowQuestionEditor(true)}
                                  className="w-full border-2 border-dashed border-warm-border rounded-xl py-3 text-sm text-warm-muted hover:border-primary hover:text-primary transition-colors">
                                  + নতুন প্রশ্ন যোগ করুন (একটি একটি করে)
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {marksSetId === s.id && (
                        <div className="p-4 border-t border-warm-border space-y-3">
                          {marksLoading ? (
                            <p className="text-xs text-warm-muted">লোড হচ্ছে...</p>
                          ) : attempts.length === 0 ? (
                            <p className="text-xs text-warm-muted">এখনো কেউ এই পরীক্ষা দেয়নি</p>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-warm-muted">{attempts.length} জন অংশগ্রহণকারী</p>
                                <button
                                  onClick={() => handleDownloadMarksheet(s.titleBn)}
                                  disabled={marksDownloading}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                >
                                  {marksDownloading ? 'PDF তৈরি হচ্ছে...' : '⬇ মার্কশীট PDF ডাউনলোড করুন'}
                                </button>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-left text-warm-muted border-b border-warm-border">
                                      <th className="py-1.5 pr-2 font-medium">#</th>
                                      <th className="py-1.5 pr-2 font-medium">নাম</th>
                                      {/*<th className="py-1.5 pr-2 font-medium">ইমেইল</th>*/}
                                      <th className="py-1.5 pr-2 font-medium">স্কোর</th>
                                      <th className="py-1.5 pr-2 font-medium">ভুল</th>
                                      <th className="py-1.5 pr-2 font-medium">নেট স্কোর</th>
                                      <th className="py-1.5 pr-2 font-medium">%</th>
                                      <th className="py-1.5 pr-2 font-medium">ধরন</th>
                                      <th className="py-1.5 pr-2 font-medium">জমার সময়</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {attempts.map((a, i) => {
                                      const pct = a.totalQuestions > 0 ? Math.round((a.finalScore / a.totalQuestions) * 100) : 0;
                                      const pctColor = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
                                      return (
                                        <tr key={a.id} className="border-b border-gray-100">
                                          <td className="py-1.5 pr-2 text-warm-muted">{i + 1}</td>
                                          <td className="py-1.5 pr-2 font-semibold text-gray-900">{a.userName}</td>
                                          {/*<td className="py-1.5 pr-2 text-warm-muted">{a.userEmail}</td>*/}
                                          <td className="py-1.5 pr-2 font-semibold">{a.score}/{a.totalQuestions}</td>
                                          <td className="py-1.5 pr-2 text-red-500">{a.wrongCount}</td>
                                          <td className="py-1.5 pr-2 font-semibold text-gray-900">{a.finalScore}</td>
                                          <td className={`py-1.5 pr-2 font-bold ${pctColor}`}>{pct}%</td>
                                          <td className="py-1.5 pr-2 text-warm-muted">{a.attemptType === 'LIVE' ? 'লাইভ' : 'অনুশীলন'}</td>
                                          <td className="py-1.5 pr-2 text-warm-muted">{new Date(a.submittedAt).toLocaleString('bn-BD')}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
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

        {/* ── Exam Routine ───────────────────────────────────────────────── */}
        {tab === 'routine' && (
          <div className="space-y-6">
            {/* Step 1: pick category */}
            <div className="bg-white rounded-2xl border border-warm-border p-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1">ক্যাটাগরি বেছে নিন</label>
              <select
                value={routineCatId}
                onChange={(e) => { setRoutineCatId(e.target.value); loadRoutine(e.target.value); resetRoutineForm(); }}
                className="w-full sm:w-96 border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">বেছে নিন</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameBn}</option>)}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
              ℹ️ কোনো <strong>পরীক্ষা</strong> তৈরি বা এডিট করলে তার শিরোনাম ও শুরুর সময় অনুযায়ী রুটিন এন্ট্রি এখন <strong>স্বয়ংক্রিয়ভাবে</strong> তৈরি/আপডেট হয়ে যায় — আলাদাভাবে এখানে সেই তথ্য আবার লেখার দরকার নেই। নিচের ফর্মটি শুধু তখনই ব্যবহার করুন যখন এখনো তৈরি করা হয়নি এমন একটি ভবিষ্যৎ পরীক্ষার জন্য প্লেসহোল্ডার (যেমন শুধু তারিখ ঘোষণা) যোগ করতে চান।
            </div>

            {routineCatId && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Routine entry form */}
                <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3 h-fit">
                  <h2 className="font-bold text-gray-900">{editingRoutine ? 'এন্ট্রি এডিট করুন' : 'নতুন রুটিন এন্ট্রি'}</h2>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">বিষয় (ঐচ্ছিক)</label>
                    <select
                      value={routineTopicId}
                      onChange={(e) => { setRoutineTopicId(e.target.value); setRoutineExamSetId(''); loadRoutineExamSets(e.target.value); }}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="">নির্দিষ্ট করবেন না</option>
                      {allTopics.filter((t) => t.categoryId === Number(routineCatId)).map((t) => (
                        <option key={t.id} value={t.id}>{t.nameBn}</option>
                      ))}
                    </select>
                  </div>

                  {routineTopicId && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">পরীক্ষা সেট (ঐচ্ছিক — লিংক করতে)</label>
                      <select
                        value={routineExamSetId}
                        onChange={(e) => setRoutineExamSetId(e.target.value)}
                        className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">শুধু তথ্যমূলক এন্ট্রি (কোনো লিংক নেই)</option>
                        {routineExamSets.map((s) => (
                          <option key={s.id} value={s.id}>{s.titleBn} {s.published ? '(প্রকাশিত)' : '(ড্রাফট)'}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Field label="শিরোনাম (বাংলা) *" value={routineTitleBn} onChange={setRoutineTitleBn} placeholder="যেমন: ১ম সাপ্তাহিক পরীক্ষা" />
                  <Field label="শিরোনাম (ইংরেজি)" value={routineTitleEn} onChange={setRoutineTitleEn} />

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">বিবরণ</label>
                    <textarea value={routineDescription} onChange={(e) => setRoutineDescription(e.target.value)} rows={2}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
                  </div>

                  <Field label="স্থান/ভেন্যু (ঐচ্ছিক)" value={routineLocation} onChange={setRoutineLocation} placeholder="যেমন: ঢাকা কলেজ, রুম ৩০৪" />

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">তারিখ ও সময় *</label>
                    <input type="datetime-local" value={routineScheduledAt} onChange={(e) => setRoutineScheduledAt(e.target.value)}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>

                  <Field label="ক্রম" value={routineOrder} onChange={setRoutineOrder} type="number" />

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={routinePublished} onChange={(e) => setRoutinePublished(e.target.checked)} className="rounded accent-primary w-4 h-4" />
                    <span className="font-medium text-gray-700">প্রকাশিত (ইউজার দেখতে পাবে)</span>
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button onClick={saveRoutine} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                      {editingRoutine ? 'আপডেট' : 'তৈরি করুন'}
                    </button>
                    {editingRoutine && <button onClick={resetRoutineForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>}
                  </div>
                </div>

                {/* Routine list */}
                <div className="lg:col-span-2 space-y-3">
                  {routineLoading ? (
                    <p className="text-sm text-warm-muted">লোড হচ্ছে...</p>
                  ) : routineEntries.length === 0 ? (
                    <p className="text-sm text-warm-muted">এখনো কোনো রুটিন এন্ট্রি নেই</p>
                  ) : (
                    routineEntries.map((e) => (
                      <div key={e.id} className="bg-white rounded-xl border border-warm-border p-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{e.titleBn}</span>
                            {e.published
                              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">প্রকাশিত</span>
                              : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">ড্রাফট</span>}
                            {e.examSetId && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                লিংকড {e.examSetPublished ? '✓' : '(অপ্রকাশিত)'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-warm-muted mt-0.5">
                            {new Date(e.scheduledAt).toLocaleString('bn-BD')}
                            {e.topicNameBn && ` • ${e.topicNameBn}`}
                          </p>
                        </div>
                        <button onClick={() => { editRoutine(e); window.scrollTo(0, 0); }} className="text-xs text-blue-600 hover:underline shrink-0">এডিট</button>
                        <button onClick={() => deleteRoutine(e.id)} className="text-xs text-red-500 hover:underline shrink-0">মুছুন</button>
                      </div>
                    ))
                  )}
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
    </AdminShell>
  );
}
