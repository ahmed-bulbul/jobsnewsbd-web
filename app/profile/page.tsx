'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getUserProfile, getSavedJobs, updateSavedJob, removeSavedJob, updateUserProfile, uploadProfilePhoto, removeProfilePhoto } from '@/lib/api';
import { getDaysRemaining, formatEnDate, formatBanglaDate } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { UserProfile, UserSavedJob, SavedJobStatus } from '@/lib/types';

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<SavedJobStatus, { label: string; labelEn: string; color: string; bg: string; dot: string }> = {
  SAVED:     { label: 'সংরক্ষিত',   labelEn: 'Saved',      color: 'text-gray-600',   bg: 'bg-gray-100',    dot: 'bg-gray-400' },
  APPLIED:   { label: 'আবেদন করা',  labelEn: 'Applied',    color: 'text-blue-700',   bg: 'bg-blue-50',     dot: 'bg-blue-500' },
  INTERVIEW: { label: 'সাক্ষাৎকার', labelEn: 'Interview',  color: 'text-purple-700', bg: 'bg-purple-50',   dot: 'bg-purple-500' },
  OFFER:     { label: 'অফার',       labelEn: 'Offer',      color: 'text-green-700',  bg: 'bg-green-50',    dot: 'bg-green-500' },
  REJECTED:  { label: 'প্রত্যাখ্যাত', labelEn: 'Rejected', color: 'text-red-700',    bg: 'bg-red-50',      dot: 'bg-red-400' },
  WITHDRAWN: { label: 'প্রত্যাহার', labelEn: 'Withdrawn',  color: 'text-warm-muted', bg: 'bg-gray-50',     dot: 'bg-gray-300' },
};

