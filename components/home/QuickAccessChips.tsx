'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { toBanglaDigits } from '@/lib/utils';

interface Chip {
  href: string;
  icon: string;
  bn: string;
  en: string;
  count?: number;
}

interface Props {
  latestCount: number;
  deadlineSoonCount: number;
  totalQuestions: number;
}

export default function QuickAccessChips({ latestCount, deadlineSoonCount, totalQuestions }: Props) {
  const { t } = useLanguage();

  const chips: Chip[] = [
    { href: '/jobs',                       icon: '💼', bn: 'সর্বশেষ চাকরি', en: 'Latest Jobs',    count: latestCount },
    { href: '#deadline-soon',              icon: '⏰', bn: 'শেষ হচ্ছে',     en: 'Deadline Soon',  count: deadlineSoonCount },
    { href: '/profile',                    icon: '📌', bn: 'সংরক্ষিত',      en: 'Saved Jobs' },
    { href: '/study-corner/question-bank', icon: '📝', bn: 'MCQ অনুশীলন',   en: 'MCQ Practice',   count: totalQuestions },
    { href: '/study-corner',               icon: '📚', bn: 'স্টাডি কর্নার', en: 'Study Corner' },
  ];

  return (
    <div className="bg-white border-b border-warm-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-3">
          {chips.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-warm-border hover:border-primary hover:bg-primary-50 transition-all whitespace-nowrap shrink-0"
            >
              <span className="text-lg">{c.icon}</span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium text-gray-700">{t(c.bn, c.en)}</span>
                {typeof c.count === 'number' && c.count > 0 && (
                  <span className="text-[11px] text-warm-muted">
                    {t(`${toBanglaDigits(c.count)}+ টি`, `${c.count}+`)}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
