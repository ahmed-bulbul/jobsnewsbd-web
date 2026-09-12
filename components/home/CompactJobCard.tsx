'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { BookmarkToggle } from '@/components/jobs/FeaturedJobCard';
import { categoryTypeAccent, categoryTypeEmoji, getDaysRemaining, toBanglaDigits, formatBanglaDate, formatEnDate } from '@/lib/utils';
import type { PostSummary } from '@/lib/types';

interface Props {
  post: PostSummary;
  categoryTypeSlug?: string;
}

export default function CompactJobCard({ post, categoryTypeSlug }: Props) {
  const { lang, t } = useLanguage();
  const title = (lang === 'bn' && post.titleBn) ? post.titleBn : post.titleEn;
  const days = getDaysRemaining(post.applicationEnd);
  const accent = categoryTypeAccent(categoryTypeSlug);
  const emoji = categoryTypeEmoji(categoryTypeSlug ?? '');
  const deadline = lang === 'bn' ? formatBanglaDate(post.applicationEnd) : formatEnDate(post.applicationEnd);

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Top row: logo + org/title + bookmark */}
      <div className="flex items-start gap-3">
        {post.organizationLogoUrl ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-warm-border relative shrink-0 bg-white">
            <Image src={post.organizationLogoUrl} alt={post.organizationName ?? ''} fill className="object-contain p-1" unoptimized />
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${accent}`}>
            {emoji}
          </div>
        )}
        <Link href={`/jobs/${post.slug}`} className="flex-1 min-w-0 group">
          {post.organizationName && (
            <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wide truncate">
              {post.organizationName}
            </p>
          )}
          <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
        </Link>
        <BookmarkToggle postId={post.id} />
      </div>

      {/* Badge row */}
      {(days <= 5 || categoryTypeSlug) && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {days !== Infinity && days <= 5 && days > 0 && (
            <span className="bg-accent/15 text-accent-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
              {t(`${toBanglaDigits(days)} দিন বাকি`, `${days}d left`)}
            </span>
          )}
          {days !== Infinity && days <= 0 && (
            <span className="bg-accent/15 text-accent-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
              {t('আজই শেষ', 'Ends today')}
            </span>
          )}
          {categoryTypeSlug && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryTypeAccent(categoryTypeSlug)}`}>
              {t(post.categoryNameBn, post.categoryNameEn ?? post.categoryNameBn)}
            </span>
          )}
        </div>
      )}

      {/* Meta list */}
      <div className="flex flex-col gap-1.5">
        {post.district && (
          <div className="flex items-center gap-1.5 text-xs text-warm-muted">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{post.district}</span>
          </div>
        )}
        {deadline && (
          <div className="flex items-center gap-1.5 text-xs text-warm-muted">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{deadline}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <Link href={`/jobs/${post.slug}`} className="btn-primary flex-1 justify-center text-xs py-2">
          {t('আবেদন করুন', 'Apply Now')}
        </Link>
        <Link href={`/jobs/${post.slug}`} className="btn-outline flex-1 justify-center text-xs py-2">
          {t('বিস্তারিত', 'Details')}
        </Link>
      </div>
    </div>
  );
}