const STATUSES = Object.keys(STATUS_CONFIG) as SavedJobStatus[];

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ icon, value, bn, en, highlight }: { icon: string; value: number; bn: string; en: string; highlight?: boolean }) {
  const { t } = useLanguage();
  return (
    <div className={`rounded-2xl p-4 text-center border ${highlight && value > 0 ? 'bg-primary-50 border-primary-200' : 'bg-white border-warm-border'}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${highlight && value > 0 ? 'text-primary' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-warm-muted mt-0.5">{t(bn, en)}</div>
    </div>
  );
}

/* ─── Application card ───────────────────────────────────────────────────── */
function ApplicationCard({
  item, onStatusChange, onNotesChange, onRemove,
}: {
  item: UserSavedJob;
  onStatusChange: (id: number, status: SavedJobStatus) => void;
  onNotesChange: (id: number, notes: string) => void;
  onRemove: (id: number) => void;
}) {
  const { lang, t } = useLanguage();
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [saving, setSaving] = useState(false);
  const cfg = STATUS_CONFIG[item.status];
  const days = getDaysRemaining(item.post.applicationEnd);
  const isUrgent = days > 0 && days <= 3;
  const isExpired = days <= 0 && item.post.applicationEnd;
  const title = lang === 'bn' && item.post.titleBn ? item.post.titleBn : item.post.titleEn;

  const handleNotesSave = async () => {
    setSaving(true);
    await onNotesChange(item.id, notes);
    setSaving(false);
    setNotesOpen(false);
  };

  return (
    <div className="card p-5 space-y-3 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {item.post.organizationName && (
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1 truncate">
              {item.post.organizationName}
            </p>
          )}
          <Link href={`/jobs/${item.post.slug}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 text-sm leading-snug">
            {title}
          </Link>
        </div>
        <button onClick={() => onRemove(item.id)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title={t('মুছুন', 'Remove')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Deadline + district */}
      <div className="flex items-center gap-3 text-xs text-warm-muted flex-wrap">
        {item.post.district && <span>📍 {item.post.district}</span>}
        {item.post.applicationEnd && (
          <span className={`flex items-center gap-1 font-medium ${isUrgent ? 'text-red-600' : isExpired ? 'text-gray-400' : 'text-gray-600'}`}>
            📅 {isExpired
              ? t('মেয়াদ শেষ', 'Expired')
              : isUrgent
                ? t(`মাত্র ${days} দিন বাকি!`, `Only ${days} days left!`)
                : (lang === 'bn' ? formatBanglaDate(item.post.applicationEnd) : formatEnDate(item.post.applicationEnd))}
            {isUrgent && <span className="animate-pulse">⚡</span>}
          </span>
        )}
      </div>

      {/* Status pipeline */}
      <div className="flex items-center gap-1 flex-wrap">
        {STATUSES.filter(s => !['REJECTED','WITHDRAWN'].includes(s)).map((s) => {
          const c = STATUS_CONFIG[s];
          const isActive = item.status === s;
          return (
            <button
              key={s}
              onClick={() => onStatusChange(item.id, s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? `${c.bg} ${c.color} border-current shadow-sm`
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? c.dot : 'bg-gray-300'}`} />
              {t(c.label, c.labelEn)}
            </button>
          );
        })}
        {/* Rejected / Withdrawn */}
        {(['REJECTED', 'WITHDRAWN'] as SavedJobStatus[]).map((s) => {
          const c = STATUS_CONFIG[s];
          if (item.status !== s) return null;
          return (
            <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.color} border border-current`}>
              {t(c.label, c.labelEn)}
            </span>
          );
        })}
        {item.status === 'APPLIED' || item.status === 'INTERVIEW' || item.status === 'OFFER' ? (
          <button onClick={() => onStatusChange(item.id, 'REJECTED')} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all ml-auto">
            {t('প্রত্যাখ্যাত', 'Rejected')}
          </button>
        ) : null}
      </div>

      {/* Notes */}
      <div>
        {notesOpen ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('নোট লিখুন — ইন্টারভিউ তারিখ, যোগাযোগ নম্বর...', 'Add notes — interview date, contact info...')}
              className="input text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleNotesSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                {saving ? t('সংরক্ষণ হচ্ছে...', 'Saving...') : t('সংরক্ষণ', 'Save')}
              </button>
              <button onClick={() => { setNotes(item.notes ?? ''); setNotesOpen(false); }} className="btn-outline text-xs px-3 py-1.5">
                {t('বাতিল', 'Cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNotesOpen(true)} className="text-xs text-warm-muted hover:text-primary-600 flex items-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {item.notes ? item.notes.slice(0, 60) + (item.notes.length > 60 ? '…' : '') : t('নোট যোগ করুন', 'Add note')}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Profile edit modal ─────────────────────────────────────────────────── */
function EditProfileModal({ profile, token, onSave, onClose }: { profile: UserProfile; token: string; onSave: (p: UserProfile) => void; onClose: () => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUserProfile(token, name, phone);
      onSave(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">{t('প্রোফাইল সম্পাদনা', 'Edit profile')}</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="label">{t('নাম', 'Name')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label">{t('মোবাইল', 'Phone')}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="01XXXXXXXXX" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
              {saving ? t('সংরক্ষণ...', 'Saving...') : t('সংরক্ষণ করুন', 'Save changes')}
            </button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center py-2.5">
              {t('বাতিল', 'Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Avatar upload ──────────────────────────────────────────────────────── */
function AvatarUpload({ photoUrl, initials, token, onUpload, onRemove }: {
  photoUrl: string | null;
  initials: string;
  token: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError(t('সর্বোচ্চ ৫ MB', 'Max 5 MB')); return; }
    setUploading(true);
    setError('');
    try {
      const updated = await uploadProfilePhoto(token, file);
      onUpload(updated.profilePhotoUrl!);
    } catch (err: unknown) {
      setError((err as Error).message ?? t('আপলোড ব্যর্থ', 'Upload failed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative group shrink-0">
      {/* Avatar circle */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 overflow-hidden flex items-center justify-center cursor-pointer"
      >
        {photoUrl ? (
          <Image src={photoUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
        ) : (
          <span className="text-3xl font-bold">{initials}</span>
        )}

        {/* Upload overlay on hover */}
        <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Remove button — only when photo exists */}
      {photoUrl && !uploading && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
          title={t('ছবি সরান', 'Remove photo')}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {error && <p className="absolute -bottom-5 left-0 text-xs text-red-300 whitespace-nowrap">{error}</p>}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, openModal, updateUser } = useAuth();
  const { t, lang } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<UserSavedJob[]>([]);
  const [filter, setFilter] = useState<SavedJobStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const [p, j] = await Promise.all([getUserProfile(token), getSavedJobs(token)]);
      setProfile(p);
      setJobs(j);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.token) load(user.token);
    else setLoading(false);
  }, [user, load]);

  const handleStatusChange = async (id: number, status: SavedJobStatus) => {
    if (!user?.token) return;
    const job = jobs.find(j => j.id === id)!;
    const appliedAt = status === 'APPLIED' && !job.appliedAt ? new Date().toISOString() : job.appliedAt;
    const updated = await updateSavedJob(user.token, id, status, job.notes, appliedAt);
    setJobs(prev => prev.map(j => j.id === id ? updated : j));
  };

  const handleNotesChange = async (id: number, notes: string) => {
    if (!user?.token) return;
    const job = jobs.find(j => j.id === id)!;
    const updated = await updateSavedJob(user.token, id, job.status, notes || null, job.appliedAt);
    setJobs(prev => prev.map(j => j.id === id ? updated : j));
  };

  const handleRemove = async (id: number) => {
    if (!user?.token) return;
    await removeSavedJob(user.token, id);
    setJobs(prev => prev.filter(j => j.id !== id));
    setProfile(prev => prev ? { ...prev, stats: { ...prev.stats, total: prev.stats.total - 1 } } : prev);
  };

  const handlePhotoUpload = (url: string) => {
    setProfile(prev => prev ? { ...prev, profilePhotoUrl: url } : prev);
    updateUser({ photoUrl: url });
  };

  const handlePhotoRemove = async () => {
    if (!user?.token) return;
    const updated = await removeProfilePhoto(user.token);
    setProfile(updated);
    updateUser({ photoUrl: undefined });
  };

  // Not logged in
  if (!loading && !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-xl font-bold text-gray-900">{t('লগইন প্রয়োজন', 'Login required')}</h2>
            <p className="text-warm-muted text-sm">{t('প্রোফাইল দেখতে লগইন করুন', 'Please log in to view your profile')}</p>
            <button onClick={() => openModal('login')} className="btn-primary px-6 py-3">
              {t('লগইন করুন', 'Login')}
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream">
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
            {/* Profile skeleton */}
            <div className="card p-8 animate-pulse">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gray-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-48 bg-gray-200 rounded" />
                  <div className="h-4 w-64 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[0,1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const initials = user?.name?.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  const filtered = filter === 'ALL' ? jobs : jobs.filter(j => j.status === filter);
  const memberSince = profile ? new Date(profile.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pb-16">

        {/* Profile header */}
        <div className="bg-gradient-to-br from-primary-900 to-primary-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-5">
              {/* Avatar — click to upload */}
              <AvatarUpload
                photoUrl={profile?.profilePhotoUrl ?? null}
                initials={initials}
                token={user!.token}
                onUpload={handlePhotoUpload}
                onRemove={handlePhotoRemove}
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold truncate">{profile?.name ?? user?.name}</h1>
                <p className="text-white/70 text-sm mt-0.5 truncate">{profile?.email ?? user?.email}</p>
                {profile?.phone && <p className="text-white/60 text-xs mt-0.5">📞 {profile.phone}</p>}
                <p className="text-white/50 text-xs mt-1">
                  {t('সদস্য', 'Member since')} {memberSince}
                </p>
                <p className="text-white/40 text-xs mt-1 italic">
                  {t('ছবিতে ক্লিক করে ফটো আপলোড করুন', 'Click photo to upload')}
                </p>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-colors"
              >
                ✏️ {t('সম্পাদনা', 'Edit')}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon="📌" value={profile?.stats.saved ?? 0}     bn="সংরক্ষিত"    en="Saved" />
            <StatCard icon="✉️" value={profile?.stats.applied ?? 0}   bn="আবেদন"       en="Applied" />
            <StatCard icon="🎤" value={profile?.stats.interview ?? 0} bn="সাক্ষাৎকার"  en="Interview" highlight />
            <StatCard icon="🎉" value={profile?.stats.offer ?? 0}     bn="অফার"        en="Offer" highlight />
          </div>

          {/* Tracker section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">
                {t('আবেদন ট্র্যাকার', 'Application Tracker')}
                <span className="ml-2 text-sm font-normal text-warm-muted">({jobs.length})</span>
              </h2>
              <Link href="/jobs" className="text-sm text-primary-600 hover:underline font-medium">
                + {t('নতুন চাকরি খুঁজুন', 'Find more jobs')}
              </Link>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: 'ALL', bn: 'সব', en: 'All' },
                { key: 'SAVED',     ...STATUS_CONFIG.SAVED },
                { key: 'APPLIED',   ...STATUS_CONFIG.APPLIED },
                { key: 'INTERVIEW', ...STATUS_CONFIG.INTERVIEW },
                { key: 'OFFER',     ...STATUS_CONFIG.OFFER },
                { key: 'REJECTED',  ...STATUS_CONFIG.REJECTED },
              ] as const).map(({ key, label, labelEn, bg, color }) => {
                const count = key === 'ALL' ? jobs.length : jobs.filter(j => j.status === key).length;
                const isActive = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key as typeof filter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isActive
                        ? `${bg} ${color} border-current shadow-sm`
                        : 'bg-white border-warm-border text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {t(label ?? 'সব', labelEn ?? 'All')} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Job cards */}
            {filtered.length === 0 ? (
              <div className="card p-12 text-center text-warm-muted">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-medium text-gray-700 mb-1">
                  {filter === 'ALL'
                    ? t('কোনো চাকরি সংরক্ষণ করা হয়নি', 'No saved jobs yet')
                    : t('এই ক্যাটাগরিতে কিছু নেই', 'Nothing in this category')}
                </p>
                <p className="text-sm">
                  {t('চাকরির বিস্তারিত পেজে গিয়ে সংরক্ষণ করুন', 'Save jobs from the job detail page')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(item => (
                  <ApplicationCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          token={user!.token}
          onSave={(updated) => setProfile(updated)}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
