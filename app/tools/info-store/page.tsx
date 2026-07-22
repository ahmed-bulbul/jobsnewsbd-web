'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getInfoStore, saveInfoStore, uploadInfoStoreDocument, deleteInfoStoreDocument } from '@/lib/api';
import type { InfoStoreDocument } from '@/lib/types';

// ── Data shape ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'jobbd_info_store';

interface InfoStore {
  // Personal
  nameBn: string;
  nameEn: string;
  fatherBn: string;
  fatherEn: string;
  motherBn: string;
  motherEn: string;
  dob: string;
  nid: string;
  birthCert: string;
  bloodGroup: string;
  religion: string;
  nationality: string;
  quota: string;
  // Contact
  mobile: string;
  altMobile: string;
  email: string;
  teletalk: string;
  // Present address
  presentVillage: string;
  presentUnion: string;
  presentUpazila: string;
  presentDistrict: string;
  presentPost: string;
  // Permanent address
  sameAsPresent: boolean;
  permVillage: string;
  permUnion: string;
  permUpazila: string;
  permDistrict: string;
  permPost: string;
  // SSC
  sscBoard: string;
  sscYear: string;
  sscRoll: string;
  sscGpa: string;
  sscGroup: string;
  // HSC
  hscBoard: string;
  hscYear: string;
  hscRoll: string;
  hscGpa: string;
  hscGroup: string;
  // Graduation
  gradUniversity: string;
  gradSubject: string;
  gradYear: string;
  gradCgpa: string;
  gradDegree: string;
  // Masters
  mastersUniversity: string;
  mastersSubject: string;
  mastersYear: string;
  mastersCgpa: string;
  // Documents (photo, signature, certificates, etc.)
  documents: InfoStoreDocument[];
}

const EMPTY: InfoStore = {
  nameBn: '', nameEn: '', fatherBn: '', fatherEn: '', motherBn: '', motherEn: '',
  dob: '', nid: '', birthCert: '', bloodGroup: '', religion: 'ইসলাম', nationality: 'বাংলাদেশী',
  quota: 'প্রযোজ্য নয়',
  mobile: '', altMobile: '', email: '', teletalk: '',
  presentVillage: '', presentUnion: '', presentUpazila: '', presentDistrict: '', presentPost: '',
  sameAsPresent: false,
  permVillage: '', permUnion: '', permUpazila: '', permDistrict: '', permPost: '',
  sscBoard: '', sscYear: '', sscRoll: '', sscGpa: '', sscGroup: 'বিজ্ঞান',
  hscBoard: '', hscYear: '', hscRoll: '', hscGpa: '', hscGroup: 'বিজ্ঞান',
  gradUniversity: '', gradSubject: '', gradYear: '', gradCgpa: '', gradDegree: 'স্নাতক (সম্মান)',
  mastersUniversity: '', mastersSubject: '', mastersYear: '', mastersCgpa: '',
  documents: [],
};

const DOC_LABELS = [
  { bn: 'ছবি', en: 'Photo' },
  { bn: 'স্বাক্ষর', en: 'Signature' },
  { bn: 'জাতীয় পরিচয়পত্র', en: 'NID' },
  { bn: 'সার্টিফিকেট', en: 'Certificate' },
  { bn: 'মার্কশিট', en: 'Marksheet' },
  { bn: 'অন্যান্য', en: 'Other' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Copy helper ──────────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!value.trim()) return;
    navigator.clipboard.writeText(value.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="কপি করুন"
      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        copied
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : value.trim()
            ? 'bg-cream border-warm-border text-gray-600 hover:border-primary hover:text-primary'
            : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
      }`}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

// ── Field row ────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  options?: string[];
}

function Field({ label, value, onChange, placeholder, type = 'text', options }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <div className="flex gap-2">
        {options ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} className="input text-sm flex-1">
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="input text-sm flex-1"
          />
        )}
        <CopyBtn value={value} />
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-cream hover:bg-primary-50 transition-colors"
      >
        <span className="font-bold text-gray-800 flex items-center gap-2">
          <span>{icon}</span> {title}
        </span>
        <span className={`text-warm-muted transition-transform text-sm ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
}

