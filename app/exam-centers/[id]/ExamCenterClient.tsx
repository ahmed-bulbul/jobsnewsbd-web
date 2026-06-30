'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  getExamCenterTips,
  addCenterTip,
  deleteCenterTip,
  toggleTipUpvote,
  castMobileVote,
} from '@/lib/api';
import type { CenterTip, ExamCenterDetail, TipCategory } from '@/lib/types';

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: { value: TipCategory | ''; labelBn: string; labelEn: string; icon: string }[] = [
  { value: '',              labelBn: 'সব',           labelEn: 'All',           icon: '📋' },
  { value: 'TRANSPORT',    labelBn: 'বাস / রুট',    labelEn: 'Bus Route',     icon: '🚌' },
  { value: 'MOBILE',       labelBn: 'মোবাইল নীতি', labelEn: 'Mobile Policy', icon: '📱' },
  { value: 'TIMING',       labelBn: 'সময়সূচি',    labelEn: 'Timing',        icon: '⏰' },
  { value: 'FOOD',         labelBn: 'খাবার',        labelEn: 'Food',          icon: '🍱' },
  { value: 'ACCOMMODATION',labelBn: 'থাকার জায়গা', labelEn: 'Stay',          icon: '🏨' },
  { value: 'GENERAL',      labelBn: 'সাধারণ',       labelEn: 'General',       icon: '💬' },
];

function categoryLabel(cat: TipCategory, lang: 'bn' | 'en') {
  const found = CATEGORIES.find((c) => c.value === cat);
  return found ? (lang === 'bn' ? found.labelBn : found.labelEn) : cat;
}

function categoryIcon(cat: TipCategory) {
  return CATEGORIES.find((c) => c.value === cat)?.icon ?? '💬';
}

// ── Mobile vote widget ────────────────────────────────────────────────────────

