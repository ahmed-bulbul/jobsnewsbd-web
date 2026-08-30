'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { jsonrepair } from 'jsonrepair';
import {
  adminGetQuestionBankCategories,
  adminCreateQuestionBankCategory,
  adminUpdateQuestionBankCategory,
  adminDeleteQuestionBankCategory,
  adminGetQuestionBankQuestions,
  adminCreateQuestionBankQuestion,
  adminUpdateQuestionBankQuestion,
  adminDeleteQuestionBankQuestion,
} from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Tabs from '@/components/admin/Tabs';
import type { QuestionBankCategory, QuestionBankQuestion, QuestionBankType, QuestionDifficulty } from '@/lib/types';

type Tab = 'categories' | 'questions';

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

const TYPE_LABEL: Record<QuestionBankType, string> = { MCQ: 'MCQ', WRITTEN: 'লিখিত', LAB: 'ল্যাব' };
const DIFFICULTY_LABEL: Record<QuestionDifficulty, string> = { EASY: 'সহজ', MEDIUM: 'মাঝারি', HARD: 'কঠিন' };
const DIFFICULTY_COLOR: Record<QuestionDifficulty, { bg: string; color: string }> = {
  EASY:   { bg: '#ECFDF5', color: '#059669' },
  MEDIUM: { bg: '#FFFBEB', color: '#B45309' },
  HARD:   { bg: '#FEF2F2', color: '#DC2626' },
};

// ── AI bulk import (mixed MCQ / WRITTEN / LAB) ─────────────────────────────────

