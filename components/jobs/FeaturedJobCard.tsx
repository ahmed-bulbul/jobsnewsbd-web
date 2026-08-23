'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { saveJob, checkJobSaved, removeSavedJob, getSavedJobs } from '@/lib/api';
import { categoryTypeAccent, categoryTypeEmoji, getDaysRemaining, toBanglaDigits } from '@/lib/utils';
import type { PostSummary } from '@/lib/types';

interface Props {
  post: PostSummary;
  categoryTypeSlug?: string;
}

function BookmarkToggle({ postId }: { postId: number }) {
  const { user, openModal } = useAuth();
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.token) return;
    checkJobSaved(user.token, postId)
      .then(async ({ saved: isSaved }) => {
        setSaved(isSaved);
        if (isSaved) {
          const jobs = await getSavedJobs(user.token);
          const match = jobs.find((j) => j.post.id === postId);
          if (match) setSavedId(match.id);
        }
      })
      .catch(() => {});
  }, [user, postId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { openModal('login'); return; }
    setLoading(true);
    try {
      if (saved && savedId) {
        await removeSavedJob(user.token, savedId);
        setSaved(false);
        setSavedId(null);
      } else {
        const result = await saveJob(user.token, postId);
        setSaved(true);
        setSavedId(result.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Save job"
      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
        saved ? 'bg-primary-50 border-primary text-primary' : 'bg-white border-warm-border text-gray-400 hover:text-primary hover:border-primary'
      }`}
    >
      <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}

export default function FeaturedJobCard({ post, categoryTypeSlug }: Props) {
  const { lang, t } = useLanguage();
  const title = (lang === 'bn' && post.titleBn) ? post.titleBn : post.titleEn;
  const days = getDaysRemaining(post.applicationEnd);
  const isNew = !!post.publishedAt && (Date.now() - new Date(post.publishedAt).getTime()) < 3 * 86_400_000;
  const isHot = !isNew && days > 0 && days <= 3 && post.status === 'ONGOING';
  const accent = categoryTypeAccent(categoryTypeSlug);
  const emoji = categoryTypeEmoji(categoryTypeSlug ?? '');

  return (
    <div className="card w-64 shrink-0 snap-start p-4 flex flex-col gap-3">
      {/* Top row: badge + bookmark */}
      <div className="flex items-center justify-between">
        {isNew ? (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            {t('নতুন', 'New')}
          </span>
        ) : isHot ? (
          <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {t('হট', 'Hot')}
          </span>
        ) : <span />}
        <BookmarkToggle postId={post.id} />
      </div>

      {/* Avatar + org/title */}
      <Link href={`/jobs/${post.slug}`} className="flex-1 flex flex-col gap-2 group">
        {post.organizationLogoUrl ? (
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-warm-border relative shrink-0 bg-white">
            <Image src={post.organizationLogoUrl} alt={post.organizationName ?? ''} fill className="object-contain p-1" unoptimized />
          </div>
        ) : (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${accent}`}>
            {emoji}
          </div>
        )}
        {post.organizationName && (
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide truncate">
            {post.organizationName}
          </p>
        )}
        <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-warm-muted mt-auto pt-1">
          {post.district && (
            <span className="flex items-center gap-1 truncate">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {post.district}
            </span>
          )}
          {days !== Infinity && days > 0 && (
            <span className={`flex items-center gap-1 shrink-0 ${days <= 3 ? 'text-accent-dark font-semibold' : ''}`}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t(`${toBanglaDigits(days)} দিন বাকি`, `${days}d left`)}
            </span>
          )}
        </div>
      </Link>

      <Link
        href={`/jobs/${post.slug}`}
        className="btn-primary text-xs w-full justify-center py-2"
      >
        {t('আবেদন করুন', 'Apply Now')}
      </Link>
    </div>
  );
}
