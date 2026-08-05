'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { getDaysRemaining, toBanglaDigits } from '@/lib/utils';
import T from '@/components/ui/T';
import type { PostSummary } from '@/lib/types';

interface Props {
  posts: PostSummary[];
}

export default function DeadlineSoonList({ posts }: Props) {
  const { lang, t } = useLanguage();

  if (posts.length === 0) return null;

  return (
    <div id="deadline-soon" className="card p-5 scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
          <span className="text-red-500">⏰</span>
          <T bn="শেষ হচ্ছে শীঘ্রই" en="Deadline Soon" />
        </h3>
        <Link href="/jobs" className="text-xs text-primary-600 hover:text-primary font-medium hover:underline">
          <T bn="সব দেখুন →" en="View All →" />
        </Link>
      </div>
      <div className="space-y-3">
        {posts.map((p) => {
          const days = getDaysRemaining(p.applicationEnd);
          const title = (lang === 'bn' && p.titleBn) ? p.titleBn : p.titleEn;
          return (
            <Link
              key={p.id}
              href={`/jobs/${p.slug}`}
              className="flex items-start justify-between gap-3 group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                  {title}
                </p>
                {p.organizationName && (
                  <p className="text-xs text-warm-muted mt-0.5 truncate">{p.organizationName}</p>
                )}
              </div>
              <span className="shrink-0 text-xs font-bold text-red-600 bg-red-50 rounded-full px-2 py-1 whitespace-nowrap">
                {t(`${toBanglaDigits(days)} দিন`, `${days}d`)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
