'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
        <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow z-50 text-sm">{msg}</div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/dashboard" className="text-sm text-indigo-600 hover:underline mb-1 inline-block">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-900">Exam Centers</h1>
            <p className="text-sm text-gray-500">{centers.length} centers</p>
          </div>
          <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            + Add Center
          </button>
        </div>

        {/* Centers table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {centers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No exam centers yet.</div>
          ) : (
            <table className="w-full text-sm">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
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
