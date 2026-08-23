'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { toBanglaDigits } from '@/lib/utils';

export interface QuickAccessItem {
  href: string;
  icon: string;
  bn: string;
  en: string;
  count?: number;
  subtitleBn?: string; // shown instead of a count, e.g. "PDF ও নোটস"
  subtitleEn?: string;
  color: string; // icon-badge background + text color classes
}

interface Props {
  items: QuickAccessItem[];
}

// Five icon cards replacing the old text-chip row — same purpose (fast
// links into the most-used sections) but each destination now reads at a
// glance instead of blending into one long scrollable strip.
export default function QuickAccessChips({ items }: Props) {
  const { t } = useLanguage();

  return (
    <section className="bg-white border-b border-warm-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex items-center gap-3 p-3 rounded-2xl border border-warm-border hover:border-primary-300 hover:shadow-card transition-all"
            >
              <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg ${c.color}`}>
                {c.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink truncate">{t(c.bn, c.en)}</span>
                {typeof c.count === 'number' && c.count > 0 && (
                  <span className="block text-xs text-warm-muted">
                    {t(`${toBanglaDigits(c.count)}+`, `${c.count}+`)}
                  </span>
                )}
                {c.subtitleBn && (
                  <span className="block text-xs text-warm-muted truncate">{t(c.subtitleBn, c.subtitleEn ?? c.subtitleBn)}</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