function BulkQuestionBankImport({
  token,
  categoryId,
  existingCount,
  onDone,
}: {
  token: string;
  categoryId: number;
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

  const promptTemplate = (topic: string) => `তুমি একজন প্রশ্নপত্র থেকে ডেটা এক্সট্র্যাক্ট করার বিশেষজ্ঞ। বিষয়: ${topic ? `"${topic}"` : '[বিষয়ের নাম এখানে লিখুন]'}

আমি এর পরের মেসেজে একটি প্রশ্নপত্র (টেক্সট অথবা ছবি) দেব, অথবা তোমাকে নতুন প্রশ্ন তৈরি করতে বলব। প্রতিটি প্রশ্নকে নিচের তিনটি ধরনের একটিতে চিহ্নিত করো:
- "MCQ" — একাধিক অপশনসহ বহুনির্বাচনী প্রশ্ন
- "WRITTEN" — রচনামূলক/সংক্ষিপ্ত প্রশ্ন যার লিখিত উত্তর দরকার
- "LAB" — প্র্যাকটিক্যাল/কোডিং/ল্যাব সমস্যা

শুধুমাত্র নিচের ফরম্যাটে একটি JSON অ্যারে দাও — অন্য কোনো লেখা, ভূমিকা, ব্যাখ্যা বা \`\`\` কোড ফেন্স ছাড়া:

[
  { "type": "MCQ", "questionText": "প্রশ্নের লেখা", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctOption": "A", "explanationText": "সংক্ষিপ্ত ব্যাখ্যা (ঐচ্ছিক)", "examYear": 2023, "examInstitute": "Bangladesh Bank", "examPost": "Assistant Programmer", "topic": "Array", "difficulty": "MEDIUM", "examTaker": "BPSC" },
  { "type": "WRITTEN", "questionText": "প্রশ্নের লেখা", "answerText": "মডেল উত্তর", "explanationText": "", "examYear": null, "examInstitute": null, "examPost": null, "topic": "OOP", "difficulty": "HARD", "examTaker": "IBA" },
  { "type": "LAB", "questionText": "সমস্যার বিবরণ", "answerText": "সমাধান বা কোড", "explanationText": "", "examYear": null, "examInstitute": null, "examPost": null, "topic": "Sorting", "difficulty": "HARD", "examTaker": "Bank নিয়োগ কমিটি" }
]

নিয়ম:
- "type" ফিল্ড অবশ্যই "MCQ", "WRITTEN" অথবা "LAB" এর একটি হতে হবে (ক্যাপিটাল লেটারে)।
- MCQ-এর জন্য: চারটি ভিন্ন বাস্তবসম্মত অপশন এবং correctOption ("A"/"B"/"C"/"D") আবশ্যক।
- WRITTEN ও LAB-এর জন্য: answerText আবশ্যক (মডেল উত্তর বা সমাধান/কোড)। এই দুই ধরনে optionA/B/C/D বা correctOption দিও না।
- explanationText সবসময় ঐচ্ছিক — না দিতে চাইলে খালি স্ট্রিং দাও।
- "examInstitute" মানে যে প্রতিষ্ঠানে শূন্যপদ/নিয়োগ ছিল (নিয়োগকারী প্রতিষ্ঠান) — যেমন: "Bangladesh Bank", "Ministry of Finance"। "examPost" মানে সেই পদের নাম — যেমন: "AD (ICT)", "Assistant Programmer"। "examTaker" মানে যে প্রতিষ্ঠান পরীক্ষাটি গ্রহণ/পরিচালনা করেছে (পরীক্ষা গ্রহণকারী প্রতিষ্ঠান) — যেমন: "BPSC", "IBA", "Bank নিয়োগ কমিটি" — এটি নিয়োগকারী প্রতিষ্ঠান থেকে ভিন্ন হতে পারে (যেমন BPSC অনেক মন্ত্রণালয়ের হয়ে পরীক্ষা নেয়)। প্রশ্নপত্র থেকে বোঝা গেলে examYear (সংখ্যা), examInstitute, examPost ও examTaker সবগুলো দাও, না জানা থাকলে null দাও।
- প্রতিটি প্রশ্নে "topic" (প্রশ্নটি ঠিক কোন সাব-টপিকের, যেমন: "Array", "OOP", "Bangladesh History", "Verb Tense" — বিষয়ের একটি নির্দিষ্ট উপ-অংশের নাম) এবং "difficulty" ("EASY"/"MEDIUM"/"HARD" এর একটি, প্রশ্নটি কতটা কঠিন তা অনুমান করে) অবশ্যই দাও — না বুঝলে সবচেয়ে সম্ভাব্য অনুমান করে দাও, null দিও না।

⚠️ বৈধ JSON বাধ্যতামূলক (এটি সবচেয়ে গুরুত্বপূর্ণ নিয়ম):
- যদি কোনো প্রশ্ন বা উত্তরে প্রোগ্রামিং কোড থাকে (যেমন C/C++/Java কোডে { } ব্যবহার), তাহলে সেই কোডকে questionText/answerText স্ট্রিং-এর ভিতরে বসানোর সময় অবশ্যই প্রপার JSON স্ট্রিং এস্কেপিং করতে হবে: প্রতিটি নতুন লাইনকে \\n দিয়ে, প্রতিটি ডাবল-কোট (") কে \\" দিয়ে, এবং প্রতিটি ব্যাকস্ল্যাশ (\\) কে \\\\ দিয়ে রিপ্লেস করো। { এবং } ব্র্যাকেট নিজে থেকে কোনো সমস্যা করে না যতক্ষণ না এগুলো একটি স্ট্রিং-এর ভিতরে থাকে এবং স্ট্রিং-টি ঠিকভাবে quote/escape করা থাকে।
- আউটপুট দেওয়ার আগে নিজে মানসিকভাবে যাচাই করো যে পুরো আউটপুটটি JSON.parse() দিয়ে সরাসরি পার্স করা যাবে — কোনো ট্রেইলিং কমা, আনক্লোজড কোট, বা raw নিউলাইন স্ট্রিং-এর ভিতরে থাকা যাবে না।
- আউটপুট শুধু JSON অ্যারে — কোনো ভূমিকা, উপসংহার বা কোড ব্লক মার্কার নয়।`;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptTemplate(topicHint));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
  };

  const [parseErrorDetail, setParseErrorDetail] = useState('');

  // AI output is almost-JSON, not guaranteed-valid JSON — especially once
  // code snippets with raw newlines/quotes/braces sneak into a string value.
  // Try a straight parse first; if that fails, fall back to jsonrepair
  // (handles unescaped control characters, trailing commas, stray quotes,
  // etc. — exactly the class of mistakes LLMs make around embedded code).
  // If both fail (rare — usually an unescaped quote inside embedded code
  // that makes string boundaries genuinely ambiguous), surface the real
  // JSON.parse error so the admin can jump to that spot and fix it by hand.
  const parseItems = (): Array<Record<string, unknown>> | null => {
    setParseErrorDetail('');
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
      const data = JSON.parse(cleaned);
      return Array.isArray(data) ? data : null;
    } catch (e1) {
      try {
        const repaired = jsonrepair(cleaned);
        const data = JSON.parse(repaired);
        return Array.isArray(data) ? data : null;
      } catch {
        setParseErrorDetail(e1 instanceof Error ? e1.message : String(e1));
        return null;
      }
    }
  };

  const submitAll = async () => {
    setError('');
    const items = parseItems();
    if (!items || items.length === 0) {
      setError(
        `বৈধ JSON অ্যারে পাওয়া যায়নি — অটো-ফিক্সও ব্যর্থ হয়েছে। কোডের ভিতরের কোট/নিউলাইন ঠিকভাবে এসকেপ করা আছে কিনা দেখুন।` +
        (parseErrorDetail ? ` (টেকনিক্যাল ত্রুটি: ${parseErrorDetail})` : '')
      );
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i] as Record<string, unknown>;
      const type = typeof it.type === 'string' ? it.type.trim().toUpperCase() : '';
      if (!['MCQ', 'WRITTEN', 'LAB'].includes(type)) {
        setError(`প্রশ্ন ${i + 1}: "type" অবশ্যই MCQ/WRITTEN/LAB এর একটি হতে হবে`);
        return;
      }
      if (typeof it.questionText !== 'string' || !it.questionText.trim()) {
        setError(`প্রশ্ন ${i + 1}: questionText খালি`);
        return;
      }
      if (type === 'MCQ') {
        const missing = ['optionA', 'optionB', 'optionC', 'optionD']
          .filter((k) => typeof it[k] !== 'string' || !(it[k] as string).trim());
        if (missing.length > 0) {
          setError(`প্রশ্ন ${i + 1}: এই অপশনগুলো নেই বা খালি — ${missing.join(', ')}`);
          return;
        }
        if (typeof it.correctOption !== 'string' || !['A', 'B', 'C', 'D'].includes(it.correctOption.trim().toUpperCase())) {
          setError(`প্রশ্ন ${i + 1}: correctOption অবশ্যই A/B/C/D এর একটি হতে হবে`);
          return;
        }
      } else {
        if (typeof it.answerText !== 'string' || !it.answerText.trim()) {
          setError(`প্রশ্ন ${i + 1}: answerText খালি (${type === 'LAB' ? 'সমাধান' : 'মডেল উত্তর'} আবশ্যক)`);
          return;
        }
      }
    }

    setBusy(true);
    setProgress({ done: 0, total: items.length });
    let successCount = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i] as Record<string, unknown>;
      const type = String(it.type).trim().toUpperCase();
      const body = {
        categoryId,
        questionType: type,
        questionText: String(it.questionText).trim(),
        optionA: type === 'MCQ' ? String(it.optionA).trim() : null,
        optionB: type === 'MCQ' ? String(it.optionB).trim() : null,
        optionC: type === 'MCQ' ? String(it.optionC).trim() : null,
        optionD: type === 'MCQ' ? String(it.optionD).trim() : null,
        correctOption: type === 'MCQ' ? String(it.correctOption).trim().toUpperCase() : null,
        answerText: type !== 'MCQ' ? String(it.answerText).trim() : null,
        explanationText: it.explanationText ? String(it.explanationText).trim() : null,
        examYear: it.examYear != null && it.examYear !== '' ? Number(it.examYear) : null,
        examInstitute: it.examInstitute ? String(it.examInstitute).trim() : null,
        examPost: it.examPost ? String(it.examPost).trim() : null,
        topic: it.topic ? String(it.topic).trim() : null,
        difficulty: typeof it.difficulty === 'string' && ['EASY', 'MEDIUM', 'HARD'].includes(it.difficulty.trim().toUpperCase())
          ? it.difficulty.trim().toUpperCase()
          : null,
        examTaker: it.examTaker ? String(it.examTaker).trim() : null,
        displayOrder: existingCount + i,
        published: true,
      };
      try {
        await adminCreateQuestionBankQuestion(token, body);
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
        ✨ AI দিয়ে বাল্ক প্রশ্ন যোগ করুন (MCQ/লিখিত/ল্যাব মিশিয়ে)
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
        ১) বিষয় লিখে প্রম্পট কপি করুন → ২) যেকোনো AI চ্যাটে (ChatGPT/Claude/Gemini) পেস্ট করে প্রশ্নপত্রের টেক্সট বা ছবি যোগ করুন → ৩) AI-এর JSON আউটপুট নিচে পেস্ট করে একবারে সব প্রশ্ন যোগ করুন। MCQ, লিখিত ও ল্যাব — তিন ধরনই একসাথে মিশিয়ে দেওয়া যাবে।
      </p>

      <div className="flex gap-2">
        <input type="text" value={topicHint} onChange={(e) => setTopicHint(e.target.value)}
          placeholder="বিষয় (যেমন: ডেটা স্ট্রাকচার ও অ্যালগরিদম)"
          className="flex-1 border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
        <button type="button" onClick={copyPrompt}
          className="shrink-0 px-3 py-2 text-xs font-semibold border border-primary-300 text-primary rounded-lg hover:bg-primary-50">
          {copied ? '✓ কপি হয়েছে' : '📋 প্রম্পট কপি করুন'}
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">AI-এর JSON আউটপুট এখানে পেস্ট করুন</label>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8}
          placeholder='[{"type": "MCQ", "questionText": "...", ...}, {"type": "WRITTEN", "questionText": "...", "answerText": "..."}]'
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

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminQuestionBankPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [tab, setTab] = useState<Tab>('categories');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<QuestionBankCategory[]>([]);

  // Category form
  const [catId, setCatId] = useState(0);
  const [catNameBn, setCatNameBn] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catColor, setCatColor] = useState('#B45309');
  const [catOrder, setCatOrder] = useState('0');
  const [catActive, setCatActive] = useState(true);
  const [catDescription, setCatDescription] = useState('');

  // Questions tab
  const [qCatId, setQCatId] = useState('');
  const [questions, setQuestions] = useState<QuestionBankQuestion[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [editingQ, setEditingQ] = useState<QuestionBankQuestion | null>(null);
  const [qType, setQType] = useState<QuestionBankType>('MCQ');
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('A');
  const [qAnswer, setQAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qExamYear, setQExamYear] = useState('');
  const [qExamInstitute, setQExamInstitute] = useState('');
  const [qExamPost, setQExamPost] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty | ''>('');
  const [qExamTaker, setQExamTaker] = useState('');
  const [qOrder, setQOrder] = useState('0');
  const [qPublished, setQPublished] = useState(true);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadCategories = useCallback(async (t: string) => {
    const cats = await adminGetQuestionBankCategories(t);
    setCategories(cats);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    const n = localStorage.getItem('admin_name');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    setAdminName(n ?? 'Admin');
    loadCategories(t).finally(() => setLoading(false));
  }, [router, loadCategories]);

  const resetCatForm = () => {
    setCatId(0); setCatNameBn(''); setCatNameEn(''); setCatSlug(''); setCatIcon('');
    setCatColor('#B45309'); setCatOrder('0'); setCatActive(true); setCatDescription('');
  };

  const editCat = (c: QuestionBankCategory) => {
    setCatId(c.id); setCatNameBn(c.nameBn); setCatNameEn(c.nameEn ?? ''); setCatSlug(c.slug);
    setCatIcon(c.icon ?? ''); setCatColor(c.colorHex ?? '#B45309'); setCatOrder(String(c.displayOrder));
    setCatActive(c.active); setCatDescription(c.description ?? '');
  };

  const saveCat = async () => {
    if (!catNameBn.trim()) { flash('নাম আবশ্যক'); return; }
    const body = {
      nameBn: catNameBn, nameEn: catNameEn || null, slug: catSlug || null,
      icon: catIcon || null, colorHex: catColor || null, displayOrder: Number(catOrder),
      active: catActive, description: catDescription || null,
    };
    try {
      if (catId) await adminUpdateQuestionBankCategory(token, catId, body);
      else await adminCreateQuestionBankCategory(token, body);
      await loadCategories(token);
      resetCatForm();
      flash(catId ? 'আপডেট হয়েছে' : 'ক্যাটাগরি তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteCat = async (id: number) => {
    if (!confirm('ক্যাটাগরি ও এর সব প্রশ্ন মুছে ফেলবেন?')) return;
    try {
      await adminDeleteQuestionBankCategory(token, id);
      await loadCategories(token);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  const loadQuestions = async (categoryId: string) => {
    if (!categoryId) return;
    setQLoading(true);
    try {
      const qs = await adminGetQuestionBankQuestions(token, Number(categoryId));
      setQuestions(qs);
    } finally { setQLoading(false); }
  };

  const resetQForm = () => {
    setEditingQ(null); setQType('MCQ'); setQText(''); setQOptA(''); setQOptB(''); setQOptC(''); setQOptD('');
    setQCorrect('A'); setQAnswer(''); setQExplanation(''); setQExamYear(''); setQExamInstitute(''); setQExamPost('');
    setQTopic(''); setQDifficulty(''); setQExamTaker('');
    setQOrder('0'); setQPublished(true);
  };

  const editQ = (q: QuestionBankQuestion) => {
    setEditingQ(q); setQType(q.questionType); setQText(q.questionText);
    setQOptA(q.optionA ?? ''); setQOptB(q.optionB ?? ''); setQOptC(q.optionC ?? ''); setQOptD(q.optionD ?? '');
    setQCorrect(q.correctOption ?? 'A'); setQAnswer(q.answerText ?? ''); setQExplanation(q.explanationText ?? '');
    setQExamYear(q.examYear ? String(q.examYear) : ''); setQExamInstitute(q.examInstitute ?? ''); setQExamPost(q.examPost ?? '');
    setQTopic(q.topic ?? ''); setQDifficulty(q.difficulty ?? ''); setQExamTaker(q.examTaker ?? '');
    setQOrder(String(q.displayOrder)); setQPublished(q.published);
  };

  const saveQ = async () => {
    if (!qCatId || !qText.trim()) { flash('সব ঘর পূরণ করুন'); return; }
    if (qType === 'MCQ' && (!qOptA.trim() || !qOptB.trim() || !qOptC.trim() || !qOptD.trim())) {
      flash('MCQ-এর জন্য চারটি অপশনই আবশ্যক'); return;
    }
    if (qType !== 'MCQ' && !qAnswer.trim()) {
      flash(qType === 'LAB' ? 'সমাধান আবশ্যক' : 'মডেল উত্তর আবশ্যক'); return;
    }
    const body = {
      categoryId: Number(qCatId),
      questionType: qType,
      questionText: qText,
      optionA: qType === 'MCQ' ? qOptA : null,
      optionB: qType === 'MCQ' ? qOptB : null,
      optionC: qType === 'MCQ' ? qOptC : null,
      optionD: qType === 'MCQ' ? qOptD : null,
      correctOption: qType === 'MCQ' ? qCorrect : null,
      answerText: qType !== 'MCQ' ? qAnswer : null,
      explanationText: qExplanation || null,
      examYear: qExamYear.trim() ? Number(qExamYear) : null,
      examInstitute: qExamInstitute.trim() || null,
      examPost: qExamPost.trim() || null,
      topic: qTopic.trim() || null,
      difficulty: qDifficulty || null,
      examTaker: qExamTaker.trim() || null,
      displayOrder: Number(qOrder),
      published: qPublished,
    };
    try {
      if (editingQ) await adminUpdateQuestionBankQuestion(token, editingQ.id, body);
      else await adminCreateQuestionBankQuestion(token, body);
      await loadQuestions(qCatId);
      resetQForm();
      flash(editingQ ? 'আপডেট হয়েছে' : 'প্রশ্ন তৈরি হয়েছে');
    } catch { flash('ত্রুটি হয়েছে'); }
  };

  const deleteQ = async (id: number) => {
    if (!confirm('প্রশ্ন মুছে ফেলবেন?')) return;
    try {
      await adminDeleteQuestionBankQuestion(token, id);
      await loadQuestions(qCatId);
      flash('মুছে ফেলা হয়েছে');
    } catch { flash('মুছতে ব্যর্থ'); }
  };

  if (loading) {
    return (
      <AdminShell title="প্রশ্ন ব্যাংক" adminName={adminName} token={token}>
        <div className="flex items-center justify-center py-24 text-warm-muted">লোড হচ্ছে...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="প্রশ্ন ব্যাংক" subtitle="ক্যাটাগরি ও প্রশ্ন ব্যবস্থাপনা" adminName={adminName} token={token}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {msg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-up">
            ✅ {msg}
          </div>
        )}

        <PageHeader title="প্রশ্ন ব্যাংক" />

        <div className="mb-6">
          <Tabs
            tabs={[{ id: 'categories', label: 'ক্যাটাগরি' }, { id: 'questions', label: 'প্রশ্ন' }]}
            active={tab}
            onChange={(id) => setTab(id as Tab)}
          />
        </div>

        {/* ── Categories ─────────────────────────────────────────────────── */}
        {tab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3">
              <h2 className="font-bold text-gray-900">{catId ? 'ক্যাটাগরি এডিট করুন' : 'নতুন ক্যাটাগরি'}</h2>
              <Field label="নাম (বাংলা) *" value={catNameBn} onChange={setCatNameBn} placeholder="যেমন: IT প্রশ্ন" />
              <Field label="নাম (ইংরেজি)" value={catNameEn} onChange={setCatNameEn} />
              <Field label="স্লাগ" value={catSlug} onChange={setCatSlug} placeholder="auto-generated" />
              <Field label="আইকন (ইমোজি)" value={catIcon} onChange={setCatIcon} placeholder="💻" />
              <Field label="রং (#hex)" value={catColor} onChange={setCatColor} />
              <Field label="ক্রম" value={catOrder} onChange={setCatOrder} type="number" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">বিবরণ</label>
                <textarea value={catDescription} onChange={(e) => setCatDescription(e.target.value)} rows={2}
                  className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={catActive} onChange={(e) => setCatActive(e.target.checked)} className="rounded accent-primary w-4 h-4" />
                <span className="font-medium text-gray-700">সক্রিয়</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={saveCat} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                  {catId ? 'আপডেট' : 'তৈরি করুন'}
                </button>
                {catId > 0 && <button onClick={resetCatForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {categories.length === 0 && <p className="text-sm text-warm-muted">এখনো কোনো ক্যাটাগরি নেই</p>}
              {categories.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-warm-border p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${c.colorHex ?? '#B45309'}22` }}>
                    {c.icon || '❓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{c.nameBn}</p>
                      {!c.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">নিষ্ক্রিয়</span>}
                    </div>
                    <p className="text-xs text-warm-muted">{c.slug} • {c.questionCount} টি প্রশ্ন</p>
                  </div>
                  <button onClick={() => { setTab('questions'); setQCatId(String(c.id)); loadQuestions(String(c.id)); resetQForm(); }} className="text-xs text-primary hover:underline">প্রশ্ন →</button>
                  <button onClick={() => editCat(c)} className="text-xs text-blue-600 hover:underline ml-2">এডিট</button>
                  <button onClick={() => deleteCat(c.id)} className="text-xs text-red-500 hover:underline ml-2">মুছুন</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Questions ──────────────────────────────────────────────────── */}
        {tab === 'questions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-warm-border p-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1">ক্যাটাগরি বেছে নিন</label>
              <select
                value={qCatId}
                onChange={(e) => { setQCatId(e.target.value); loadQuestions(e.target.value); resetQForm(); }}
                className="w-full sm:w-96 border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">বেছে নিন</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameBn}</option>)}
              </select>
            </div>

            {qCatId && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3 h-fit">
                  <h2 className="font-bold text-gray-900">{editingQ ? 'প্রশ্ন এডিট করুন' : 'নতুন প্রশ্ন'}</h2>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ধরন *</label>
                    <div className="flex gap-1.5">
                      {(['MCQ', 'WRITTEN', 'LAB'] as QuestionBankType[]).map((ty) => (
                        <button key={ty} type="button" onClick={() => setQType(ty)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${qType === ty ? 'bg-primary text-white border-primary' : 'border-warm-border text-gray-600 hover:border-primary'}`}>
                          {TYPE_LABEL[ty]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {qType === 'LAB' ? 'সমস্যার বিবরণ *' : 'প্রশ্নের লেখা *'}
                    </label>
                    <textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={3}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y" />
                  </div>

                  {qType === 'MCQ' ? (
                    <>
                      <Field label="অপশন A *" value={qOptA} onChange={setQOptA} />
                      <Field label="অপশন B *" value={qOptB} onChange={setQOptB} />
                      <Field label="অপশন C *" value={qOptC} onChange={setQOptC} />
                      <Field label="অপশন D *" value={qOptD} onChange={setQOptD} />
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">সঠিক উত্তর *</label>
                        <div className="flex gap-1.5">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                            <button key={opt} type="button" onClick={() => setQCorrect(opt)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${qCorrect === opt ? 'bg-green-600 text-white border-green-600' : 'border-warm-border text-gray-600 hover:border-green-400'}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {qType === 'LAB' ? 'সমাধান / কোড *' : 'মডেল উত্তর *'}
                      </label>
                      <textarea value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} rows={4}
                        className={`w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y ${qType === 'LAB' ? 'font-mono text-xs' : ''}`} />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ব্যাখ্যা (ঐচ্ছিক)</label>
                    <textarea value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} rows={2}
                      className="w-full border border-warm-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y" />
                  </div>

                  <div className="flex gap-2">
                    <div className="w-24">
                      <Field label="পরীক্ষার সাল" value={qExamYear} onChange={setQExamYear} type="number" placeholder="2023" />
                    </div>
                    <div className="flex-1">
                      <Field label="শূন্যপদের প্রতিষ্ঠান (Vacancy)" value={qExamInstitute} onChange={setQExamInstitute} placeholder="যেমন: Bangladesh Bank, Ministry of Finance..." />
                    </div>
                  </div>
                  <Field label="পরীক্ষার পদ (Post)" value={qExamPost} onChange={setQExamPost} placeholder="AD (ICT), Assistant Programmer..." />

                  <Field label="টপিক (Topic)" value={qTopic} onChange={setQTopic} placeholder="যেমন: Array, OOP, বাংলাদেশের ইতিহাস..." />

                  <Field label="পরীক্ষা গ্রহণকারী প্রতিষ্ঠান (Exam Taker)" value={qExamTaker} onChange={setQExamTaker} placeholder="যেমন: BPSC, IBA, ব্যাংক নিয়োগ কমিটি..." />

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">কঠিনতার স্তর (Level)</label>
                    <div className="flex gap-1.5">
                      {(['EASY', 'MEDIUM', 'HARD'] as QuestionDifficulty[]).map((d) => (
                        <button key={d} type="button" onClick={() => setQDifficulty(d === qDifficulty ? '' : d)}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${qDifficulty === d ? 'bg-primary text-white border-primary' : 'border-warm-border text-gray-600 hover:border-primary'}`}>
                          {DIFFICULTY_LABEL[d]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label="ক্রম" value={qOrder} onChange={setQOrder} type="number" />

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={qPublished} onChange={(e) => setQPublished(e.target.checked)} className="rounded accent-primary w-4 h-4" />
                    <span className="font-medium text-gray-700">প্রকাশিত</span>
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button onClick={saveQ} className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors">
                      {editingQ ? 'আপডেট' : 'তৈরি করুন'}
                    </button>
                    {editingQ && <button onClick={resetQForm} className="px-3 text-warm-muted hover:text-gray-700 text-sm border border-warm-border rounded-xl">বাতিল</button>}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-3">
                  <BulkQuestionBankImport
                    token={token}
                    categoryId={Number(qCatId)}
                    existingCount={questions.length}
                    onDone={() => loadQuestions(qCatId)}
                  />

                  {qLoading ? (
                    <p className="text-sm text-warm-muted">লোড হচ্ছে...</p>
                  ) : questions.length === 0 ? (
                    <p className="text-sm text-warm-muted">এখনো কোনো প্রশ্ন নেই</p>
                  ) : (
                    questions.map((q, i) => (
                      <div key={q.id} className="bg-white rounded-xl border border-warm-border p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-gray-400 mt-0.5">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{TYPE_LABEL[q.questionType]}</span>
                              {q.published
                                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">প্রকাশিত</span>
                                : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">ড্রাফট</span>}
                              {(q.examInstitute || q.examPost || q.examYear) && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                  {[[q.examInstitute, q.examPost].filter(Boolean).join(' - '), q.examYear].filter(Boolean).join(' ')}
                                </span>
                              )}
                              {q.topic && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🏷 {q.topic}</span>
                              )}
                              {q.examTaker && (
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">🏛️ {q.examTaker}</span>
                              )}
                              {q.difficulty && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: DIFFICULTY_COLOR[q.difficulty].bg, color: DIFFICULTY_COLOR[q.difficulty].color }}>
                                  {DIFFICULTY_LABEL[q.difficulty]}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap">{q.questionText}</p>
                            {q.questionType === 'MCQ' && (
                              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                  const txt = opt === 'A' ? q.optionA : opt === 'B' ? q.optionB : opt === 'C' ? q.optionC : q.optionD;
                                  return (
                                    <span key={opt} className={`text-xs px-2 py-0.5 rounded-lg ${q.correctOption === opt ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100 text-gray-600'}`}>
                                      {opt}. {txt}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => { editQ(q); window.scrollTo(0, 0); }} className="text-xs text-blue-600 hover:underline">এডিট</button>
                            <button onClick={() => deleteQ(q.id)} className="text-xs text-red-500 hover:underline">মুছুন</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