function MobileVoteWidget({
  centerId,
  stats,
  onUpdate,
}: {
  centerId: number;
  stats: ExamCenterDetail['mobileVote'];
  onUpdate: (d: ExamCenterDetail) => void;
}) {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [loading, setLoading] = useState(false);

  const vote = async (allowed: boolean) => {
    if (!user) { openModal('login'); return; }
    if (loading) return;
    setLoading(true);
    try {
      const updated = await castMobileVote(centerId, user.token, allowed);
      onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  const total = stats.allowed + stats.notAllowed;
  const pct = total > 0 ? Math.round((stats.allowed / total) * 100) : null;

  return (
    <div className="bg-white rounded-2xl border border-warm-border p-5">
      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <span className="text-xl">📱</span>
        {t('মোবাইল অনুমতি আছে কি?', 'Is mobile allowed?')}
      </h3>
      <p className="text-xs text-warm-muted mb-4">
        {t('পরীক্ষার হলে মোবাইল নিয়ে যাওয়া যায় কিনা জানান', 'Tell others if mobile is permitted in exam hall')}
      </p>

      {pct !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>✅ {t('অনুমতি আছে', 'Allowed')} ({stats.allowed})</span>
            <span>❌ {t('নেই', 'Not allowed')} ({stats.notAllowed})</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-center text-sm font-semibold text-emerald-700 mt-1.5">{pct}% {t('বলছেন অনুমতি আছে', 'say allowed')}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => vote(true)}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
            stats.userVote === true
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          ✅ {t('হ্যাঁ, যায়', 'Yes, allowed')}
        </button>
        <button
          onClick={() => vote(false)}
          disabled={loading}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
            stats.userVote === false
              ? 'bg-red-500 border-red-500 text-white'
              : 'border-red-300 text-red-600 hover:bg-red-50'
          }`}
        >
          ❌ {t('না, যায় না', 'No, not allowed')}
        </button>
      </div>
      {stats.userVote !== null && stats.userVote !== undefined && (
        <p className="text-center text-xs text-warm-muted mt-2">
          {t('আপনি ইতিমধ্যে ভোট দিয়েছেন — পরিবর্তন করতে ক্লিক করুন', 'You already voted — click to change')}
        </p>
      )}
    </div>
  );
}

// ── Tip card ──────────────────────────────────────────────────────────────────

function TipCard({
  tip,
  userId,
  onUpvote,
  onDelete,
}: {
  tip: CenterTip;
  userId?: number;
  onUpvote: (tipId: number) => void;
  onDelete: (tipId: number) => void;
}) {
  const { lang, t } = useLanguage();
  const { user, openModal } = useAuth();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-warm-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Category badge */}
        <span className="text-2xl flex-shrink-0 mt-0.5">{categoryIcon(tip.category)}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs bg-primary-50 text-primary-700 rounded-full px-2 py-0.5 font-medium">
              {categoryLabel(tip.category, lang)}
            </span>
            <span className="text-xs text-warm-muted">{tip.authorName} · {formatDate(tip.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{tip.body}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-warm-border">
        <button
          onClick={() => {
            if (!user) { openModal('login'); return; }
            onUpvote(tip.id);
          }}
          className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg transition-colors ${
            tip.userUpvoted
              ? 'bg-primary-50 text-primary font-semibold'
              : 'text-warm-muted hover:text-primary hover:bg-primary-50'
          }`}
        >
          <svg className="w-4 h-4" fill={tip.userUpvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          {tip.upvoteCount}
        </button>

        {userId === tip.authorId && (
          <button
            onClick={() => onDelete(tip.id)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
          >
            {t('মুছুন', 'Delete')}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add tip form ──────────────────────────────────────────────────────────────

function AddTipForm({ centerId, onAdded }: { centerId: number; onAdded: (tip: CenterTip) => void }) {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<TipCategory>('TRANSPORT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { openModal('login'); return; }
    if (!body.trim()) { setError(t('টিপস লিখুন', 'Write your tip')); return; }
    setSubmitting(true);
    setError('');
    try {
      const tip = await addCenterTip(centerId, user.token, category, body.trim());
      onAdded(tip);
      setBody('');
    } catch {
      setError(t('কিছু ভুল হয়েছে', 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center">
        <p className="text-sm text-primary-800 mb-3">
          {t('টিপস শেয়ার করতে লগইন করুন', 'Login to share a tip')}
        </p>
        <button onClick={() => openModal('login')} className="btn-primary text-sm px-4 py-2">
          {t('লগইন করুন', 'Login')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-warm-border p-4">
      <h4 className="font-semibold text-gray-900 mb-3">{t('টিপস শেয়ার করুন', 'Share a Tip')}</h4>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as TipCategory)}
        className="w-full mb-3 px-3 py-2 rounded-lg border border-warm-border text-sm focus:outline-none focus:border-primary bg-white"
      >
        {CATEGORIES.filter((c) => c.value !== '').map((c) => (
          <option key={c.value} value={c.value}>
            {c.icon} {c.labelBn} / {c.labelEn}
          </option>
        ))}
      </select>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder={t('আপনার অভিজ্ঞতা লিখুন...', 'Share your experience...')}
        className="w-full px-3 py-2 rounded-lg border border-warm-border text-sm focus:outline-none focus:border-primary resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        {error ? <p className="text-xs text-red-600">{error}</p> : <span className="text-xs text-warm-muted">{body.length}/500</span>}
        <button type="submit" disabled={submitting} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
          {submitting ? t('পাঠাচ্ছি...', 'Sending...') : t('পোস্ট করুন', 'Post')}
        </button>
      </div>
    </form>
  );
}

// ── Tips section ──────────────────────────────────────────────────────────────

function TipsSection({ centerId }: { centerId: number }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [tips, setTips] = useState<CenterTip[]>([]);
  const [activeCategory, setActiveCategory] = useState<TipCategory | ''>('');
  const [loading, setLoading] = useState(true);

  const loadTips = useCallback(async (cat: TipCategory | '') => {
    setLoading(true);
    try {
      const data = await getExamCenterTips(centerId, cat || undefined, user?.token);
      setTips(Array.isArray(data) ? data : []);
    } catch {
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, [centerId, user?.token]);

  useEffect(() => { loadTips(activeCategory); }, [loadTips, activeCategory]);

  const handleUpvote = async (tipId: number) => {
    if (!user) return;
    const updated = await toggleTipUpvote(tipId, user.token);
    setTips((prev) => prev.map((t) => (t.id === tipId ? updated : t)));
  };

  const handleDelete = async (tipId: number) => {
    if (!user) return;
    await deleteCenterTip(tipId, user.token);
    setTips((prev) => prev.filter((t) => t.id !== tipId));
  };

  const handleAdded = (tip: CenterTip) => {
    setTips((prev) => [tip, ...prev]);
  };

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('কমিউনিটি টিপস', 'Community Tips')}</h2>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value as TipCategory | '')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === c.value
                ? 'bg-primary text-white'
                : 'bg-white border border-warm-border text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {c.icon} {lang === 'bn' ? c.labelBn : c.labelEn}
          </button>
        ))}
      </div>

      <AddTipForm centerId={centerId} onAdded={handleAdded} />

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-warm-border p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
          ))
        ) : tips.length === 0 ? (
          <div className="text-center py-10 text-warm-muted">
            <span className="text-4xl mb-2 block">💬</span>
            <p className="text-sm">{t('এখনো কোনো টিপস নেই — প্রথম হন!', 'No tips yet — be the first!')}</p>
          </div>
        ) : (
          tips.map((tip) => (
            <TipCard
              key={tip.id}
              tip={tip}
              userId={user?.userId}
              onUpvote={handleUpvote}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export default function ExamCenterClient({ center: initialCenter }: { center: ExamCenterDetail }) {
  const { t } = useLanguage();
  const [center, setCenter] = useState(initialCenter);

  return (
    <main className="min-h-screen bg-warm-bg">
      {/* Hero photo / header */}
      <div className="relative">
        {center.photoUrl ? (
          <div className="relative h-56 sm:h-72 w-full overflow-hidden">
            <Image src={center.photoUrl} alt={center.nameBn} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
            <div className="absolute bottom-0 left-0 p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">{center.nameBn}</h1>
              <p className="text-white/80 text-sm mt-1">{center.nameEn}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-10 px-4">
            <div className="max-w-4xl mx-auto">
              <Link href="/exam-centers" className="text-primary-300 text-sm hover:text-white mb-4 inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {t('পরীক্ষা কেন্দ্র তালিকা', 'All Centers')}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold">{center.nameBn}</h1>
              <p className="text-primary-200 text-sm mt-1">{center.nameEn}</p>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {center.photoUrl && (
          <Link href="/exam-centers" className="text-primary text-sm hover:underline mb-4 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('পরীক্ষা কেন্দ্র তালিকা', 'All Centers')}
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: info + mobile vote */}
          <div className="md:col-span-1 space-y-4">
            {/* Info card */}
            <div className="bg-white rounded-2xl border border-warm-border p-5 space-y-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-xs text-warm-muted font-medium">{t('এলাকা', 'Area')}</p>
                  <p className="text-sm text-gray-800">{center.area}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div>
                  <p className="text-xs text-warm-muted font-medium">{t('ঠিকানা', 'Address')}</p>
                  <p className="text-sm text-gray-800">{center.address}</p>
                </div>
              </div>

              {center.mapsUrl && (
                <a
                  href={center.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full mt-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {t('গুগল ম্যাপে দেখুন', 'View on Google Maps')}
                </a>
              )}
            </div>

            {/* Mobile vote */}
            <MobileVoteWidget
              centerId={center.id}
              stats={center.mobileVote}
              onUpdate={setCenter}
            />
          </div>

          {/* Right: tips */}
          <div className="md:col-span-2">
            <TipsSection centerId={center.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