// ── Document card ────────────────────────────────────────────────────────────

function DocumentCard({ doc, onDelete, t }: {
  doc: InfoStoreDocument; onDelete: () => void; t: (bn: string, en: string) => string;
}) {
  const isImage = doc.mimeType.startsWith('image/');
  return (
    <div className="flex items-center gap-3 border border-warm-border rounded-xl p-3 bg-white">
      {isImage ? (
        <img src={doc.url} alt={doc.label} className="w-14 h-14 rounded-lg object-cover border border-warm-border shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-2xl shrink-0">📄</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{doc.label}</p>
        <p className="text-xs text-warm-muted truncate">{doc.fileName}</p>
        <p className="text-xs text-warm-muted">{formatSize(doc.sizeBytes)}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          title={t('দেখুন', 'View')}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-cream border-warm-border text-gray-600 hover:border-primary hover:text-primary transition-colors"
        >
          👁
        </a>
        <button
          type="button"
          onClick={onDelete}
          title={t('মুছুন', 'Delete')}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-red-50 border-red-200 text-red-500 hover:bg-red-100 transition-colors"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ── Documents section ────────────────────────────────────────────────────────

function DocumentsSection({
  documents, loggedIn, uploadLabel, setUploadLabel, uploading, uploadError,
  fileInputRef, onFileSelected, onDelete, onLoginClick, t,
}: {
  documents: InfoStoreDocument[];
  loggedIn: boolean;
  uploadLabel: string;
  setUploadLabel: (v: string) => void;
  uploading: boolean;
  uploadError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File | null) => void;
  onDelete: (doc: InfoStoreDocument) => void;
  onLoginClick: () => void;
  t: (bn: string, en: string) => string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-cream hover:bg-primary-50 transition-colors"
      >
        <span className="font-bold text-gray-800 flex items-center gap-2">
          <span>📎</span> {t('নথি ও ছবি', 'Documents & Photos')}
          {documents.length > 0 && (
            <span className="text-xs font-normal text-warm-muted">({documents.length})</span>
          )}
        </span>
        <span className={`text-warm-muted transition-transform text-sm ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="p-5 space-y-4">
          <p className="text-xs text-warm-muted -mt-1">
            {t('ছবি, স্বাক্ষর, সার্টিফিকেট বা অন্য যেকোনো ডকুমেন্ট (JPG/PNG/WEBP/PDF, সর্বোচ্চ ৫MB) যুক্ত করুন।', 'Add your photo, signature, certificates, or any other document (JPG/PNG/WEBP/PDF, max 5MB).')}
          </p>

          {!loggedIn ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-center justify-between gap-3 flex-wrap">
              <span className="flex items-start gap-2">
                <span>⚠️</span>
                <span>{t('ফাইল যুক্ত করতে লগইন করুন।', 'Please log in to add files.')}</span>
              </span>
              <button
                onClick={onLoginClick}
                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {t('লগইন করুন', 'Log In')}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={uploadLabel}
                onChange={(e) => setUploadLabel(e.target.value)}
                className="input text-sm w-auto"
              >
                {DOC_LABELS.map((d) => <option key={d.bn} value={d.bn}>{t(d.bn, d.en)}</option>)}
              </select>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="btn-outline text-xs px-3 py-2 disabled:opacity-60"
              >
                {uploading ? t('আপলোড হচ্ছে...', 'Uploading...') : `📤 ${t('ফাইল যুক্ত করুন', 'Add File')}`}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

          {documents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onDelete={() => onDelete(doc)} t={t} />
              ))}
            </div>
          )}

          {loggedIn && documents.length === 0 && (
            <p className="text-center text-xs text-warm-muted py-4">
              {t('এখনো কোনো ফাইল যুক্ত করা হয়নি', 'No files added yet')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function InfoStorePage() {
  const { user, openModal } = useAuth();
  const { t } = useLanguage();
  const [info, setInfo] = useState<InfoStore>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load: server for logged-in users, localStorage for guests
  useEffect(() => {
    const load = async () => {
      try {
        if (user?.token) {
          const raw = await getInfoStore(user.token);
          setInfo({ ...EMPTY, ...JSON.parse(raw) });
        } else {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setInfo({ ...EMPTY, ...JSON.parse(raw) });
        }
      } catch { /* ignore parse errors */ }
      setLoading(false);
    };
    load();
  }, [user?.token]);

  const persist = (next: InfoStore) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        if (user?.token) {
          await saveInfoStore(user.token, next);
        } else {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch { /* silent */ }
    }, 600);
  };

  const set = (key: keyof InfoStore, value: string | boolean) => {
    setInfo((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'sameAsPresent' && value === true) {
        next.permVillage   = prev.presentVillage;
        next.permUnion     = prev.presentUnion;
        next.permUpazila   = prev.presentUpazila;
        next.permDistrict  = prev.presentDistrict;
        next.permPost      = prev.presentPost;
      }
      persist(next);
      return next;
    });
  };

  const setDocuments = (docs: InfoStoreDocument[]) => {
    setInfo((prev) => {
      const next = { ...prev, documents: docs };
      persist(next);
      return next;
    });
  };

  // ── Document upload ─────────────────────────────────────────────────────────
  const [uploadLabel, setUploadLabel] = useState(DOC_LABELS[0].bn);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setUploadError('');
    if (!user?.token) {
      setUploadError(t('ফাইল যুক্ত করতে লগইন করুন', 'Please log in to add files'));
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(t('শুধুমাত্র JPG, PNG, WEBP অথবা PDF ফাইল সমর্থিত', 'Only JPG, PNG, WEBP or PDF files are supported'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('ফাইলের আকার সর্বোচ্চ ৫ মেগাবাইট হতে পারবে', 'File size must be under 5MB'));
      return;
    }
    setUploading(true);
    try {
      const meta = await uploadInfoStoreDocument(user.token, file);
      const doc: InfoStoreDocument = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: uploadLabel,
        ...meta,
      };
      setDocuments([...info.documents, doc]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('আপলোড ব্যর্থ হয়েছে', 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = (doc: InfoStoreDocument) => {
    if (!confirm(t('এই ফাইলটি মুছে ফেলবেন?', 'Delete this file?'))) return;
    setDocuments(info.documents.filter((d) => d.id !== doc.id));
    if (user?.token) {
      deleteInfoStoreDocument(user.token, doc.url).catch(() => {});
    }
  };

  const handleClear = async () => {
    if (!confirm('সব তথ্য মুছে ফেলবেন?')) return;
    setInfo(EMPTY);
    if (user?.token) {
      await saveInfoStore(user.token, EMPTY);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const copyAll = () => {
    const lines = [
      `নাম (বাংলা): ${info.nameBn}`,
      `নাম (ইংরেজি): ${info.nameEn}`,
      `পিতার নাম (বাংলা): ${info.fatherBn}`,
      `পিতার নাম (ইংরেজি): ${info.fatherEn}`,
      `মাতার নাম (বাংলা): ${info.motherBn}`,
      `মাতার নাম (ইংরেজি): ${info.motherEn}`,
      `জন্মতারিখ: ${info.dob}`,
      `জাতীয় পরিচয়পত্র নম্বর: ${info.nid}`,
      `রক্তের গ্রুপ: ${info.bloodGroup}`,
      `ধর্ম: ${info.religion}`,
      `জাতীয়তা: ${info.nationality}`,
      `কোটা: ${info.quota}`,
      `মোবাইল: ${info.mobile}`,
      `ইমেইল: ${info.email}`,
      `বর্তমান ঠিকানা: ${[info.presentVillage, info.presentUnion, info.presentUpazila, info.presentDistrict].filter(Boolean).join(', ')}`,
      `স্থায়ী ঠিকানা: ${[info.permVillage, info.permUnion, info.permUpazila, info.permDistrict].filter(Boolean).join(', ')}`,
      `SSC: ${info.sscBoard} বোর্ড, ${info.sscYear}, GPA ${info.sscGpa}`,
      `HSC: ${info.hscBoard} বোর্ড, ${info.hscYear}, GPA ${info.hscGpa}`,
      `স্নাতক: ${info.gradUniversity}, ${info.gradSubject}, ${info.gradYear}, CGPA ${info.gradCgpa}`,
    ].filter((l) => !l.endsWith(': ')).join('\n');
    navigator.clipboard.writeText(lines);
  };

  const f = (key: keyof InfoStore) => ({
    value: info[key] as string,
    onChange: (v: string) => set(key, v),
  });

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/tools" className="hover:text-primary transition-colors">{t('টুলস', 'Tools')}</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">{t('তথ্য সংরক্ষণ', 'Info Store')}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('তথ্য সংরক্ষণ', 'Info Store')}</h1>
            <p className="mt-1 text-sm text-warm-muted">
              {t('একবার সেভ করুন — যেকোনো আবেদন ফর্মে 📋 বোতাম দিয়ে কপি করুন', 'Save once — copy into any application form with the 📋 button')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {saved && <span className="text-xs text-emerald-600 font-medium">✓ {t('সংরক্ষিত', 'Saved')}</span>}
            {cleared && <span className="text-xs text-red-500 font-medium">{t('মুছে ফেলা হয়েছে', 'Cleared')}</span>}
            <button type="button" onClick={copyAll} className="btn-outline text-xs px-3 py-2">
              📋 {t('সব কপি করুন', 'Copy All')}
            </button>
            <button type="button" onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-2 rounded-lg transition-colors">
              🗑 {t('সব মুছুন', 'Clear All')}
            </button>
          </div>
        </div>

        {/* Auth-aware notice */}
        {user ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800 mb-6 flex items-start gap-2">
            <span className="mt-0.5">☁️</span>
            <span>{t('আপনার তথ্য আপনার অ্যাকাউন্টে সেভ হচ্ছে — যেকোনো ডিভাইস থেকে ব্যবহার করতে পারবেন।', 'Your info is saved to your account — accessible from any device.')}</span>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 mb-6 flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-start gap-2">
              <span>⚠️</span>
              <span>{t('এখন শুধু এই ডিভাইসে সেভ হচ্ছে। লগইন করলে যেকোনো ডিভাইস থেকে ব্যবহার করতে পারবেন।', 'Currently saved on this device only. Log in to access from any device.')}</span>
            </span>
            <button
              onClick={() => openModal('login')}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {t('লগইন করুন', 'Log In')}
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 text-warm-muted">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">{t('তথ্য লোড হচ্ছে...', 'Loading your info...')}</p>
          </div>
        )}

        {!loading && (<><div className="space-y-4">

          {/* Documents & Photos */}
          <DocumentsSection
            documents={info.documents}
            loggedIn={!!user}
            uploadLabel={uploadLabel}
            setUploadLabel={setUploadLabel}
            uploading={uploading}
            uploadError={uploadError}
            fileInputRef={fileInputRef}
            onFileSelected={handleFileSelected}
            onDelete={handleDeleteDoc}
            onLoginClick={() => openModal('login')}
            t={t}
          />

          {/* Personal */}
          <Section title={t('ব্যক্তিগত তথ্য', 'Personal Info')} icon="🧑">
            <Field label={t('নাম (বাংলা)', 'Name (Bengali)')} placeholder="মোঃ রাহেলা বেগম" {...f('nameBn')} />
            <Field label={t('নাম (ইংরেজি)', 'Name (English)')} placeholder="Md. Rahela Begum" {...f('nameEn')} />
            <Field label={t('পিতার নাম (বাংলা)', "Father's Name (Bengali)")} placeholder="মোঃ আব্দুল করিম" {...f('fatherBn')} />
            <Field label={t('পিতার নাম (ইংরেজি)', "Father's Name (English)")} placeholder="Md. Abdul Karim" {...f('fatherEn')} />
            <Field label={t('মাতার নাম (বাংলা)', "Mother's Name (Bengali)")} placeholder="মোছাঃ রহিমা বেগম" {...f('motherBn')} />
            <Field label={t('মাতার নাম (ইংরেজি)', "Mother's Name (English)")} placeholder="Mst. Rahima Begum" {...f('motherEn')} />
            <Field label={t('জন্মতারিখ', 'Date of Birth')} type="date" {...f('dob')} />
            <Field label={t('জাতীয় পরিচয়পত্র নম্বর (NID)', 'NID Number')} placeholder="১৯৯XXXXXXXXX" {...f('nid')} />
            <Field label={t('জন্ম নিবন্ধন নম্বর', 'Birth Certificate No.')} placeholder="XXXXXXXXXXXXXXXXXX" {...f('birthCert')} />
            <Field label={t('রক্তের গ্রুপ', 'Blood Group')} options={['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} {...f('bloodGroup')} />
            <Field label={t('ধর্ম', 'Religion')} options={['ইসলাম', 'হিন্দু', 'বৌদ্ধ', 'খ্রিস্টান', 'অন্যান্য']} {...f('religion')} />
            <Field label={t('জাতীয়তা', 'Nationality')} options={['বাংলাদেশী', 'Bangladeshi']} {...f('nationality')} />
            <Field
              label={t('কোটা', 'Quota')}
              options={['প্রযোজ্য নয়', 'মুক্তিযোদ্ধা কোটা', 'নারী কোটা', 'প্রতিবন্ধী কোটা', 'উপজাতি কোটা', 'জেলা কোটা']}
              {...f('quota')}
            />
          </Section>

          {/* Contact */}
          <Section title={t('যোগাযোগ', 'Contact')} icon="📞">
            <Field label={t('মোবাইল নম্বর', 'Mobile Number')} placeholder="01XXXXXXXXX" type="tel" {...f('mobile')} />
            <Field label={t('বিকল্প মোবাইল', 'Alt. Mobile')} placeholder="01XXXXXXXXX" type="tel" {...f('altMobile')} />
            <Field label={t('ইমেইল ঠিকানা', 'Email Address')} placeholder="name@gmail.com" type="email" {...f('email')} />
            <Field label={t('টেলিটক নম্বর (আবেদন ফি)', 'Teletalk No. (Application Fee)')} placeholder="01XXXXXXXXX" type="tel" {...f('teletalk')} />
          </Section>

          {/* Present Address */}
          <Section title={t('বর্তমান ঠিকানা', 'Present Address')} icon="🏠">
            <Field label={t('গ্রাম / মহল্লা', 'Village / Locality')} placeholder="গ্রামের নাম" {...f('presentVillage')} />
            <Field label={t('ইউনিয়ন / ওয়ার্ড', 'Union / Ward')} placeholder="ইউনিয়নের নাম" {...f('presentUnion')} />
            <Field label={t('উপজেলা / থানা', 'Upazila / Thana')} placeholder="উপজেলার নাম" {...f('presentUpazila')} />
            <Field label={t('জেলা', 'District')} placeholder="জেলার নাম" {...f('presentDistrict')} />
            <Field label={t('পোস্ট কোড', 'Post Code')} placeholder="XXXX" {...f('presentPost')} />
          </Section>

          {/* Permanent Address */}
          <Section title={t('স্থায়ী ঠিকানা', 'Permanent Address')} icon="🏡">
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={info.sameAsPresent}
                  onChange={(e) => set('sameAsPresent', e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                {t('বর্তমান ঠিকানার মতো একই', 'Same as present address')}
              </label>
            </div>
            {!info.sameAsPresent && (
              <>
                <Field label={t('গ্রাম / মহল্লা', 'Village / Locality')} placeholder="গ্রামের নাম" {...f('permVillage')} />
                <Field label={t('ইউনিয়ন / ওয়ার্ড', 'Union / Ward')} placeholder="ইউনিয়নের নাম" {...f('permUnion')} />
                <Field label={t('উপজেলা / থানা', 'Upazila / Thana')} placeholder="উপজেলার নাম" {...f('permUpazila')} />
                <Field label={t('জেলা', 'District')} placeholder="জেলার নাম" {...f('permDistrict')} />
                <Field label={t('পোস্ট কোড', 'Post Code')} placeholder="XXXX" {...f('permPost')} />
              </>
            )}
          </Section>

          {/* SSC */}
          <Section title={t('SSC / সমমান', 'SSC / Equivalent')} icon="🏫" defaultOpen={false}>
            <Field label={t('বোর্ড', 'Board')} options={['', 'ঢাকা', 'রাজশাহী', 'চট্টগ্রাম', 'বরিশাল', 'সিলেট', 'কুমিল্লা', 'যশোর', 'দিনাজপুর', 'ময়মনসিংহ', 'মাদ্রাসা', 'কারিগরি']} {...f('sscBoard')} />
            <Field label={t('পাসের সাল', 'Passing Year')} placeholder="২০১৫" {...f('sscYear')} />
            <Field label={t('রোল নম্বর', 'Roll Number')} placeholder="XXXXXX" {...f('sscRoll')} />
            <Field label="GPA" placeholder="৫.০০" {...f('sscGpa')} />
            <Field label={t('বিভাগ', 'Group')} options={['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা']} {...f('sscGroup')} />
          </Section>

          {/* HSC */}
          <Section title={t('HSC / সমমান', 'HSC / Equivalent')} icon="🏛️" defaultOpen={false}>
            <Field label={t('বোর্ড', 'Board')} options={['', 'ঢাকা', 'রাজশাহী', 'চট্টগ্রাম', 'বরিশাল', 'সিলেট', 'কুমিল্লা', 'যশোর', 'দিনাজপুর', 'ময়মনসিংহ', 'মাদ্রাসা', 'কারিগরি']} {...f('hscBoard')} />
            <Field label={t('পাসের সাল', 'Passing Year')} placeholder="২০১৭" {...f('hscYear')} />
            <Field label={t('রোল নম্বর', 'Roll Number')} placeholder="XXXXXX" {...f('hscRoll')} />
            <Field label="GPA" placeholder="৫.০০" {...f('hscGpa')} />
            <Field label={t('বিভাগ', 'Group')} options={['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা']} {...f('hscGroup')} />
          </Section>

          {/* Graduation */}
          <Section title={t('স্নাতক / স্নাতক (সম্মান)', 'Bachelor\'s Degree')} icon="🎓" defaultOpen={false}>
            <Field label={t('ডিগ্রির ধরন', 'Degree Type')} options={['স্নাতক (সম্মান)', 'স্নাতক (পাস)', 'B.Sc Engineering', 'MBBS', 'LLB', 'BBA']} {...f('gradDegree')} />
            <Field label={t('বিশ্ববিদ্যালয় / ইন্সটিটিউট', 'University / Institute')} placeholder="ঢাকা বিশ্ববিদ্যালয়" {...f('gradUniversity')} />
            <Field label={t('বিষয় / বিভাগ', 'Subject / Department')} placeholder="কম্পিউটার বিজ্ঞান" {...f('gradSubject')} />
            <Field label={t('পাসের সাল', 'Passing Year')} placeholder="২০২১" {...f('gradYear')} />
            <Field label={t('CGPA / শ্রেণী', 'CGPA / Class')} placeholder="৩.৮০ / ৪.০০" {...f('gradCgpa')} />
          </Section>

          {/* Masters */}
          <Section title={t('মাস্টার্স / স্নাতকোত্তর', "Master's Degree")} icon="🎓" defaultOpen={false}>
            <Field label={t('বিশ্ববিদ্যালয় / ইন্সটিটিউট', 'University / Institute')} placeholder="ঢাকা বিশ্ববিদ্যালয়" {...f('mastersUniversity')} />
            <Field label={t('বিষয় / বিভাগ', 'Subject / Department')} placeholder="লোক প্রশাসন" {...f('mastersSubject')} />
            <Field label={t('পাসের সাল', 'Passing Year')} placeholder="২০২৩" {...f('mastersYear')} />
            <Field label={t('CGPA / শ্রেণী', 'CGPA / Class')} placeholder="৩.৭০ / ৪.০০" {...f('mastersCgpa')} />
          </Section>

        </div>

        <p className="mt-6 text-center text-xs text-warm-muted">
          {t('তথ্য স্বয়ংক্রিয়ভাবে সেভ হয় — ব্রাউজার বন্ধ করলেও থেকে যাবে', 'Data saves automatically — persists even after closing the browser')}
        </p>
        </>)}
      </main>
      <Footer />
    </>
  );
}
