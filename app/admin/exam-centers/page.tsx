'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { jsonrepair } from 'jsonrepair';
import {
  adminGetExamCenters,
  adminCreateExamCenter,
  adminUpdateExamCenter,
  adminDeleteExamCenter,
  adminUploadExamCenterPhoto,
} from '@/lib/api';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import Table, { type TableColumn } from '@/components/admin/Table';
import Modal from '@/components/admin/Modal';
import type { ExamCenterSummary } from '@/lib/types';

const EMPTY_FORM = { nameBn: '', nameEn: '', area: '', address: '', mapsUrl: '' };

// ── AI bulk import (JSON paste) ─────────────────────────────────────────────
// Mirrors BulkQuestionBankImport in web/app/admin/question-bank/page.tsx: no
// dedicated backend bulk endpoint — this loops the existing single-item
// POST /api/admin/exam-centers create call once per parsed item.

function BulkExamCenterImport({
  token,
  onDone,
}: {
  token: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [areaHint, setAreaHint] = useState('');
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [parseErrorDetail, setParseErrorDetail] = useState('');

  const promptTemplate = (area: string) => `তুমি একজন ডেটা এক্সট্র্যাক্ট করার বিশেষজ্ঞ। এলাকা: ${area ? `"${area}"` : '[এলাকার নাম এখানে লিখুন, যেমন: যাত্রাবাড়ী]'}

আমি এর পরের মেসেজে পরীক্ষা কেন্দ্রের (স্কুল/কলেজ) একটি তালিকা দেব — টেক্সট, ছবি, অথবা কোনো ওয়েবসাইট/লিস্ট থেকে কপি করা কনটেন্ট আকারে। প্রতিটি প্রতিষ্ঠানকে একটি পরীক্ষা কেন্দ্র হিসেবে ধরে নিচের ফরম্যাটে একটি JSON অ্যারে দাও — অন্য কোনো লেখা, ভূমিকা, ব্যাখ্যা বা \`\`\` কোড ফেন্স ছাড়া:

[
  { "nameBn": "বাংলা নাম (আবশ্যক)", "nameEn": "English name (থাকলে দাও, না থাকলে null)", "area": "এলাকা/থানা (আবশ্যক)", "address": "সম্পূর্ণ ঠিকানা (আবশ্যক)", "mapsUrl": "Google Maps লিংক (থাকলে দাও, না থাকলে null)" }
]

নিয়ম:
- "nameBn", "area", "address" — এই তিনটি ফিল্ড কখনো খালি রাখা যাবে না; প্রতিষ্ঠানের নাম বাংলায় না পেলে ইংরেজি নামটাই "nameBn"-এ বসাও।
- "nameEn" ও "mapsUrl" ঐচ্ছিক — নিশ্চিত না হলে null দাও, অনুমান করে বানিয়ে দিও না।
- "address" যতটা সম্ভব বিস্তারিত দাও (রোড/এলাকা/থানা/জেলা) — শুধু এলাকার নাম পুনরাবৃত্তি কোরো না, যদি আলাদা তথ্য থাকে।
- একই প্রতিষ্ঠান দুইবার তালিকায় থাকলে একবারই দাও।

⚠️ বৈধ JSON বাধ্যতামূলক (এটি সবচেয়ে গুরুত্বপূর্ণ নিয়ম):
- প্রতিটি স্ট্রিং ভ্যালুতে ডাবল-কোট (") থাকলে \\" দিয়ে এস্কেপ করো, নতুন লাইন থাকলে \\n দিয়ে।
- আউটপুট দেওয়ার আগে নিজে মানসিকভাবে যাচাই করো যে পুরো আউটপুটটি JSON.parse() দিয়ে সরাসরি পার্স করা যাবে — কোনো ট্রেইলিং কমা বা আনক্লোজড কোট থাকা যাবে না।
- আউটপুট শুধু JSON অ্যারে — কোনো ভূমিকা, উপসংহার বা কোড ব্লক মার্কার নয়।`;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptTemplate(areaHint));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — ignore */ }
  };

  // Same straight-parse → jsonrepair-fallback approach as the Question Bank
  // bulk importer, since AI JSON output isn't guaranteed strictly valid.
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
        `বৈধ JSON অ্যারে পাওয়া যায়নি — অটো-ফিক্সও ব্যর্থ হয়েছে।` +
        (parseErrorDetail ? ` (টেকনিক্যাল ত্রুটি: ${parseErrorDetail})` : '')
      );
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i] as Record<string, unknown>;
      const missing = ['nameBn', 'area', 'address']
        .filter((k) => typeof it[k] !== 'string' || !(it[k] as string).trim());
      if (missing.length > 0) {
        setError(`কেন্দ্র ${i + 1}: এই ফিল্ডগুলো নেই বা খালি — ${missing.join(', ')}`);
        return;
      }
    }

    setBusy(true);
    setProgress({ done: 0, total: items.length });
    let successCount = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i] as Record<string, unknown>;
      const body = {
        nameBn: String(it.nameBn).trim(),
        nameEn: it.nameEn ? String(it.nameEn).trim() : '',
        area: String(it.area).trim(),
        address: String(it.address).trim(),
        mapsUrl: it.mapsUrl ? String(it.mapsUrl).trim() : '',
      };
      try {
        await adminCreateExamCenter(token, body);
        successCount++;
        setProgress({ done: i + 1, total: items.length });
      } catch {
        setBusy(false);
        setError(`কেন্দ্র ${i + 1} সংরক্ষণ ব্যর্থ হয়েছে — এর আগের ${successCount}টি ঠিকভাবে যোগ হয়েছে, বাকিগুলো আবার চেষ্টা করুন।`);
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
        className="w-full border-2 border-dashed border-indigo-200 bg-indigo-50/60 rounded-xl py-2.5 text-sm text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors mb-4">
        ✨ AI দিয়ে বাল্ক এক্সাম সেন্টার যোগ করুন
      </button>
    );
  }

  return (
    <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">✨ AI দিয়ে বাল্ক এক্সাম সেন্টার যোগ করুন</h3>
        <button onClick={() => { setOpen(false); setRaw(''); setError(''); }} className="text-xs text-gray-500 hover:text-gray-700">বন্ধ করুন</button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        ১) এলাকা লিখে প্রম্পট কপি করুন → ২) যেকোনো AI চ্যাটে (ChatGPT/Claude/Gemini) পেস্ট করে কেন্দ্রের তালিকা (টেক্সট/ছবি) যোগ করুন → ৩) AI-এর JSON আউটপুট নিচে পেস্ট করে একবারে সব কেন্দ্র যোগ করুন।
      </p>

      <div className="flex gap-2">
        <input type="text" value={areaHint} onChange={(e) => setAreaHint(e.target.value)}
          placeholder="এলাকা (যেমন: যাত্রাবাড়ী)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        <button type="button" onClick={copyPrompt}
          className="shrink-0 px-3 py-2 text-xs font-semibold border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50">
          {copied ? '✓ কপি হয়েছে' : '📋 প্রম্পট কপি করুন'}
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">AI-এর JSON আউটপুট এখানে পেস্ট করুন</label>
        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8}
          placeholder='[{"nameBn": "...", "nameEn": "...", "area": "...", "address": "...", "mapsUrl": null}]'
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 resize-y" />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {progress && <p className="text-xs text-indigo-700 font-medium">{progress.done}/{progress.total} কেন্দ্র যোগ হয়েছে...</p>}

      <button onClick={submitAll} disabled={busy || !raw.trim()}
        className="w-full bg-indigo-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
        {busy ? 'যোগ হচ্ছে...' : 'সব কেন্দ্র এক ক্লিকে যোগ করুন'}
      </button>
    </div>
  );
}

