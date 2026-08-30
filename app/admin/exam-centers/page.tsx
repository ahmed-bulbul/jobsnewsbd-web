'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { jsonrepair } from 'jsonrepair';
import {
  adminGetExamCenters,
  adminCreateExamCenter,
  adminUpdateExamCenter,
  adminDeleteExamCenter,
  adminUploadExamCenterPhoto,
  adminDeleteCenterTip,
} from '@/lib/api';
import type { ExamCenterDetail, ExamCenterSummary } from '@/lib/types';

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
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
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
        flash(`Updated: ${form.nameBn}`);
      } else {
        await adminCreateExamCenter(token, form);
        flash(`Created: ${form.nameBn}`);
      }
      await load(token);
      setShowForm(false);
    } catch {
      flash('Error saving center');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: ExamCenterSummary) => {
    if (!confirm(`Delete "${c.nameBn}"? This removes all tips and votes.`)) return;
    try {
      await adminDeleteExamCenter(token, c.id);
      setCenters((prev) => prev.filter((x) => x.id !== c.id));
      flash('Deleted');
    } catch {
      flash('Error deleting');
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
      flash('Photo uploaded');
    } catch {
      flash('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {msg && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs bg-indigo-600 text-white px-4 py-2 rounded-lg shadow z-50 text-sm">{msg}</div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-indigo-600 hover:underline mb-1 inline-block">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-900">Exam Centers</h1>
            <p className="text-sm text-gray-500">{centers.length} centers</p>
          </div>
          <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors self-start sm:self-auto">
            + Add Center
          </button>
        </div>

        <BulkExamCenterImport token={token} onDone={() => load(token)} />

        {/* Centers table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {centers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No exam centers yet.</div>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Photo</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Area</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Tips</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Mobile Votes</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {centers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {c.photoUrl
                          ? <Image src={c.photoUrl} alt={c.nameBn} width={48} height={48} className="object-cover w-full h-full" />
                          : <span className="text-gray-400 text-lg">🏫</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.nameBn}</p>
                      <p className="text-xs text-gray-500">{c.nameEn}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.area}</td>
                    <td className="px-4 py-3 text-gray-700">{c.tipCount}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-700">✅ {c.mobileAllowed}</span>
                      {' / '}
                      <span className="text-red-600">❌ {c.mobileNotAllowed}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setPhotoTarget(c)}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        >
                          Photo
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Center' : 'Add Center'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              {[
                { label: 'Name (Bengali)', key: 'nameBn', required: true },
                { label: 'Name (English)', key: 'nameEn', required: true },
                { label: 'Area', key: 'area', required: true },
                { label: 'Address', key: 'address', required: true },
                { label: 'Google Maps URL', key: 'mapsUrl', required: false },
              ].map(({ label, key, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required={required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo upload modal */}
      {photoTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Upload Photo</h2>
            <p className="text-sm text-gray-500 mb-4">{photoTarget.nameBn}</p>
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
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {uploading && <p className="text-sm text-indigo-600 mt-2">Uploading...</p>}
            <button onClick={() => setPhotoTarget(null)} className="mt-4 w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
