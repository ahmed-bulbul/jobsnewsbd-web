'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { getDaysRemaining, toBanglaDigits } from '@/lib/utils';
import type { PostSummary } from '@/lib/types';

interface Props {
  posts: PostSummary[];
}

export default function UrgencyTicker({ posts }: Props) {
  const { lang, t } = useLanguage();

  const urgent = posts.filter((p) => {
    const d = getDaysRemaining(p.applicationEnd);
    return d > 0 && d <= 5 && p.status === 'ONGOING';
  });

  if (urgent.length === 0) return null;

  const items = [...urgent, ...urgent]; // duplicate for seamless loop

  return (
    <div className="bg-accent border-y border-accent-dark ticker-wrap overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-2 bg-accent-dark text-white text-xs font-bold px-4 py-2.5 mr-4 rounded-r-lg">
          <span className="animate-pulse">⚡</span>
          {t('শেষ হচ্ছে', 'Ending Soon')}
        </div>

        {/* Ticker */}
        <div className="flex-1 overflow-hidden py-2">
          <div className="ticker-content flex gap-10 animate-ticker whitespace-nowrap w-max">
            {items.map((p, i) => {
              const days = getDaysRemaining(p.applicationEnd);
              const title = (lang === 'bn' && p.titleBn) ? p.titleBn : p.titleEn;
              return (
                <Link
                  key={`${p.id}-${i}`}
                  href={`/jobs/${p.slug}`}
                  className="text-sm font-medium text-white hover:underline flex items-center gap-2"
                >
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">
                    {lang === 'bn' ? `${toBanglaDigits(days)} দিন` : `${days}d`}
                  </span>
                  {title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