export default function AdminExamCentersPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [adminName, setAdminName] = useState('');
  const [centers, setCenters] = useState<ExamCenterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExamCenterSummary | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [photoTarget, setPhotoTarget] = useState<ExamCenterSummary | null>(null);
  const [uploading, setUploading] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = useCallback(async (t: string) => {
    const data = await adminGetExamCenters(t);
    setCenters(data);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    const n = localStorage.getItem('admin_name');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    setAdminName(n ?? 'Admin');
    load(t).finally(() => setLoading(false));
  }, [router, load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (c: ExamCenterSummary) => {
    setEditing(c);
    setForm({ nameBn: c.nameBn, nameEn: c.nameEn, area: c.area, address: c.address, mapsUrl: c.mapsUrl ?? '' });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminUpdateExamCenter(token, editing.id, form);
        flash(`হালনাগাদ হয়েছে: ${form.nameBn}`);
      } else {
        await adminCreateExamCenter(token, form);
        flash(`যোগ হয়েছে: ${form.nameBn}`);
      }
      await load(token);
      setShowForm(false);
    } catch {
      flash('সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: ExamCenterSummary) => {
    if (!confirm(`"${c.nameBn}" মুছে ফেলবেন? এর সব টিপস ও ভোটও মুছে যাবে।`)) return;
    try {
      await adminDeleteExamCenter(token, c.id);
      setCenters((prev) => prev.filter((x) => x.id !== c.id));
      flash('মুছে ফেলা হয়েছে');
    } catch {
      flash('মুছতে সমস্যা হয়েছে');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTarget) return;
    setUploading(true);
    try {
      await adminUploadExamCenterPhoto(token, photoTarget.id, file);
      await load(token);
      setPhotoTarget(null);
      flash('ছবি আপলোড হয়েছে');
    } catch {
      flash('ছবি আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
    }
  };

  const columns: TableColumn<ExamCenterSummary>[] = [
    {
      key: 'photo',
      header: 'ছবি',
      render: (c) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream flex items-center justify-center shrink-0">
          {c.photoUrl
            ? <Image src={c.photoUrl} alt={c.nameBn} width={48} height={48} className="object-cover w-full h-full" />
            : <span className="text-warm-muted text-lg">🏫</span>}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'নাম',
      render: (c) => (
        <>
          <p className="font-medium text-gray-900">{c.nameBn}</p>
          <p className="text-xs text-warm-muted">{c.nameEn}</p>
        </>
      ),
    },
    { key: 'area', header: 'এলাকা', render: (c) => <span className="text-gray-700">{c.area}</span> },
    { key: 'tips', header: 'টিপস', render: (c) => <span className="text-gray-700">{c.tipCount}</span> },
    {
      key: 'votes',
      header: 'মোবাইল ভোট',
      render: (c) => (
        <span>
          <span className="text-emerald-700">✅ {c.mobileAllowed}</span>
          {' / '}
          <span className="text-red-600">❌ {c.mobileNotAllowed}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'কার্যক্রম',
      align: 'right',
      render: (c) => (
        <div className="flex items-center gap-2 justify-end">
          <button onClick={() => setPhotoTarget(c)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">ছবি</button>
          <button onClick={() => openEdit(c)} className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">সম্পাদনা</button>
          <button onClick={() => handleDelete(c)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">মুছুন</button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell title="পরীক্ষা কেন্দ্র" subtitle={`${centers.length}টি কেন্দ্র`} adminName={adminName} token={token}>
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
              title="পরীক্ষা কেন্দ্রের তালিকা"
              actions={<button onClick={openCreate} className="btn-primary">+ কেন্দ্র যোগ করুন</button>}
            />

            <BulkExamCenterImport token={token} onDone={() => load(token)} />

            <Table columns={columns} data={centers} rowKey={(c) => c.id} emptyMessage="কোনো পরীক্ষা কেন্দ্র নেই" />
          </>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'কেন্দ্র সম্পাদনা' : 'কেন্দ্র যোগ করুন'} maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-3">
          {[
            { label: 'নাম (বাংলা)', key: 'nameBn', required: true },
            { label: 'নাম (ইংরেজি)', key: 'nameEn', required: true },
            { label: 'এলাকা', key: 'area', required: true },
            { label: 'ঠিকানা', key: 'address', required: true },
            { label: 'Google Maps URL', key: 'mapsUrl', required: false },
          ].map(({ label, key, required }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required}
                className="input"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 justify-center">বাতিল</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? 'সংরক্ষণ হচ্ছে...' : editing ? 'হালনাগাদ করুন' : 'তৈরি করুন'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!photoTarget} onClose={() => setPhotoTarget(null)} title="ছবি আপলোড করুন" maxWidth="max-w-sm">
        {photoTarget && (
          <>
            <p className="text-sm text-warm-muted mb-4">{photoTarget.nameBn}</p>
            {photoTarget.photoUrl && (
              <div className="relative h-32 mb-4 rounded-lg overflow-hidden">
                <Image src={photoTarget.photoUrl} alt={photoTarget.nameBn} fill className="object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {uploading && <p className="text-sm text-primary-600 mt-2">আপলোড হচ্ছে...</p>}
            <button onClick={() => setPhotoTarget(null)} className="btn-outline w-full justify-center mt-4">বন্ধ করুন</button>
          </>
        )}
      </Modal>
    </AdminShell>
  );
}
