'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { formatBanglaDate, formatEnDate, getDaysRemaining } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import DeadlineBar from './DeadlineBar';
import type { PostSummary } from '@/lib/types';

interface Props {
  post: PostSummary;
  categoryTypeSlug?: string;
}

const LEFT_BORDER: Record<string, string> = {
  government: 'border-l-primary-500',
  bank:       'border-l-blue-600',
  ngo:        'border-l-amber-500',
  private:    'border-l-violet-500',
};

export default function JobCard({ post, categoryTypeSlug }: Props) {
  const { lang, t } = useLanguage();
  const borderColor = LEFT_BORDER[categoryTypeSlug ?? ''] ?? 'border-l-warm-muted';
  const title = (lang === 'bn' && post.titleBn) ? post.titleBn : post.titleEn;
  const days = getDaysRemaining(post.applicationEnd);
  const isEndingSoon = days > 0 && days <= 3 && post.status === 'ONGOING';

  return (
    <Link href={`/jobs/${post.slug}`} className="block group">
      <article className={`card border-l-4 ${borderColor} p-5 flex flex-col gap-3 h-full`}>
        {/* Deadline progress bar */}
        <DeadlineBar
          applicationStart={post.applicationStart}
          applicationEnd={post.applicationEnd}
          status={post.status}
        />

        {/* Top row: status + category + ending soon */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={post.status} />
          {(post.categoryNameBn || post.categoryNameEn) && (
            <span className="text-xs text-warm-muted">
              {lang === 'bn' ? post.categoryNameBn : (post.categoryNameEn ?? post.categoryNameBn)}
            </span>
          )}
          {isEndingSoon && (
            <span className="ml-auto text-xs font-bold text-red-600 animate-pulse flex items-center gap-1">
              ⚡ {t('শেষ হচ্ছে', 'Ending soon')}
            </span>
          )}
        </div>

        {/* Organization */}
        {post.organizationName && (
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
            {post.organizationName}
          </p>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-warm-muted flex-wrap mt-auto">
          {post.district && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {post.district}
            </span>
          )}
          {(post.postTypeNameBn || post.postTypeNameEn) && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {lang === 'bn' ? post.postTypeNameBn : (post.postTypeNameEn ?? post.postTypeNameBn)}
            </span>
          )}
        </div>

        {/* Deadline */}
        {post.applicationEnd && (
          <div className="pt-3 border-t border-warm-border">
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">
                {t('শেষ তারিখ: ', 'Deadline: ')}
              </span>
              {lang === 'bn'
                ? formatBanglaDate(post.applicationEnd)
                : formatEnDate(post.applicationEnd)}
            </p>
          </div>
        )}
      </article>
    </Link>
  );
}
